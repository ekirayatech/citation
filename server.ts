import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  AuthorizedSchoolUser,
  DEFAULT_AUTHORIZED_USERS,
  DEFAULT_REPO_HEADERS,
  DEFAULT_REPO_ROWS,
  DEFAULT_USUARIOS_HEADERS,
} from './src/data/repositorioDefaultData';
import { CmsPage } from './src/types/cms';
import { DEFAULT_CMS_PAGES } from './src/data/defaultCmsPages';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CMS_FILE_PATH = path.join(__dirname, '.ekiraya-cms-pages.json');

function loadPersistedCmsPages(): CmsPage[] {
  try {
    if (fs.existsSync(CMS_FILE_PATH)) {
      const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_CMS_PAGES;
}

function savePersistedCmsPages(pages: CmsPage[]): void {
  try {
    fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(pages, null, 2), 'utf-8');
  } catch {
    // Ignore write error
  }
}

function broadcastCmsUpdate(pages: CmsPage[], eventType = 'CMS_UPDATE'): void {
  const payload = JSON.stringify({ type: eventType, pages, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SOCRATIC_TUTOR_SYSTEM_INSTRUCTION = `Eres el "Tutor Socrático de Citación y Referencias" del Colegio Ekirayá (Cita Master).
Tu función es educar, orientar y acompañar a los estudiantes para que aprendan a buscar, analizar y formular sus citas y referencias bajo normas académicas (principalmente APA 7.ª edición, así como MLA 9, Chicago 17 e Icontec).

REGLA DE ORO PEDAGÓGICA (OBLIGATORIA Y ESTRICTA):
- BAJO NINGUNA CIRCUNSTANCIA debes entregar la cita o la referencia final terminada o lista para copiar y pegar (ejemplo: NUNCA generes cadenas listas para copiar como "García, G. (1967). Cien años de soledad...").
- Si el estudiante te pide: "Hazme la cita", "Dime cómo queda", "Escríbeme la referencia completa", o te pega un enlace/título y te pide que se lo hagas, responde amablemente que tu función es enseñarle a hacerlo él mismo para que desarrolle habilidades de investigación.
- En su lugar, debes proceder SIEMPRE de la siguiente manera:
  1. Desglosa los 4 pilares fundamentales de toda referencia:
     • Autor (¿Quién lo creó? ¿Es una persona, varios autores, o una entidad/autor corporativo como la UNESCO o el MinEducación?).
     • Fecha (¿Cuándo se publicó? ¿Año? ¿Y si no tiene fecha, qué sigla se usa?).
     • Título (¿Cómo se llama la obra? Explica si debe ir en cursiva o no, según si es un libro completo o un artículo dentro de una revista).
     • Fuente / Recuperación (¿Dónde se consulta? Editorial, revista con volumen/páginas, o DOI / URL directa).
  2. Haz preguntas orientadoras específicas según lo que el estudiante tenga en su formulario o en su consulta.
  3. Si el estudiante comparte un borrador de cita o referencia que intentó hacer:
     • Elogia su esfuerzo.
     • Señálale qué elementos tiene correctos.
     • Guíalo con preguntas para que detecte lo que le falta o lo que debe corregir (orden de autor, uso de cursiva, paréntesis, punto final, etc.).
  4. Si pregunta sobre citas dentro del texto:
     • Pregúntale si quiere destacar al autor en la redacción (cita narrativa) o destacar la idea (cita entre paréntesis).
     • Explícale la lógica de la regla (por ejemplo: ¿qué pasa si son 3 o más autores en APA 7? Pregúntale si conoce la locución "et al.").
  5. Mantén respuestas concisas, pedagógicas, cálidas y motivadoras (máximo 2 a 3 párrafos cortos o listas con viñetas claras), finalizando SIEMPRE con una pregunta reflexiva para que el estudiante dé el siguiente paso.`;

const PORT = 3000;
const STATE_FILE_PATH = path.join(__dirname, '.ekiraya-repo-state.json');

interface PersistedRepoState {
  appsScriptExecUrl: string;
  connectionUrl: string;
  repoTabName: string;
  accessToken: string;
  lastSyncDate: string | null;
  lastSyncTimestamp: number | null;
  rawHeaders: string[];
  rawRows: Record<string, string>[];
  usuariosHeaders: string[];
  usuariosRows: Record<string, string>[];
  authorizedUsers: AuthorizedSchoolUser[];
}

const DEFAULT_ADMIN_USER: AuthorizedSchoolUser = DEFAULT_AUTHORIZED_USERS[0];

function normalizeHeaderKey(str: string): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHtmlContent(text: string): boolean {
  const trimmed = String(text || '').trim().slice(0, 300).toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('accounts.google.com') ||
    trimmed.includes('servicelogin')
  );
}

function parseCsvToRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvText || isHtmlContent(csvText)) {
    return { headers: [], rows: [] };
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentVal += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentVal += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        currentRow.push(currentVal.trim());
        if (currentRow.some((cell) => cell !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += ch;
      }
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((cell) => cell !== '')) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map((h, idx) => h || `Columna_${idx + 1}`);
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowArr = lines[r];
    if (rowArr.every((c) => !c)) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, cIdx) => {
      obj[h] = rowArr[cIdx] || '';
    });
    rows.push(obj);
  }

  return { headers, rows };
}

function isUsersSheetData(headers: string[], rows: Record<string, string>[] = []): boolean {
  if (!headers || headers.length === 0) return false;
  const normHeaders = headers.map((h) => normalizeHeaderKey(h));
  const joined = normHeaders.join(' | ');

  // Si tiene columnas típicas de monografías, NO es la hoja de usuarios
  if (
    joined.includes('documento id') ||
    joined.includes('palabras clave') ||
    joined.includes('linea de investigacion') ||
    joined.includes('monografia') ||
    joined.includes('nombre del archivo') ||
    joined.includes('unidad academica') ||
    joined.includes('asignatura') ||
    joined.includes('ano lectivo')
  ) {
    return false;
  }

  const hasEmailHeader = normHeaders.some((h) =>
    /correo|email|e mail|mail|cuenta|usuario/.test(h)
  );
  const hasUserMetaHeader = normHeaders.some((h) =>
    /curso|seccion|perfil|rol|grado|estamento/.test(h)
  );

  if (hasEmailHeader || (hasUserMetaHeader && normHeaders.some((h) => /nombre/.test(h)))) {
    return true;
  }

  // Verificar si las filas contienen correos electrónicos
  if (rows && rows.length > 0) {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const sampleRowValues = Object.values(rows[r] || {}).join(' ');
      if (sampleRowValues.includes('@') && !sampleRowValues.includes('drive.google.com')) {
        return true;
      }
    }
  }

  return false;
}

function isMonographsSheetData(headers: string[], rows: Record<string, string>[] = []): boolean {
  if (!headers || headers.length === 0) return false;
  if (isUsersSheetData(headers, rows)) return false;

  const joined = headers.map((h) => normalizeHeaderKey(h)).join(' | ');
  return (
    joined.includes('documento id') ||
    joined.includes('palabras clave') ||
    joined.includes('linea de investigacion') ||
    joined.includes('resumen') ||
    joined.includes('asesor') ||
    joined.includes('monografia') ||
    joined.includes('titulo') ||
    joined.includes('archivo') ||
    joined.includes('asignatura') ||
    joined.includes('unidad') ||
    joined.includes('autor') ||
    joined.includes('ano') ||
    joined.includes('drive') ||
    joined.includes('enlace')
  );
}

function parseUsersSheetRows(
  rows: Record<string, string>[],
  headers: string[]
): AuthorizedSchoolUser[] {
  if (!rows || rows.length === 0) return DEFAULT_AUTHORIZED_USERS;

  const findHeader = (patterns: RegExp[]): string => {
    for (const p of patterns) {
      const match = headers.find((h) => p.test(normalizeHeaderKey(h)));
      if (match) return match;
    }
    return '';
  };

  const cursoCol = findHeader([/^curso$/, /^grado$/, /curso/, /grado/, /nivel/]);
  const seccionCol = findHeader([/^seccion$/, /seccion/, /dependencia/, /area/]);
  const nombresCol = findHeader([
    /^nombre y apellido$/,
    /nombre.*apellido/,
    /^nombres?$/,
    /nombre.*completo/,
    /nombre/,
    /estudiante/,
    /usuario/,
  ]);
  const correoCol = findHeader([
    /^correo institucional$/,
    /correo.*institucional/,
    /^correo$/,
    /correo/,
    /email/,
    /e mail/,
    /mail/,
    /cuenta/,
  ]);
  const perfilCol = findHeader([
    /^perfil$/,
    /perfil/,
    /^rol$/,
    /rol/,
    /^administrador$/,
    /^admin$/,
    /estamento/,
    /cargo/,
  ]);

  const parsedUsers: AuthorizedSchoolUser[] = [];

  rows.forEach((row) => {
    let correo = (correoCol && row[correoCol]) || '';
    if (!correo || !correo.includes('@')) {
      const emailCell = Object.values(row).find((v) => {
        const str = String(v || '').trim();
        return str.includes('@') && !str.includes('drive.google.com') && !str.includes('http');
      });
      if (emailCell) correo = String(emailCell);
    }
    correo = correo.trim().toLowerCase();

    const rawName = (nombresCol && row[nombresCol]) ? String(row[nombresCol]).trim() : '';
    if (!correo && !rawName) return;

    if (!correo) {
      return;
    }

    const nombres =
      rawName ||
      correo
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const curso = ((cursoCol && row[cursoCol]) || 'General').trim();
    const seccion = ((seccionCol && row[seccionCol]) || 'General').trim();
    let perfil = ((perfilCol && row[perfilCol]) || '').trim();

    const combinedText = `${perfil} ${seccion} ${curso}`.toLowerCase();

    if (!perfil) {
      if (/admin|administrador|coordinador|directivo|rector|sistemas/i.test(combinedText)) {
        perfil = 'Administrador';
      } else if (/docente|profesor|maestro|guia|guía/i.test(combinedText)) {
        perfil = 'Docente';
      } else if (/no clases|administrativo|apoyo|servicios|planta/i.test(combinedText)) {
        perfil = 'Personal no clases';
      } else {
        perfil = 'Estudiante';
      }
    }

    const isAdmin =
      correo === 'mebolanos@cem.edu.co' ||
      /admin|administrador|coordinador|directivo|sistemas|^si$|^sí$|^true$|^1$/i.test(perfil) ||
      /admin|administrador/i.test(combinedText);

    parsedUsers.push({
      curso,
      seccion,
      nombres,
      correo,
      perfil,
      isAdmin,
      createdInApp: false,
      syncedToSheet: true,
      rawRow: { ...row },
    });
  });

  if (!parsedUsers.some((u) => u.correo.toLowerCase() === 'mebolanos@cem.edu.co')) {
    parsedUsers.unshift(DEFAULT_ADMIN_USER);
  }

  return parsedUsers;
}

function mergeUsersLists(
  sheetUsers: AuthorizedSchoolUser[],
  existingUsers: AuthorizedSchoolUser[]
): AuthorizedSchoolUser[] {
  // Si recibimos usuarios directamente de Google Sheets, la hoja es la fuente autorizada de la verdad
  if (sheetUsers && sheetUsers.length > 0) {
    const map = new Map<string, AuthorizedSchoolUser>();

    // Mauricio Bolaños (admin institucional) siempre preservado
    map.set(DEFAULT_ADMIN_USER.correo.toLowerCase(), DEFAULT_ADMIN_USER);

    // Los usuarios leídos de Google Sheets tienen prioridad absoluta (reflejan altas, bajas y ediciones en la hoja)
    for (const u of sheetUsers) {
      if (u && u.correo) {
        const key = u.correo.trim().toLowerCase();
        map.set(key, {
          ...u,
          correo: key,
          isAdmin: Boolean(u.isAdmin || key === 'mebolanos@cem.edu.co'),
          createdInApp: false,
          syncedToSheet: true,
          rawRow: u.rawRow ? { ...u.rawRow } : undefined,
        });
      }
    }

    // Mantener usuarios creados localmente en la app que aún estén en tránsito de sincronización
    for (const u of existingUsers || []) {
      if (u && u.correo && u.createdInApp && !u.syncedToSheet) {
        const key = u.correo.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, u);
        }
      }
    }

    return Array.from(map.values());
  }

  // Fallback cuando aún no se ha conectado ni leído la hoja "usuarios" de Google Sheets
  const map = new Map<string, AuthorizedSchoolUser>();
  for (const defUser of DEFAULT_AUTHORIZED_USERS) {
    map.set(defUser.correo.toLowerCase(), defUser);
  }
  for (const u of existingUsers || []) {
    if (u && u.correo) {
      map.set(u.correo.trim().toLowerCase(), u);
    }
  }
  return Array.from(map.values());
}

function loadPersistedState(): PersistedRepoState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const hasValidMonoRows =
        Array.isArray(parsed.rawRows) &&
        parsed.rawRows.length > 0 &&
        Array.isArray(parsed.rawHeaders) &&
        isMonographsSheetData(parsed.rawHeaders, parsed.rawRows);

      const parsedUsers = Array.isArray(parsed.authorizedUsers) ? parsed.authorizedUsers : [];
      let effectiveUsers: AuthorizedSchoolUser[];
      if (Array.isArray(parsed.usuariosRows) && parsed.usuariosRows.length > 0) {
        const fromRows = parseUsersSheetRows(
          parsed.usuariosRows,
          parsed.usuariosHeaders || DEFAULT_USUARIOS_HEADERS
        );
        effectiveUsers = mergeUsersLists(fromRows, parsedUsers);
      } else if (parsedUsers.some((u: AuthorizedSchoolUser) => u && u.syncedToSheet)) {
        effectiveUsers = mergeUsersLists(parsedUsers, []);
      } else {
        effectiveUsers = mergeUsersLists([], parsedUsers.length > 0 ? parsedUsers : DEFAULT_AUTHORIZED_USERS);
      }

      return {
        appsScriptExecUrl:
          parsed.appsScriptExecUrl ||
          process.env.APPS_SCRIPT_URL ||
          process.env.GOOGLE_APPS_SCRIPT_URL ||
          process.env.VITE_APPS_SCRIPT_URL ||
          '',
        connectionUrl:
          parsed.connectionUrl ||
          process.env.GOOGLE_SHEETS_URL ||
          process.env.SHEETS_CONNECTION_URL ||
          process.env.VITE_GOOGLE_SHEETS_URL ||
          '',
        repoTabName: parsed.repoTabName || process.env.REPO_TAB_NAME || 'repositorio',
        accessToken: parsed.accessToken || process.env.ACCESS_TOKEN || 'EKIRAYA-2026',
        lastSyncDate: parsed.lastSyncDate || new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: parsed.lastSyncTimestamp || Date.now(),
        rawHeaders: hasValidMonoRows ? parsed.rawHeaders : DEFAULT_REPO_HEADERS,
        rawRows: hasValidMonoRows ? parsed.rawRows : DEFAULT_REPO_ROWS,
        usuariosHeaders:
          Array.isArray(parsed.usuariosHeaders) && parsed.usuariosHeaders.length > 0
            ? parsed.usuariosHeaders
            : DEFAULT_USUARIOS_HEADERS,
        usuariosRows: Array.isArray(parsed.usuariosRows) ? parsed.usuariosRows : [],
        authorizedUsers: effectiveUsers,
      };
    }
  } catch {
    // Ignore read error
  }
  return {
    appsScriptExecUrl:
      process.env.APPS_SCRIPT_URL ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      process.env.VITE_APPS_SCRIPT_URL ||
      '',
    connectionUrl:
      process.env.GOOGLE_SHEETS_URL ||
      process.env.SHEETS_CONNECTION_URL ||
      process.env.VITE_GOOGLE_SHEETS_URL ||
      '',
    repoTabName: process.env.REPO_TAB_NAME || 'repositorio',
    accessToken: process.env.ACCESS_TOKEN || 'EKIRAYA-2026',
    lastSyncDate: new Date().toLocaleString('es-CO'),
    lastSyncTimestamp: Date.now(),
    rawHeaders: DEFAULT_REPO_HEADERS,
    rawRows: DEFAULT_REPO_ROWS,
    usuariosHeaders: DEFAULT_USUARIOS_HEADERS,
    usuariosRows: [],
    authorizedUsers: DEFAULT_AUTHORIZED_USERS,
  };
}

function savePersistedState(state: PersistedRepoState): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write error
  }
}

async function pushUserToAppsScriptFromServer(
  scriptUrl: string,
  token: string,
  user: AuthorizedSchoolUser,
  originalEmail?: string,
  action: 'addUser' | 'updateUser' = 'addUser'
): Promise<{
  pushed: boolean;
  updatedUsers: AuthorizedSchoolUser[] | null;
  usuariosHeaders?: string[];
  usuariosRows?: Record<string, string>[];
  repoHeaders?: string[];
  repoRows?: Record<string, string>[];
}> {
  const cleanUrl = (scriptUrl || '').trim();
  if (!cleanUrl || !cleanUrl.includes('script.google.com')) {
    return { pushed: false, updatedUsers: null };
  }

  const separator = cleanUrl.includes('?') ? '&' : '?';
  const extraFields: Record<string, string> = {};
  if (user.rawRow) {
    for (const [k, v] of Object.entries(user.rawRow)) {
      if (v !== undefined && v !== null) {
        extraFields[k] = String(v);
      }
    }
  }

  const targetOrigEmail = (originalEmail || user.correo).trim().toLowerCase();

  const query = new URLSearchParams({
    ...extraFields,
    action,
    token: (token || 'EKIRAYA-2026').trim(),
    curso: user.curso || 'General',
    seccion: user.seccion || 'General',
    nombres: user.nombres,
    nombre: user.nombres,
    correo: user.correo,
    email: user.correo,
    originalEmail: targetOrigEmail,
    originalCorreo: targetOrigEmail,
    perfil: user.perfil || 'Estudiante',
    rol: user.perfil || 'Estudiante',
    rawRowJson: JSON.stringify(user.rawRow || {}),
    rowJson: JSON.stringify(user.rawRow || {}),
    _t: String(Date.now()),
  });

  const fullGetUrl = `${cleanUrl}${separator}${query.toString()}`;

  try {
    const getResp = await fetch(fullGetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
      },
    });

    const text = await getResp.text();
    if (text && !isHtmlContent(text)) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json?.usuariosRows) && Array.isArray(json?.usuariosHeaders)) {
          const parsed = parseUsersSheetRows(json.usuariosRows, json.usuariosHeaders);
          const existsInSheet = parsed.some(
            (u) => u.correo.toLowerCase() === user.correo.toLowerCase()
          );
          return {
            pushed: existsInSheet,
            updatedUsers: parsed,
            usuariosHeaders: json.usuariosHeaders,
            usuariosRows: json.usuariosRows,
            repoHeaders: Array.isArray(json?.headers) ? json.headers : undefined,
            repoRows: Array.isArray(json?.rows) ? json.rows : undefined,
          };
        }
      } catch {
        // Continue to POST attempt
      }
    }
  } catch {
    // Continue to POST attempt
  }

  try {
    const postResp = await fetch(cleanUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        ...extraFields,
        action,
        token: (token || 'EKIRAYA-2026').trim(),
        curso: user.curso || 'General',
        seccion: user.seccion || 'General',
        nombres: user.nombres,
        nombre: user.nombres,
        correo: user.correo,
        email: user.correo,
        originalEmail: targetOrigEmail,
        originalCorreo: targetOrigEmail,
        perfil: user.perfil || 'Estudiante',
        rol: user.perfil || 'Estudiante',
        rawRow: user.rawRow || {},
        rawRowJson: JSON.stringify(user.rawRow || {}),
        rowJson: JSON.stringify(user.rawRow || {}),
      }),
    });

    const postText = await postResp.text();
    if (postText && !isHtmlContent(postText)) {
      try {
        const json = JSON.parse(postText);
        if (Array.isArray(json?.usuariosRows) && Array.isArray(json?.usuariosHeaders)) {
          const parsed = parseUsersSheetRows(json.usuariosRows, json.usuariosHeaders);
          return {
            pushed: true,
            updatedUsers: parsed,
            usuariosHeaders: json.usuariosHeaders,
            usuariosRows: json.usuariosRows,
            repoHeaders: Array.isArray(json?.headers) ? json.headers : undefined,
            repoRows: Array.isArray(json?.rows) ? json.rows : undefined,
          };
        }
      } catch {
        // Ignore
      }
    }
  } catch {
    // Ignore
  }

  return { pushed: false, updatedUsers: null };
}

async function deleteUserFromAppsScript(
  scriptUrl: string,
  token: string,
  email: string
): Promise<boolean> {
  const cleanUrl = (scriptUrl || '').trim();
  if (!cleanUrl || !cleanUrl.includes('script.google.com')) return false;

  const separator = cleanUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams({
    action: 'deleteUser',
    token: (token || 'EKIRAYA-2026').trim(),
    correo: email,
    email: email,
    _t: String(Date.now()),
  });

  try {
    const resp = await fetch(`${cleanUrl}${separator}${query.toString()}`, {
      method: 'GET',
      redirect: 'follow',
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

const sseClients = new Set<express.Response>();

function broadcastStateUpdate(state: PersistedRepoState, eventType = 'STATE_UPDATE'): void {
  const payload = JSON.stringify({ type: eventType, state, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function saveAndBroadcastPersistedState(state: PersistedRepoState, eventType = 'STATE_UPDATE'): void {
  savePersistedState(state);
  broadcastStateUpdate(state, eventType);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // 0. Stream SSE para sincronización en tiempo real entre múltiples terminales
  app.get('/api/repo/events', (_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const state = loadPersistedState();
    const cmsPages = loadPersistedCmsPages();
    res.write(
      `data: ${JSON.stringify({ type: 'INIT', state, cmsPages, timestamp: Date.now() })}\n\n`
    );

    sseClients.add(res);

    _req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 1. Obtener el estado actual del repositorio, usuarios y páginas CMS
  app.get('/api/repo/state', (_req, res) => {
    const state = loadPersistedState();
    const cmsPages = loadPersistedCmsPages();
    res.json({
      ...state,
      cmsPages,
    });
  });

  // 1.1 Guardar configuración centralizada de Sheets en el servidor (para todas las terminales)
  app.post('/api/repo/config', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { appsScriptExecUrl, connectionUrl, repoTabName, accessToken } = req.body || {};

      const nextScript =
        typeof appsScriptExecUrl === 'string' && appsScriptExecUrl.trim() !== ''
          ? appsScriptExecUrl.trim()
          : state.appsScriptExecUrl;

      const nextSheet =
        typeof connectionUrl === 'string' && connectionUrl.trim() !== ''
          ? connectionUrl.trim()
          : state.connectionUrl;

      const nextTab =
        typeof repoTabName === 'string' && repoTabName.trim() !== ''
          ? repoTabName.trim()
          : state.repoTabName || 'repositorio';

      const nextToken =
        typeof accessToken === 'string' && accessToken.trim() !== ''
          ? accessToken.trim()
          : state.accessToken || 'EKIRAYA-2026';

      const nextState: PersistedRepoState = {
        ...state,
        appsScriptExecUrl: nextScript,
        connectionUrl: nextSheet,
        repoTabName: nextTab,
        accessToken: nextToken,
        lastSyncTimestamp: Date.now(),
      };

      saveAndBroadcastPersistedState(nextState, 'CONFIG_SAVED');

      // Si se proporcionó una URL, sincronizar de inmediato
      let syncResult = null;
      if (nextScript || nextSheet) {
        try {
          syncResult = await executeServerSyncLogic({
            appsScriptExecUrl: nextScript,
            connectionUrl: nextSheet,
            repoTabName: nextTab,
            accessToken: nextToken,
            triggerDriveScan: false,
          });
        } catch {
          // Ignorar error transitorio si aún no hay conexión
        }
      }

      res.json({
        ok: true,
        message: 'Configuración guardada en el servidor para todos los equipos',
        state: syncResult?.state || loadPersistedState(),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error al guardar configuración',
      });
    }
  });

  // CMS: Obtener todas las páginas dinámicas
  app.get('/api/cms/pages', (_req, res) => {
    res.json(loadPersistedCmsPages());
  });

  // CMS: Crear o actualizar una página dinámica
  app.post('/api/cms/pages', (req, res) => {
    try {
      const pageData: CmsPage = req.body;
      if (!pageData || !pageData.id || !pageData.title) {
        res.status(400).json({ error: 'Datos de página incompletos' });
        return;
      }

      const existingPages = loadPersistedCmsPages();
      const index = existingPages.findIndex((p) => p.id === pageData.id);

      let updatedPages: CmsPage[];
      if (index >= 0) {
        updatedPages = [...existingPages];
        updatedPages[index] = {
          ...existingPages[index],
          ...pageData,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedPages = [
          ...existingPages,
          {
            ...pageData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      savePersistedCmsPages(updatedPages);
      broadcastCmsUpdate(updatedPages, 'CMS_PAGE_SAVED');
      res.json({ ok: true, pages: updatedPages });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error al guardar la página en el CMS',
      });
    }
  });

  // CMS: Eliminar una página dinámica
  app.delete('/api/cms/pages/:id', (req, res) => {
    try {
      const { id } = req.params;
      const existingPages = loadPersistedCmsPages();
      const filtered = existingPages.filter((p) => p.id !== id);
      savePersistedCmsPages(filtered);
      broadcastCmsUpdate(filtered, 'CMS_PAGE_DELETED');
      res.json({ ok: true, pages: filtered });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error al eliminar la página en el CMS',
      });
    }
  });

  // 2. Crear / actualizar un usuario en Cita Master y sincronizarlo con Google Sheets
  app.post('/api/repo/users', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { user, appsScriptExecUrl, connectionUrl, accessToken, usuariosHeaders } =
        req.body || {};

      if (!user || !user.correo || !user.nombres) {
        res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        return;
      }

      const cleanEmail = String(user.correo).trim().toLowerCase();
      const cleanProfile = String(user.perfil || 'Estudiante').trim();
      const isAdmin =
        cleanEmail === 'mebolanos@cem.edu.co' ||
        /admin|administrador|coordinador|directivo/i.test(cleanProfile);

      const activeUserHeaders: string[] =
        Array.isArray(usuariosHeaders) && usuariosHeaders.length > 0
          ? usuariosHeaders
          : state.usuariosHeaders || DEFAULT_USUARIOS_HEADERS;

      const builtRawRow: Record<string, string> = { ...(user.rawRow || {}) };
      for (const h of activeUserHeaders) {
        if (builtRawRow[h]) continue;
        const norm = normalizeHeaderKey(h);
        if (/correo|email|mail|cuenta/.test(norm)) builtRawRow[h] = cleanEmail;
        else if (/nombre|estudiante|usuario/.test(norm))
          builtRawRow[h] = String(user.nombres).trim();
        else if (/curso|grado|nivel/.test(norm))
          builtRawRow[h] = String(user.curso || 'General').trim();
        else if (/seccion|dependencia|area/.test(norm))
          builtRawRow[h] = String(user.seccion || 'General').trim();
        else if (/perfil|rol|admin|estamento|cargo/.test(norm)) builtRawRow[h] = cleanProfile;
      }

      const newUser: AuthorizedSchoolUser = {
        curso: String(user.curso || 'General').trim(),
        seccion: String(user.seccion || 'General').trim(),
        nombres: String(user.nombres).trim(),
        correo: cleanEmail,
        perfil: cleanProfile,
        isAdmin,
        createdInApp: true,
        syncedToSheet: false,
        rawRow: builtRawRow,
      };

      const effectiveScriptUrl =
        String(appsScriptExecUrl || state.appsScriptExecUrl || '').includes('script.google.com')
          ? String(appsScriptExecUrl || state.appsScriptExecUrl).trim()
          : String(connectionUrl || state.connectionUrl || '').includes('script.google.com')
          ? String(connectionUrl || state.connectionUrl).trim()
          : '';

      const effectiveToken = String(accessToken || state.accessToken || 'EKIRAYA-2026').trim();

      let pushedToSheet = false;
      let remoteUsers: AuthorizedSchoolUser[] | null = null;
      let nextUserHeaders = activeUserHeaders;
      let nextUserRows = state.usuariosRows || [];
      let nextRawHeaders = state.rawHeaders;
      let nextRawRows = state.rawRows;

      if (effectiveScriptUrl) {
        const pushResult = await pushUserToAppsScriptFromServer(
          effectiveScriptUrl,
          effectiveToken,
          newUser
        );
        pushedToSheet = pushResult.pushed;
        remoteUsers = pushResult.updatedUsers;
        if (pushResult.usuariosHeaders && pushResult.usuariosHeaders.length > 0) {
          nextUserHeaders = pushResult.usuariosHeaders;
        }
        if (pushResult.usuariosRows) {
          nextUserRows = pushResult.usuariosRows;
        }
        if (pushResult.repoHeaders && pushResult.repoRows && pushResult.repoHeaders.length > 0) {
          nextRawHeaders = pushResult.repoHeaders;
          nextRawRows = pushResult.repoRows;
        }
        if (pushedToSheet) {
          newUser.syncedToSheet = true;
          newUser.createdInApp = false;
        }
      }

      if (!remoteUsers) {
        nextUserRows = [
          ...(state.usuariosRows || []).filter((r) => {
            const e = String(r['correo'] || r['Correo'] || r['email'] || r['Email'] || '').trim().toLowerCase();
            return e !== cleanEmail;
          }),
          builtRawRow,
        ];
      }

      const updatedLocal = [
        ...state.authorizedUsers.filter((u) => u.correo.toLowerCase() !== cleanEmail),
        newUser,
      ];

      const finalUsers = remoteUsers
        ? mergeUsersLists(remoteUsers, updatedLocal)
        : mergeUsersLists([], updatedLocal);

      const nextState: PersistedRepoState = {
        ...state,
        appsScriptExecUrl: effectiveScriptUrl || state.appsScriptExecUrl,
        connectionUrl: String(connectionUrl || state.connectionUrl || '').trim() || state.connectionUrl,
        accessToken: effectiveToken,
        usuariosHeaders: nextUserHeaders,
        usuariosRows: nextUserRows,
        rawHeaders: nextRawHeaders,
        rawRows: nextRawRows,
        authorizedUsers: finalUsers,
        lastSyncDate: new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: Date.now(),
      };

      saveAndBroadcastPersistedState(nextState);

      res.json({
        ok: true,
        pushedToSheet,
        hasAppsScriptUrl: Boolean(effectiveScriptUrl),
        user: newUser,
        state: nextState,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error guardando usuario',
      });
    }
  });

  // 2B. Actualizar la información de un usuario y sincronizar con Google Sheets
  app.put('/api/repo/users', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { user, originalEmail, appsScriptExecUrl, connectionUrl, accessToken, usuariosHeaders } =
        req.body || {};

      if (!user || !user.correo || !user.nombres) {
        res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        return;
      }

      const cleanEmail = String(user.correo).trim().toLowerCase();
      const origEmail = String(originalEmail || cleanEmail).trim().toLowerCase();
      const cleanProfile = String(user.perfil || 'Estudiante').trim();
      const isAdmin =
        cleanEmail === 'mebolanos@cem.edu.co' ||
        /admin|administrador|coordinador|directivo/i.test(cleanProfile) ||
        Boolean(user.isAdmin);

      const activeUserHeaders: string[] =
        Array.isArray(usuariosHeaders) && usuariosHeaders.length > 0
          ? usuariosHeaders
          : state.usuariosHeaders || DEFAULT_USUARIOS_HEADERS;

      const builtRawRow: Record<string, string> = { ...(user.rawRow || {}) };
      for (const h of activeUserHeaders) {
        const norm = normalizeHeaderKey(h);
        if (/correo|email|mail|cuenta/.test(norm)) builtRawRow[h] = cleanEmail;
        else if (/nombre|estudiante|usuario/.test(norm))
          builtRawRow[h] = String(user.nombres).trim();
        else if (/curso|grado|nivel/.test(norm))
          builtRawRow[h] = String(user.curso || 'General').trim();
        else if (/seccion|dependencia|area/.test(norm))
          builtRawRow[h] = String(user.seccion || 'General').trim();
        else if (/perfil|rol|admin|estamento|cargo/.test(norm)) builtRawRow[h] = cleanProfile;
      }

      const updatedUser: AuthorizedSchoolUser = {
        curso: String(user.curso || 'General').trim(),
        seccion: String(user.seccion || 'General').trim(),
        nombres: String(user.nombres).trim(),
        correo: cleanEmail,
        perfil: cleanProfile,
        isAdmin,
        createdInApp: Boolean(user.createdInApp),
        syncedToSheet: false,
        rawRow: builtRawRow,
      };

      const effectiveScriptUrl =
        String(appsScriptExecUrl || state.appsScriptExecUrl || '').includes('script.google.com')
          ? String(appsScriptExecUrl || state.appsScriptExecUrl).trim()
          : String(connectionUrl || state.connectionUrl || '').includes('script.google.com')
          ? String(connectionUrl || state.connectionUrl).trim()
          : '';

      const effectiveToken = String(accessToken || state.accessToken || 'EKIRAYA-2026').trim();

      let pushedToSheet = false;
      let remoteUsers: AuthorizedSchoolUser[] | null = null;
      let nextUserHeaders = activeUserHeaders;
      let nextUserRows = state.usuariosRows || [];
      let nextRawHeaders = state.rawHeaders;
      let nextRawRows = state.rawRows;

      if (effectiveScriptUrl) {
        // Si el correo cambió, eliminamos el correo anterior en Google Sheets
        if (origEmail && origEmail !== cleanEmail) {
          await deleteUserFromAppsScript(effectiveScriptUrl, effectiveToken, origEmail);
        }
        const pushResult = await pushUserToAppsScriptFromServer(
          effectiveScriptUrl,
          effectiveToken,
          updatedUser,
          origEmail,
          'updateUser'
        );
        pushedToSheet = pushResult.pushed;
        remoteUsers = pushResult.updatedUsers;
        if (pushResult.usuariosHeaders && pushResult.usuariosHeaders.length > 0) {
          nextUserHeaders = pushResult.usuariosHeaders;
        }
        if (pushResult.usuariosRows) {
          nextUserRows = pushResult.usuariosRows;
        }
        if (pushResult.repoHeaders && pushResult.repoRows && pushResult.repoHeaders.length > 0) {
          nextRawHeaders = pushResult.repoHeaders;
          nextRawRows = pushResult.repoRows;
        }
        if (pushedToSheet) {
          updatedUser.syncedToSheet = true;
        }
      }

      if (!remoteUsers) {
        nextUserRows = (state.usuariosRows || []).map((r) => {
          const e = String(r['correo'] || r['Correo'] || r['email'] || r['Email'] || '').trim().toLowerCase();
          if (e === origEmail || e === cleanEmail) {
            return builtRawRow;
          }
          return r;
        });
      }

      const updatedLocal = [
        ...state.authorizedUsers.filter(
          (u) => u.correo.toLowerCase() !== origEmail && u.correo.toLowerCase() !== cleanEmail
        ),
        updatedUser,
      ];

      const finalUsers = remoteUsers
        ? mergeUsersLists(remoteUsers, updatedLocal)
        : mergeUsersLists([], updatedLocal);

      const nextState: PersistedRepoState = {
        ...state,
        appsScriptExecUrl: effectiveScriptUrl || state.appsScriptExecUrl,
        connectionUrl: String(connectionUrl || state.connectionUrl || '').trim() || state.connectionUrl,
        accessToken: effectiveToken,
        usuariosHeaders: nextUserHeaders,
        usuariosRows: nextUserRows,
        rawHeaders: nextRawHeaders,
        rawRows: nextRawRows,
        authorizedUsers: finalUsers,
        lastSyncDate: new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: Date.now(),
      };

      saveAndBroadcastPersistedState(nextState);

      res.json({
        ok: true,
        pushedToSheet,
        user: updatedUser,
        state: nextState,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error actualizando información de usuario',
      });
    }
  });

  // 2C. Eliminar un usuario de Cita Master y sincronizar la eliminación con Google Sheets
  app.delete('/api/repo/users', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { email, correo, appsScriptExecUrl, connectionUrl, accessToken } =
        req.body || req.query || {};

      const cleanEmail = String(email || correo || '').trim().toLowerCase();
      if (!cleanEmail) {
        res.status(400).json({ error: 'Correo de usuario a eliminar es obligatorio' });
        return;
      }

      const effectiveScriptUrl =
        String(appsScriptExecUrl || state.appsScriptExecUrl || '').includes('script.google.com')
          ? String(appsScriptExecUrl || state.appsScriptExecUrl).trim()
          : String(connectionUrl || state.connectionUrl || '').includes('script.google.com')
          ? String(connectionUrl || state.connectionUrl).trim()
          : '';

      const effectiveToken = String(accessToken || state.accessToken || 'EKIRAYA-2026').trim();

      let deletedFromSheet = false;
      if (effectiveScriptUrl) {
        deletedFromSheet = await deleteUserFromAppsScript(
          effectiveScriptUrl,
          effectiveToken,
          cleanEmail
        );
      }

      const updatedUsers = state.authorizedUsers.filter(
        (u) => u.correo.toLowerCase() !== cleanEmail
      );

      const updatedUsuariosRows = (state.usuariosRows || []).filter((row) => {
        const rowEmail = String(row['correo'] || row['Correo'] || row['email'] || row['Email'] || '').trim().toLowerCase();
        return rowEmail !== cleanEmail;
      });

      const nextState: PersistedRepoState = {
        ...state,
        appsScriptExecUrl: effectiveScriptUrl || state.appsScriptExecUrl,
        connectionUrl: String(connectionUrl || state.connectionUrl || '').trim() || state.connectionUrl,
        usuariosRows: updatedUsuariosRows,
        authorizedUsers: updatedUsers,
        lastSyncDate: new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: Date.now(),
      };

      saveAndBroadcastPersistedState(nextState);

      res.json({
        ok: true,
        deletedFromSheet,
        authorizedUsers: updatedUsers,
        state: nextState,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error eliminando usuario',
      });
    }
  });

  // 2D. Crear / Poblar toda la hoja "usuarios" en Google Sheets en un clic
  app.post('/api/repo/init-users-sheet', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { appsScriptExecUrl, connectionUrl, accessToken, users, usuariosHeaders } =
        req.body || {};

      const effectiveScriptUrl = String(
        appsScriptExecUrl || state.appsScriptExecUrl || ''
      ).includes('script.google.com')
        ? String(appsScriptExecUrl || state.appsScriptExecUrl).trim()
        : String(connectionUrl || state.connectionUrl || '').includes('script.google.com')
          ? String(connectionUrl || state.connectionUrl).trim()
          : '';

      const effectiveToken = String(accessToken || state.accessToken || 'EKIRAYA-2026').trim();
      const activeHeaders: string[] =
        Array.isArray(usuariosHeaders) && usuariosHeaders.length > 0
          ? usuariosHeaders
          : state.usuariosHeaders || DEFAULT_USUARIOS_HEADERS;

      const usersToPush: AuthorizedSchoolUser[] = mergeUsersLists(
        [],
        Array.isArray(users) && users.length > 0 ? users : state.authorizedUsers
      );

      let pushedCount = 0;

      if (effectiveScriptUrl) {
        try {
          const postResp = await fetch(effectiveScriptUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
              Accept: 'application/json, text/plain, */*',
            },
            body: JSON.stringify({
              action: 'initUsersSheet',
              token: effectiveToken,
              usuariosHeaders: activeHeaders,
              users: usersToPush,
            }),
          });
          const txt = await postResp.text();
          if (txt && !isHtmlContent(txt)) {
            pushedCount = usersToPush.length;
          }
        } catch {
          // Fallback individual
        }

        if (pushedCount === 0) {
          for (const u of usersToPush) {
            const r = await pushUserToAppsScriptFromServer(effectiveScriptUrl, effectiveToken, u);
            if (r.pushed) pushedCount++;
          }
        }
      }

      const nextState: PersistedRepoState = {
        ...state,
        appsScriptExecUrl: effectiveScriptUrl || state.appsScriptExecUrl,
        usuariosHeaders: activeHeaders,
        authorizedUsers: usersToPush.map((u) => ({
          ...u,
          syncedToSheet: pushedCount > 0 ? true : u.syncedToSheet,
        })),
        lastSyncDate: new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: Date.now(),
      };

      saveAndBroadcastPersistedState(nextState);

      res.json({
        ok: true,
        pushedCount,
        totalUsers: usersToPush.length,
        hasAppsScriptUrl: Boolean(effectiveScriptUrl),
        state: nextState,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error inicializando hoja usuarios',
      });
    }
  });

  interface ServerSyncParams {
    appsScriptExecUrl?: string;
    connectionUrl?: string;
    accessToken?: string;
    repoTabName?: string;
    triggerDriveScan?: boolean;
    clientUsers?: AuthorizedSchoolUser[];
    clientUsuariosHeaders?: string[];
    clientUsuariosRows?: Record<string, string>[];
    clientRawHeaders?: string[];
    clientRawRows?: Record<string, string>[];
  }

  async function executeServerSyncLogic(params: ServerSyncParams = {}) {
    const currentState = loadPersistedState();
    const {
      appsScriptExecUrl,
      connectionUrl,
      accessToken,
      repoTabName,
      triggerDriveScan,
      clientUsers,
      clientUsuariosHeaders,
      clientUsuariosRows,
      clientRawHeaders,
      clientRawRows,
    } = params;

    const rawScriptInput = String(
      appsScriptExecUrl && typeof appsScriptExecUrl === 'string' && appsScriptExecUrl.trim() !== ''
        ? appsScriptExecUrl.trim()
        : currentState.appsScriptExecUrl || ''
    ).trim();
    const rawSheetInput = String(
      connectionUrl && typeof connectionUrl === 'string' && connectionUrl.trim() !== ''
        ? connectionUrl.trim()
        : currentState.connectionUrl || ''
    ).trim();
    const token = String(
      accessToken && typeof accessToken === 'string' && accessToken.trim() !== ''
        ? accessToken.trim()
        : currentState.accessToken || 'EKIRAYA-2026'
    ).trim();
    const tabName = String(
      repoTabName && typeof repoTabName === 'string' && repoTabName.trim() !== ''
        ? repoTabName.trim()
        : currentState.repoTabName || 'repositorio'
    ).trim();

    const effectiveScriptUrl = rawScriptInput.includes('script.google.com')
      ? rawScriptInput
      : rawSheetInput.includes('script.google.com')
      ? rawSheetInput
      : currentState.appsScriptExecUrl || '';

    const effectiveSheetUrl = rawSheetInput.includes('/spreadsheets/d/')
      ? rawSheetInput
      : rawScriptInput.includes('/spreadsheets/d/')
      ? rawScriptInput
      : currentState.connectionUrl || '';

    const baseUsers = mergeUsersLists(
      [],
      [...(currentState.authorizedUsers || []), ...(Array.isArray(clientUsers) ? clientUsers : [])]
    );

    let headers: string[] = Array.isArray(clientRawHeaders) ? clientRawHeaders : [];
    let rows: Record<string, string>[] = Array.isArray(clientRawRows) ? clientRawRows : [];
    let usuariosHeaders: string[] =
      Array.isArray(clientUsuariosHeaders) && clientUsuariosHeaders.length > 0
        ? clientUsuariosHeaders
        : currentState.usuariosHeaders || DEFAULT_USUARIOS_HEADERS;
    let usuariosRows: Record<string, string>[] = Array.isArray(clientUsuariosRows)
      ? clientUsuariosRows
      : currentState.usuariosRows || [];
    let sheetUsers: AuthorizedSchoolUser[] =
      Array.isArray(clientUsuariosRows) &&
      clientUsuariosRows.length > 0 &&
      Array.isArray(clientUsuariosHeaders)
        ? parseUsersSheetRows(clientUsuariosRows, clientUsuariosHeaders)
        : [];
    let sheetAccessWarning: string | null = null;
    const cacheBuster = `_t=${Date.now()}`;

    // A. Sincronizar con Google Apps Script (/exec) si está configurado
    if (effectiveScriptUrl) {
      const pendingUsers = baseUsers.filter((u) => u.createdInApp && !u.syncedToSheet);
      for (const pending of pendingUsers) {
        const pushRes = await pushUserToAppsScriptFromServer(effectiveScriptUrl, token, pending);
        if (pushRes.pushed) {
          pending.syncedToSheet = true;
          pending.createdInApp = false;
        }
      }

      try {
        const sep = effectiveScriptUrl.includes('?') ? '&' : '?';
        const actionName = triggerDriveScan ? 'syncDriveAndSheets' : 'syncRepo';
        const actionParam = `&action=${actionName}`;
        const tabParam = `&repoTabName=${encodeURIComponent(tabName || 'repositorio')}&sheet=${encodeURIComponent(tabName || 'repositorio')}`;
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        const fullUrl = `${effectiveScriptUrl}${sep}${cacheBuster}${tokenParam}${actionParam}${tabParam}`;

        let data: any = null;

        // 1. Intentar GET
        try {
          const resp = await fetch(fullUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Cache-Control': 'no-cache',
            },
          });
          const text = await resp.text();
          if (text && !isHtmlContent(text)) {
            data = JSON.parse(text);
          }
        } catch {
          // Intentar POST a continuación
        }

        // 2. Intentar POST con JSON si GET no devolvió JSON válido
        if (!data) {
          try {
            const postResp = await fetch(effectiveScriptUrl, {
              method: 'POST',
              redirect: 'follow',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
                Accept: 'application/json, text/plain, */*',
              },
              body: JSON.stringify({
                action: actionName,
                token: token || 'EKIRAYA-2026',
                sheet: tabName || 'repositorio',
                repoTabName: tabName || 'repositorio',
                triggerDriveScan: Boolean(triggerDriveScan),
              }),
            });
            const postText = await postResp.text();
            if (postText && !isHtmlContent(postText)) {
              data = JSON.parse(postText);
            }
          } catch {
            // Ignore
          }
        }

        if (data) {
          if (Array.isArray(data?.usuariosRows) && Array.isArray(data?.usuariosHeaders)) {
            if (data.usuariosHeaders.length > 0) {
              usuariosHeaders = data.usuariosHeaders.map((h: string) => String(h).trim());
            }
            usuariosRows = data.usuariosRows;
            sheetUsers = parseUsersSheetRows(data.usuariosRows, usuariosHeaders);
          }

          if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) {
            const incHeaders = data.headers.map((h: string) => String(h).trim());
            if (isUsersSheetData(incHeaders, data.rows)) {
              if (sheetUsers.length <= 1) {
                usuariosHeaders = incHeaders;
                usuariosRows = data.rows;
                sheetUsers = parseUsersSheetRows(data.rows, incHeaders);
              }
            } else if (isMonographsSheetData(incHeaders, data.rows)) {
              headers = incHeaders;
              rows = data.rows;
            }
          }

          // Soporte para versiones anteriores del Apps Script que devolvían { items: [...] }
          if (Array.isArray(data?.items) && data.items.length > 0 && rows.length === 0) {
            const firstItem = data.items[0];
            if (firstItem && typeof firstItem === 'object') {
              const itemHeaders = Object.keys(firstItem);
              if (isUsersSheetData(itemHeaders, data.items)) {
                usuariosHeaders = itemHeaders;
                usuariosRows = data.items;
                sheetUsers = parseUsersSheetRows(data.items, itemHeaders);
              } else {
                headers = itemHeaders;
                rows = data.items;
              }
            }
          }
        } else if (sheetUsers.length <= 1) {
          sheetAccessWarning =
            'El Web App de Google Apps Script devolvió inicio de sesión. Implementa como "Quién tiene acceso: Cualquier persona".';
        }
      } catch {
        // Continuar con lectura directa de Google Sheets
      }
    }

    // B. Leer directamente las hojas desde el enlace de Google Sheets (docs.google.com/spreadsheets/d/...)
    const sheetIdMatch = effectiveSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetIdMatch?.[1]) {
      const sheetId = sheetIdMatch[1];
      const gidMatch = effectiveSheetUrl.match(/[#&?]gid=(\d+)/);
      const gid = gidMatch?.[1] || '';

      const fetchSheetCsv = async (url: string): Promise<{
        headers: string[];
        rows: Record<string, string>[];
        isHtml: boolean;
      }> => {
        try {
          const r = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          });
          const txt = await r.text();
          if (isHtmlContent(txt)) {
            return { headers: [], rows: [], isHtml: true };
          }
          const parsed = parseCsvToRows(txt);
          return { ...parsed, isHtml: false };
        } catch {
          return { headers: [], rows: [], isHtml: false };
        }
      };

      // 1. Probar la URL exacta (con gid si existe) y export?format=csv
      const primaryUrls = [
        gid
          ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&${cacheBuster}`
          : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&${cacheBuster}`,
        gid
          ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&${cacheBuster}`
          : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&${cacheBuster}`,
      ];

      for (const pUrl of primaryUrls) {
        const resPrimary = await fetchSheetCsv(pUrl);
        if (resPrimary.isHtml) {
          if (sheetUsers.length <= 1 && rows.length === 0) {
            sheetAccessWarning =
              'El archivo de Google Sheets tiene acceso restringido en el servidor. Puedes cambiar Compartir → "Cualquier persona con el enlace (Lector)" o usar "Pegar tabla de Sheets".';
          }
          continue;
        }
        if (resPrimary.headers.length > 0 && resPrimary.rows.length > 0) {
          if (isUsersSheetData(resPrimary.headers, resPrimary.rows)) {
            if (sheetUsers.length <= 1) {
              usuariosHeaders = resPrimary.headers;
              usuariosRows = resPrimary.rows;
              sheetUsers = parseUsersSheetRows(resPrimary.rows, resPrimary.headers);
            }
            sheetAccessWarning = null;
          } else if (
            rows.length === 0 &&
            isMonographsSheetData(resPrimary.headers, resPrimary.rows)
          ) {
            headers = resPrimary.headers;
            rows = resPrimary.rows;
            sheetAccessWarning = null;
          }
        }
      }

      // 2. Buscar explícitamente la hoja "usuarios" (usuarios / Usuarios / USUARIOS)
      if (sheetUsers.length <= 1) {
        const userTabCandidates = [
          'usuarios',
          'Usuarios',
          'USUARIOS',
          'usuario',
          'Usuario',
          'users',
          'Users',
        ];
        for (const uTab of userTabCandidates) {
          const uUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            uTab
          )}&${cacheBuster}`;
          const uRes = await fetchSheetCsv(uUrl);
          if (
            !uRes.isHtml &&
            uRes.headers.length > 0 &&
            uRes.rows.length > 0 &&
            isUsersSheetData(uRes.headers, uRes.rows)
          ) {
            usuariosHeaders = uRes.headers;
            usuariosRows = uRes.rows;
            sheetUsers = parseUsersSheetRows(uRes.rows, uRes.headers);
            sheetAccessWarning = null;
            break;
          }
        }
      }

      // 3. Buscar explícitamente la hoja de Monografías ("repositorio", "Repositorio", "Hoja 1", etc.)
      if (rows.length === 0) {
        const repoTabCandidates = Array.from(
          new Set([
            tabName || 'repositorio',
            'repositorio',
            'Repositorio',
            'REPOSITORIO',
            'Hoja 1',
            'Sheet 1',
            'Hoja1',
            'Sheet1',
            'Monografías',
            'Monografias',
            'Unidades académicas',
            'Unidades Académicas',
            'Metadata Repositorio Eki',
          ])
        );

        for (const rTab of repoTabCandidates) {
          const rUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            rTab
          )}&${cacheBuster}`;
          const rRes = await fetchSheetCsv(rUrl);
          if (
            !rRes.isHtml &&
            rRes.headers.length > 0 &&
            rRes.rows.length > 0 &&
            isMonographsSheetData(rRes.headers, rRes.rows)
          ) {
            headers = rRes.headers;
            rows = rRes.rows;
            sheetAccessWarning = null;
            break;
          }
        }
      }
    }

    const mergedUsers = mergeUsersLists(sheetUsers, baseUsers);
    const nowStr = new Date().toLocaleString('es-CO');
    const nowTs = Date.now();

    const nextHeaders =
      headers.length > 0
        ? headers
        : isMonographsSheetData(currentState.rawHeaders, currentState.rawRows) &&
            currentState.rawHeaders.length > 0
          ? currentState.rawHeaders
          : DEFAULT_REPO_HEADERS;
    const nextRows =
      rows.length > 0
        ? rows
        : isMonographsSheetData(currentState.rawHeaders, currentState.rawRows) &&
            currentState.rawRows.length > 0
          ? currentState.rawRows
          : DEFAULT_REPO_ROWS;

    const nextState: PersistedRepoState = {
      appsScriptExecUrl: effectiveScriptUrl || currentState.appsScriptExecUrl || '',
      connectionUrl: effectiveSheetUrl || currentState.connectionUrl || '',
      repoTabName: tabName || currentState.repoTabName || 'repositorio',
      accessToken: token || currentState.accessToken || 'EKIRAYA-2026',
      lastSyncDate: nowStr,
      lastSyncTimestamp: nowTs,
      rawHeaders: nextHeaders,
      rawRows: nextRows,
      usuariosHeaders,
      usuariosRows,
      authorizedUsers: mergedUsers,
    };

    saveAndBroadcastPersistedState(nextState);

    return {
      ok: true,
      usersSyncedCount: mergedUsers.length,
      monographsSyncedCount: nextRows.length,
      sheetAccessWarning,
      state: nextState,
    };
  }

  // 3. Sincronización completa desde el servidor (Drive <-> Google Sheets <-> Cita Master)
  app.post('/api/repo/sync', async (req, res) => {
    try {
      const result = await executeServerSyncLogic(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error durante la sincronización',
      });
    }
  });

  app.get('/api/repo/sync', async (_req, res) => {
    try {
      const result = await executeServerSyncLogic({ triggerDriveScan: false });
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error durante la sincronización',
      });
    }
  });

  // Función pedagógica socrática que guía sin dar la respuesta resuelta
  function generateSocraticFallbackGuidance(message: string, context?: any): string {
    const m = (message || '').toLowerCase();

    // Caso 1: Revisar el formulario actual del estudiante
    if (
      m.includes('revisar') ||
      m.includes('formulario') ||
      m.includes('mis campos') ||
      m.includes('cómo voy') ||
      m.includes('qué opinas') ||
      m.includes('borrador')
    ) {
      const feedback: string[] = [];
      const missing: string[] = [];

      if (context) {
        if (context.title) {
          feedback.push(
            `• **Título:** Ya ingresaste "${context.title}". Pregúntate: ¿esta obra es completa y autónoma (como un libro o tesis) o forma parte de otra publicación mayor (como un artículo de revista)? Recuerda que en APA 7 solo las obras completas llevan el título en cursiva.`
          );
        } else {
          missing.push('el **Título** del trabajo');
        }

        if (
          (context.authors &&
            context.authors.length > 0 &&
            context.authors.some((a: any) => a.lastName)) ||
          (context.isInstitutionalAuthor &&
            (context.institutionalName || context.institutionName))
        ) {
          feedback.push(
            `• **Autoría:** Identificaste al autor. Recuerda la regla: en la lista de referencias se coloca el apellido seguido de la inicial del nombre (ej. Gómez, M.), mientras que en el texto se usa solo el apellido.`
          );
        } else {
          missing.push('el **Autor** (personal o institucional)');
        }

        if (context.year) {
          feedback.push(
            `• **Año:** Tienes el año (${context.year}). En la referencia debe ir entre paréntesis inmediatamente después del autor.`
          );
        } else {
          missing.push('la **Fecha/Año** (o verificar si corresponde colocar "s.f." si de verdad no existe)');
        }

        if (context.publisher || context.url || context.doi) {
          feedback.push(
            `• **Fuente:** Tienes información de la editorial o enlace (${
              context.publisher || context.url || context.doi
            }). En APA 7 ya no se coloca "Recuperado de" ni la ciudad física para libros.`
          );
        } else {
          missing.push('la **Editorial, Revista o Enlace oficial**');
        }
      }

      let response = `¡Buen trabajo revisando tus avances! 🦉\n\n`;
      if (feedback.length > 0) {
        response += `**Lo que tienes identificado hasta ahora:**\n${feedback.join('\n')}\n\n`;
      }
      if (missing.length > 0) {
        response += `**Elementos que aún debes investigar o completar:**\nTe falta definir ${missing.join(', ')}.\n\n`;
      }
      response += `¿Cuál de estos datos te está costando más trabajo localizar en tu fuente?`;
      return response;
    }

    // Caso 2: Piden que les hagan la cita directamente
    if (
      m.includes('hazme la cita') ||
      m.includes('dame la cita') ||
      m.includes('cómo queda') ||
      m.includes('escríbeme') ||
      m.includes('hazme') ||
      m.includes('dime la cita')
    ) {
      return `¡Hola! Como tu Tutor Socrático de Ekirayá, no te entrego la cita terminada para que tú mismo desarrolles tu pensamiento crítico y autonomía académica 🧠.

En cambio, desglosémosla juntos respondiendo estas 4 preguntas clave:
1. **¿Quién?** (Autor: ¿tienes el primer apellido del autor?).
2. **¿Cuándo?** (Año: ¿en qué año se publicó?).
3. **¿Qué?** (Título: ¿es un libro completo o un artículo dentro de otra revista?).
4. **¿Dónde?** (Fuente: ¿cuál es la editorial o enlace?).

Dime: ¿qué datos tienes de estos cuatro y te guío con el orden y los signos de puntuación?`;
    }

    // Caso 3: Pregunta sobre autores (3 o más, et al.)
    if (
      m.includes('autor') &&
      (m.includes('3') ||
        m.includes('4') ||
        m.includes('varios') ||
        m.includes('et al') ||
        m.includes('muchos'))
    ) {
      return `¡Excelente pregunta sobre la regla de autores múltiples en **APA 7.ª edición**! 📚

Piensa en estas dos situaciones:
• **Para 1 o 2 autores:** Siempre se mencionan ambos autores en cada cita dentro del texto (ej. García y Pérez, 2024).
• **Para 3 o más autores:** ¿Conoces la locución latina *et al.*? En APA 7 se coloca únicamente el primer apellido del primer autor seguido de *"et al."* y el año, ¡desde la primera vez que lo citas en el texto!

¿Cómo se apellida el primer autor de tu lista? Intenta redactar cómo quedaría tu cita en el texto.`;
    }

    // Caso 4: Página web sin autor personal
    if (
      m.includes('sin autor') ||
      m.includes('página web') ||
      m.includes('pagina web') ||
      m.includes('sitio web') ||
      m.includes('institucional')
    ) {
      return `Este es uno de los dilemas más comunes en investigación escolar 🔍.

Pregúntate primero: **¿Quién es responsable de la información que estás leyendo?**
• Si es una organización, entidad o institución reconocida (por ejemplo: la *Organización Mundial de la Salud*, la *NASA*, o el *Ministerio de Educación*), ellos son el **autor institucional o corporativo**.
• Solo si no existe absolutamente ninguna persona ni entidad responsable, la norma APA indica que el **título de la obra** sube a ocupar la posición del autor.

Revisa la página web: ¿encontraste el logotipo o la entidad en la parte superior o en el pie de página? ¿Quién respalda ese contenido?`;
    }

    // Caso 5: Fecha o año faltante
    if (
      m.includes('fecha') ||
      m.includes('año') ||
      m.includes('s.f.') ||
      m.includes('sin fecha') ||
      m.includes('dia') ||
      m.includes('mes')
    ) {
      return `Ubicar la fecha en fuentes digitales requiere buen ojo crítico 🧐:

1. **Revisa bien:** Busca cerca del título del artículo o al final de la página (frecuentemente junto al símbolo de copyright ©).
2. **Cuidado con las fechas dinámicas:** La fecha de actualización de toda la web no siempre es la fecha en que se escribió ese artículo específico.
3. **Si definitivamente no hay fecha:** La norma APA establece usar la abreviatura entre paréntesis: **(s.f.)**, que significa *sin fecha*.

¿Revisaste al inicio o al pie del texto? Si no la encuentras, ¿te animas a ingresar *(s.f.)* en el campo de año del formulario?`;
    }

    // Caso 6: Cursiva (itálica)
    if (
      m.includes('cursiva') ||
      m.includes('italica') ||
      m.includes('formato') ||
      m.includes('itálica')
    ) {
      return `La regla de la cursiva en APA 7 sigue una lógica muy sencilla e intuitiva 💡:

• **Si la obra es "independiente y completa"** (un libro, una tesis, un informe, una película o una página web completa), el **Título de la obra va en cursiva**.
• **Si la obra "forma parte de otra obra mayor"** (un artículo de revista, un capítulo de un libro compilado o una canción de un álbum), el título del artículo va en **texto normal**, y lo que va en cursiva es el **nombre de la revista o del libro contenedor**.

¿Tu fuente es una obra completa o un capítulo/artículo dentro de algo más grande?`;
    }

    // Caso 7: Cita narrativa vs parentética
    if (
      m.includes('narrativa') ||
      m.includes('parentética') ||
      m.includes('parentetica') ||
      m.includes('diferencia') ||
      m.includes('en el texto')
    ) {
      return `¡Comprender esta diferencia transformará tu redacción académica! ✍️

• **Cita Parentética (énfasis en el contenido):** El autor y el año van juntos al final de la idea, encerrados entre paréntesis.
  *Pista:* Se usa cuando lo más importante es el dato o la idea misma.
• **Cita Narrativa (énfasis en el autor):** El autor se incorpora naturalmente en la redacción de la oración, y solo el año va entre paréntesis.
  *Pista:* Se usa cuando quieres destacar la autoridad del investigador (ej. "Como afirma Freire (1970)...").

¿En tu párrafo actual, te interesa darle protagonismo a la voz del autor o a la idea que estás explicando?`;
    }

    // Fallback general pedagógico socrático
    return `¡Hola! Como tu Tutor Socrático de Citación del Colegio Ekirayá 🦉, estoy aquí para guiarte a pensar como un verdadero investigador.

Para resolver tu duda, repasemos los 4 datos esenciales de toda referencia:
1. **¿Quién?** (Autor o autores).
2. **¿Cuándo?** (Año o fecha de publicación).
3. **¿Qué?** (Título del documento).
4. **¿Dónde?** (Editorial, revista o enlace oficial).

Cuéntame: ¿con cuál de estos 4 elementos tienes dudas y qué datos has encontrado hasta el momento?`;
  }

  // 4. Tutor Socrático IA con Gemini para la Pestaña Gestor (Orientador Pedagógico)
  app.post('/api/gestor/ai-tutor', async (req, res) => {
    try {
      const { message, history, context } = req.body || {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'El mensaje del estudiante es requerido.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback pedagógico enriquecido si no hay API key
        res.json({
          reply: generateSocraticFallbackGuidance(message, context),
        });
        return;
      }

      let contextInfo = '';
      if (context && typeof context === 'object') {
        const parts: string[] = [];
        if (context.style) parts.push(`Estilo seleccionado: ${context.style}`);
        if (context.sourceType) parts.push(`Tipo de fuente: ${context.sourceType}`);
        if (context.title) parts.push(`Título ingresado: "${context.title}"`);
        if (context.authors && Array.isArray(context.authors)) {
          const authorsStr = context.authors
            .map((a: any) => `${a.firstName || ''} ${a.lastName || ''}`.trim())
            .filter(Boolean)
            .join(', ');
          if (authorsStr) parts.push(`Autores ingresados: ${authorsStr}`);
        }
        const instName = context.institutionalName || context.institutionName;
        if (context.isInstitutionalAuthor && instName) {
          parts.push(`Autor institucional: ${instName}`);
        }
        if (context.year) parts.push(`Año ingresado: ${context.year}`);
        if (context.publisher) parts.push(`Editorial/Fuente: ${context.publisher}`);
        if (context.url || context.doi) parts.push(`Enlace o DOI: ${context.doi || context.url}`);

        if (parts.length > 0) {
          contextInfo = `[DATOS ACTUALES EN EL FORMULARIO DEL ESTUDIANTE:\n${parts.join(
            '\n'
          )}\nUtiliza estos datos para orientarlo si pregunta sobre su formulario, pero RECUERDA: NUNCA le entregues la cita o referencia armada para copiar. Hazle preguntas para que él mismo descubra qué corregir o completar.]\n\n`;
        }
      }

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (
            item &&
            (item.role === 'user' || item.role === 'model') &&
            typeof item.content === 'string'
          ) {
            contents.push({
              role: item.role,
              parts: [{ text: item.content }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: `${contextInfo}${message}` }],
      });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SOCRATIC_TUTOR_SYSTEM_INSTRUCTION,
            temperature: 0.65,
          },
        });

        const reply =
          response.text?.trim() ||
          generateSocraticFallbackGuidance(message, context);
        res.json({ reply });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using intelligent Socratic engine fallback:', geminiError?.message);
        const reply = generateSocraticFallbackGuidance(message, context);
        res.json({ reply });
      }
    } catch (err) {
      console.error('Error general en /api/gestor/ai-tutor:', err);
      res.json({
        reply: generateSocraticFallbackGuidance(req.body?.message || '', req.body?.context),
      });
    }
  });

  // Polling automático en segundo plano para verificar si hay cambios directos en Google Sheets
  // Sincroniza cada 10 segundos para que cualquier cambio en Google Sheets aparezca en todas las terminales
  setInterval(async () => {
    try {
      const st = loadPersistedState();
      if (st.appsScriptExecUrl || st.connectionUrl) {
        await executeServerSyncLogic({ triggerDriveScan: false });
      }
    } catch {
      // Ignorar errores transitorios en segundo plano
    }
  }, 10000);

  // Disparo inicial inmediato (a los 1.5s) para precargar los usuarios de Sheets en cuanto arranca el servidor
  setTimeout(async () => {
    try {
      const st = loadPersistedState();
      if (st.appsScriptExecUrl || st.connectionUrl) {
        await executeServerSyncLogic({ triggerDriveScan: false });
      }
    } catch {
      // Ignorar
    }
  }, 1500);

  // Heartbeat para mantener vivas las conexiones SSE en proxies y Cloud Run (cada 10s)
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 10000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
