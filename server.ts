import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const STATE_FILE_PATH = path.join(__dirname, '.ekiraya-repo-state.json');

export interface AuthorizedSchoolUser {
  curso: string;
  seccion: string;
  nombres: string;
  correo: string;
  perfil: string;
  isAdmin: boolean;
  createdInApp?: boolean;
  syncedToSheet?: boolean;
}

interface PersistedRepoState {
  appsScriptExecUrl: string;
  connectionUrl: string;
  repoTabName: string;
  accessToken: string;
  lastSyncDate: string | null;
  lastSyncTimestamp: number | null;
  rawHeaders: string[];
  rawRows: Record<string, string>[];
  authorizedUsers: AuthorizedSchoolUser[];
}

const DEFAULT_ADMIN_USER: AuthorizedSchoolUser = {
  curso: 'Administración',
  seccion: 'Dirección / Coordinación',
  nombres: 'Coordinación y Administración Cita Master',
  correo: 'mebolanos@cem.edu.co',
  perfil: 'Administrador',
  isAdmin: true,
  createdInApp: false,
  syncedToSheet: true,
};

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
  if (rows.length > 0) {
    const sampleRowValues = Object.values(rows[0] || {}).join(' ');
    if (sampleRowValues.includes('@') && !sampleRowValues.includes('drive.google.com')) {
      return true;
    }
  }

  return false;
}

function isMonographsSheetData(headers: string[], rows: Record<string, string>[] = []): boolean {
  if (!headers || headers.length === 0) return false;
  if (isUsersSheetData(headers, rows)) return false;

  const joined = headers.map((h) => normalizeHeaderKey(h)).join(' | ');
  return (
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
  if (!rows || rows.length === 0) return [DEFAULT_ADMIN_USER];

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
    if (!correo) {
      const emailCell = Object.values(row).find((v) => String(v || '').includes('@'));
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
  const map = new Map<string, AuthorizedSchoolUser>();

  map.set(DEFAULT_ADMIN_USER.correo.toLowerCase(), DEFAULT_ADMIN_USER);

  for (const u of existingUsers || []) {
    if (u && u.correo) {
      map.set(u.correo.trim().toLowerCase(), u);
    }
  }

  for (const u of sheetUsers || []) {
    if (u && u.correo) {
      map.set(u.correo.trim().toLowerCase(), {
        ...u,
        correo: u.correo.trim().toLowerCase(),
        createdInApp: false,
        syncedToSheet: true,
      });
    }
  }

  return Array.from(map.values());
}

function loadPersistedState(): PersistedRepoState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        appsScriptExecUrl: parsed.appsScriptExecUrl || '',
        connectionUrl: parsed.connectionUrl || '',
        repoTabName: parsed.repoTabName || 'Repositorio',
        accessToken: parsed.accessToken || 'EKIRAYA-2026',
        lastSyncDate: parsed.lastSyncDate || null,
        lastSyncTimestamp: parsed.lastSyncTimestamp || null,
        rawHeaders: Array.isArray(parsed.rawHeaders) ? parsed.rawHeaders : [],
        rawRows: Array.isArray(parsed.rawRows) ? parsed.rawRows : [],
        authorizedUsers: mergeUsersLists([], parsed.authorizedUsers || [DEFAULT_ADMIN_USER]),
      };
    }
  } catch {
    // Ignore read error
  }
  return {
    appsScriptExecUrl: '',
    connectionUrl: '',
    repoTabName: 'Repositorio',
    accessToken: 'EKIRAYA-2026',
    lastSyncDate: null,
    lastSyncTimestamp: null,
    rawHeaders: [],
    rawRows: [],
    authorizedUsers: [DEFAULT_ADMIN_USER],
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
  user: AuthorizedSchoolUser
): Promise<{ pushed: boolean; updatedUsers: AuthorizedSchoolUser[] | null }> {
  const cleanUrl = (scriptUrl || '').trim();
  if (!cleanUrl || !cleanUrl.includes('script.google.com')) {
    return { pushed: false, updatedUsers: null };
  }

  const separator = cleanUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams({
    action: 'addUser',
    token: (token || 'EKIRAYA-2026').trim(),
    curso: user.curso || 'General',
    seccion: user.seccion || 'General',
    nombres: user.nombres,
    nombre: user.nombres,
    correo: user.correo,
    email: user.correo,
    perfil: user.perfil || 'Estudiante',
    rol: user.perfil || 'Estudiante',
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
          return { pushed: existsInSheet, updatedUsers: parsed };
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
        action: 'addUser',
        token: (token || 'EKIRAYA-2026').trim(),
        curso: user.curso || 'General',
        seccion: user.seccion || 'General',
        nombres: user.nombres,
        correo: user.correo,
        perfil: user.perfil || 'Estudiante',
      }),
    });

    const postText = await postResp.text();
    if (postText && !isHtmlContent(postText)) {
      try {
        const json = JSON.parse(postText);
        if (Array.isArray(json?.usuariosRows) && Array.isArray(json?.usuariosHeaders)) {
          const parsed = parseUsersSheetRows(json.usuariosRows, json.usuariosHeaders);
          return { pushed: true, updatedUsers: parsed };
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // 1. Obtener el estado actual del repositorio y usuarios
  app.get('/api/repo/state', (_req, res) => {
    const state = loadPersistedState();
    res.json(state);
  });

  // 2. Crear / actualizar un usuario en Cita Master y sincronizarlo con Google Sheets
  app.post('/api/repo/users', async (req, res) => {
    try {
      const state = loadPersistedState();
      const { user, appsScriptExecUrl, connectionUrl, accessToken } = req.body || {};

      if (!user || !user.correo || !user.nombres) {
        res.status(400).json({ error: 'Nombre y correo institucional son obligatorios' });
        return;
      }

      const cleanEmail = String(user.correo).trim().toLowerCase();
      const cleanProfile = String(user.perfil || 'Estudiante').trim();
      const isAdmin =
        cleanEmail === 'mebolanos@cem.edu.co' ||
        /admin|administrador|coordinador|directivo/i.test(cleanProfile);

      const newUser: AuthorizedSchoolUser = {
        curso: String(user.curso || 'General').trim(),
        seccion: String(user.seccion || 'General').trim(),
        nombres: String(user.nombres).trim(),
        correo: cleanEmail,
        perfil: cleanProfile,
        isAdmin,
        createdInApp: true,
        syncedToSheet: false,
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

      if (effectiveScriptUrl) {
        const pushResult = await pushUserToAppsScriptFromServer(
          effectiveScriptUrl,
          effectiveToken,
          newUser
        );
        pushedToSheet = pushResult.pushed;
        remoteUsers = pushResult.updatedUsers;
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
        authorizedUsers: finalUsers,
        lastSyncDate: new Date().toLocaleString('es-CO'),
        lastSyncTimestamp: Date.now(),
      };

      savePersistedState(nextState);

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

  // 3. Sincronización completa desde el servidor (Drive <-> Google Sheets <-> Cita Master)
  app.post('/api/repo/sync', async (req, res) => {
    try {
      const currentState = loadPersistedState();
      const {
        appsScriptExecUrl,
        connectionUrl,
        accessToken,
        repoTabName,
        triggerDriveScan,
        clientUsers,
      } = req.body || {};

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
        repoTabName !== undefined ? repoTabName : currentState.repoTabName || 'Repositorio'
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

      let headers: string[] = [];
      let rows: Record<string, string>[] = [];
      let sheetUsers: AuthorizedSchoolUser[] = [];
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
          const actionParam = triggerDriveScan ? '&action=syncDrive' : '';
          const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
          const fullUrl = `${effectiveScriptUrl}${sep}${cacheBuster}${tokenParam}${actionParam}`;

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
            const data = JSON.parse(text);

            if (Array.isArray(data?.usuariosRows) && Array.isArray(data?.usuariosHeaders)) {
              sheetUsers = parseUsersSheetRows(data.usuariosRows, data.usuariosHeaders);
            }

            if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) {
              const incHeaders = data.headers.map((h: string) => String(h).trim());
              if (isUsersSheetData(incHeaders, data.rows)) {
                if (sheetUsers.length <= 1) {
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
                  sheetUsers = parseUsersSheetRows(data.items, itemHeaders);
                } else {
                  headers = itemHeaders;
                  rows = data.items;
                }
              }
            }
          } else if (isHtmlContent(text)) {
            sheetAccessWarning =
              'El Web App de Google Apps Script devolvió una página de inicio de sesión. Asegúrate de implementarlo con "Quién tiene acceso: Cualquier persona".';
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
            sheetAccessWarning =
              'El archivo de Google Sheets requiere permisos de lectura. En Google Sheets haz clic en "Compartir" → "Cualquier persona con el enlace (Lector)".';
            continue;
          }
          if (resPrimary.headers.length > 0 && resPrimary.rows.length > 0) {
            if (isUsersSheetData(resPrimary.headers, resPrimary.rows)) {
              if (sheetUsers.length <= 1) {
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
          const userTabCandidates = ['usuarios', 'Usuarios', 'USUARIOS', 'Hoja 1'];
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
              sheetUsers = parseUsersSheetRows(uRes.rows, uRes.headers);
              sheetAccessWarning = null;
              break;
            }
          }
        }

        // 3. Buscar explícitamente la hoja de Monografías ("Repositorio", "Unidades académicas", etc.)
        if (rows.length === 0) {
          const repoTabCandidates = Array.from(
            new Set([
              tabName || 'Repositorio',
              'Repositorio',
              'Unidades académicas',
              'Unidades Académicas',
              'Monografías',
              'Monografias',
              'Metadata Repositorio Eki',
              'Hoja 1',
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
          : isMonographsSheetData(currentState.rawHeaders, currentState.rawRows)
          ? currentState.rawHeaders
          : [];
      const nextRows =
        rows.length > 0
          ? rows
          : isMonographsSheetData(currentState.rawHeaders, currentState.rawRows)
          ? currentState.rawRows
          : [];

      const nextState: PersistedRepoState = {
        appsScriptExecUrl: effectiveScriptUrl || rawScriptInput,
        connectionUrl: effectiveSheetUrl || rawSheetInput,
        repoTabName: tabName,
        accessToken: token,
        lastSyncDate: nowStr,
        lastSyncTimestamp: nowTs,
        rawHeaders: nextHeaders,
        rawRows: nextRows,
        authorizedUsers: mergedUsers,
      };

      savePersistedState(nextState);

      res.json({
        ok: true,
        usersSyncedCount: mergedUsers.length,
        monographsSyncedCount: nextRows.length,
        sheetAccessWarning,
        state: nextState,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error durante la sincronización',
      });
    }
  });

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
