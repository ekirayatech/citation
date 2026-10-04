import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  AuthorizedSchoolUser,
  DEFAULT_AUTHORIZED_USERS,
  DEFAULT_REPO_HEADERS,
  DEFAULT_REPO_ROWS,
  DEFAULT_USUARIOS_HEADERS,
} from './src/data/repositorioDefaultData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        appsScriptExecUrl: parsed.appsScriptExecUrl || '',
        connectionUrl: parsed.connectionUrl || '',
        repoTabName: parsed.repoTabName || 'repositorio',
        accessToken: parsed.accessToken || 'EKIRAYA-2026',
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
    appsScriptExecUrl: '',
    connectionUrl: '',
    repoTabName: 'repositorio',
    accessToken: 'EKIRAYA-2026',
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
  originalEmail?: string
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

  const query = new URLSearchParams({
    ...extraFields,
    action: 'addUser',
    token: (token || 'EKIRAYA-2026').trim(),
    curso: user.curso || 'General',
    seccion: user.seccion || 'General',
    nombres: user.nombres,
    nombre: user.nombres,
    correo: user.correo,
    email: user.correo,
    originalEmail: (originalEmail || user.correo).trim().toLowerCase(),
    perfil: user.perfil || 'Estudiante',
    rol: user.perfil || 'Estudiante',
    rawRowJson: JSON.stringify(user.rawRow || {}),
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
        action: 'addUser',
        token: (token || 'EKIRAYA-2026').trim(),
        curso: user.curso || 'General',
        seccion: user.seccion || 'General',
        nombres: user.nombres,
        correo: user.correo,
        originalEmail: (originalEmail || user.correo).trim().toLowerCase(),
        perfil: user.perfil || 'Estudiante',
        rawRow: user.rawRow || {},
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
    res.write(`data: ${JSON.stringify({ type: 'INIT', state, timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    _req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 1. Obtener el estado actual del repositorio y usuarios
  app.get('/api/repo/state', (_req, res) => {
    const state = loadPersistedState();
    res.json(state);
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
        connectionUrl: String(connectionUrl || state.connectionUrl || '').trim(),
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
          updatedUser
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
        connectionUrl: String(connectionUrl || state.connectionUrl || '').trim(),
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

      const nextState: PersistedRepoState = {
        ...state,
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
      appsScriptExecUrl !== undefined ? appsScriptExecUrl : currentState.appsScriptExecUrl
    ).trim();
    const rawSheetInput = String(
      connectionUrl !== undefined ? connectionUrl : currentState.connectionUrl
    ).trim();
    const token = String(
      accessToken !== undefined ? accessToken : currentState.accessToken || 'EKIRAYA-2026'
    ).trim();
    const tabName = String(
      repoTabName !== undefined ? repoTabName : currentState.repoTabName || 'repositorio'
    ).trim();

    const effectiveScriptUrl = rawScriptInput.includes('script.google.com')
      ? rawScriptInput
      : rawSheetInput.includes('script.google.com')
      ? rawSheetInput
      : '';

    const effectiveSheetUrl = rawSheetInput.includes('/spreadsheets/d/')
      ? rawSheetInput
      : rawScriptInput.includes('/spreadsheets/d/')
      ? rawScriptInput
      : '';

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
      appsScriptExecUrl: effectiveScriptUrl || rawScriptInput,
      connectionUrl: effectiveSheetUrl || rawSheetInput,
      repoTabName: tabName,
      accessToken: token,
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

  // Polling automático en segundo plano para verificar si hay cambios directos en Google Sheets
  // Sincroniza cada 20 segundos para que cualquier cambio en Google Sheets aparezca en todas las terminales
  setInterval(async () => {
    try {
      const st = loadPersistedState();
      if (st.appsScriptExecUrl || st.connectionUrl) {
        await executeServerSyncLogic({ triggerDriveScan: false });
      }
    } catch {
      // Ignorar errores transitorios en segundo plano
    }
  }, 20000);

  // Heartbeat para mantener vivas las conexiones SSE en proxies y Cloud Run
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

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
