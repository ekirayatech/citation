import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  FolderGit2,
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  X,
  BookOpen,
  UserCheck,
  UserPlus,
  AlertCircle,
  Database,
  Code2,
  GraduationCap,
  Filter,
  Table2,
  CheckCircle2,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Clock,
  Upload,
  Download,
  Pencil,
  Trash2,
  Save,
  Layers,
} from 'lucide-react';
import { CitationFormData } from '../types/citation';
import {
  AuthorizedSchoolUser,
  DEFAULT_AUTHORIZED_USERS,
  DEFAULT_REPO_HEADERS,
  DEFAULT_REPO_ROWS,
  DEFAULT_USUARIOS_HEADERS,
} from '../data/repositorioDefaultData';
import { APPS_SCRIPT_CODE } from '../data/appsScriptCode';

export type { AuthorizedSchoolUser };

export interface MonographDocument {
  id: string;
  documentoId: string;
  documentCode: string;
  driveFileId: string;
  fileName: string;
  title: string;
  author: string;
  grade: string;
  academicYear: string;
  subject: string;
  docType: string;
  keywords: string[];
  keywordsRaw: string;
  abstractText: string;
  advisors: string[];
  advisorsRaw: string;
  academicUnit: string;
  areaList: string[];
  researchLine: string;
  researchLineList: string[];
  visibility: string;
  status: string;
  registeredDate: string;
  updatedDate: string;
  format: 'PDF' | 'Google Doc' | 'DOCX' | 'Archivo';
  driveUrl: string;
  isSample?: boolean;
  methodologyText?: string;
  referencesSample?: string[];
  rawRow?: Record<string, string>;
}

interface ColumnMapping {
  docIdCol: string;
  fileNameCol: string;
  titleCol: string;
  authorCol: string;
  gradeCol: string;
  academicYearCol: string;
  subjectCol: string;
  typeCol: string;
  keywordsCol: string;
  abstractCol: string;
  advisorsCol: string;
  driveIdCol: string;
  driveUrlCol: string;
  visibilityCol: string;
  statusCol: string;
  registeredDateCol: string;
  updatedDateCol: string;
  academicUnitCol: string;
  researchLineCol: string;
}

interface RepositorioSectionProps {
  onCiteMonographInGestor: (formData: Partial<CitationFormData>, title: string) => void;
  showToast: (msg: string) => void;
  onOpenCms?: () => void;
}

const DRIVE_ROOT_FOLDER_ID = '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii';
const DRIVE_ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_ROOT_FOLDER_ID}`;

const STORAGE_REPO_CONFIG_KEY = 'ekiraya_repo_unidades_academicas_v7';
const LEGACY_CONFIG_KEYS = [
  'ekiraya_repo_unidades_academicas_v7',
  'ekiraya_repo_unidades_academicas_v6',
  'ekiraya_repo_unidades_academicas_v5',
  'ekiraya_repo_unidades_academicas_v4',
  'ekiraya_repo_unidades_academicas_v3',
  'ekiraya_repo_unidades_academicas_v2',
  'ekiraya_repo_sync_config_v1',
];

const STORAGE_AUTH_USER_KEY = 'ekiraya_repo_authorized_user_v7';
const LEGACY_AUTH_KEYS = [
  'ekiraya_repo_authorized_user_v7',
  'ekiraya_repo_authorized_user_v6',
  'ekiraya_repo_authorized_user_v5',
  'ekiraya_repo_authorized_user_v4',
  'ekiraya_repo_authorized_user_v3',
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// APPS_SCRIPT_CODE importado de src/data/appsScriptCode.ts


/** Extrae el ID de una hoja de Google Sheets desde su URL */
function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Lee una pestaña de Google Sheets desde el navegador usando Google Visualization API JSONP (<script>)
 * Esto funciona incluso cuando el archivo está restringido al dominio institucional (@cem.edu.co) y evita cualquier bloqueo CORS.
 */
function fetchSheetTabViaBrowserJsonp(
  sheetId: string,
  options: { sheetName?: string; gid?: string }
): Promise<{ headers: string[]; rows: Record<string, string>[] } | null> {
  return new Promise((resolve) => {
    const callbackName = `__ekirayaGvizCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const win = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      try {
        delete win[callbackName];
      } catch {
        win[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    }, 6500);

    win[callbackName] = (response: {
      status?: string;
      table?: {
        cols?: Array<{ label?: string; id?: string }>;
        rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
      };
    }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();

      try {
        if (!response || response.status === 'error' || !response.table) {
          resolve(null);
          return;
        }
        const cols = response.table.cols || [];
        const rawTableRows = response.table.rows || [];

        let headers = cols.map((c) => String(c?.label || '').trim());
        let startRowIdx = 0;

        const nonEmptyColsCount = headers.filter(Boolean).length;
        // Si gviz no puso las etiquetas en cols.label o la mayoría están vacías, tomar la primera fila como encabezados
        if ((nonEmptyColsCount < Math.ceil(cols.length / 2) || nonEmptyColsCount === 0) && rawTableRows.length > 0) {
          const firstRowCells = rawTableRows[0]?.c || [];
          headers = firstRowCells.map((cell, idx) =>
            String(cell?.f ?? cell?.v ?? '').trim() || `Columna_${idx + 1}`
          );
          startRowIdx = 1;
        } else {
          headers = headers.map((h, idx) => h || `Columna_${idx + 1}`);
        }

        const rows: Record<string, string>[] = [];
        for (let r = startRowIdx; r < rawTableRows.length; r++) {
          const cells = rawTableRows[r]?.c || [];
          const rowObj: Record<string, string> = {};
          let hasValue = false;
          headers.forEach((h, cIdx) => {
            const cell = cells[cIdx];
            const val = cell ? String(cell.f ?? cell.v ?? '').trim() : '';
            if (val) hasValue = true;
            rowObj[h] = val;
          });
          if (hasValue) {
            rows.push(rowObj);
          }
        }

        resolve({ headers, rows });
      } catch {
        resolve(null);
      }
    };

    const params = new URLSearchParams({
      tqx: `out:json;responseHandler:${callbackName}`,
      headers: '1',
      _t: String(Date.now()),
    });
    if (options.sheetName) {
      params.set('sheet', options.sheetName);
    } else if (options.gid) {
      params.set('gid', options.gid);
    }

    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve(null);
    };

    document.body.appendChild(script);
  });
}

/**
 * Llama al Web App de Google Apps Script (/exec) mediante JSONP (<script>) o fetch desde el navegador
 */
function callAppsScriptViaBrowserJsonp(
  scriptUrl: string,
  queryParams: Record<string, string>
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const cleanUrl = (scriptUrl || '').trim();
    if (!cleanUrl.includes('script.google.com')) {
      resolve(null);
      return;
    }

    const callbackName = `__ekirayaGasCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const win = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      try {
        delete win[callbackName];
      } catch {
        win[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    }, 8000);

    win[callbackName] = (data: Record<string, unknown>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve(data || null);
    };

    const sep = cleanUrl.includes('?') ? '&' : '?';
    const qs = new URLSearchParams({
      ...queryParams,
      callback: callbackName,
      _t: String(Date.now()),
    });

    script.src = `${cleanUrl}${sep}${qs.toString()}`;
    script.async = true;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve(null);
    };

    document.body.appendChild(script);
  });
}

/** Normaliza encabezados de columna para compararlos sin importar tildes ni mayúsculas */
function normalizeHeaderKey(str: string): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHtmlString(text: string): boolean {
  const trimmed = String(text || '').trim().slice(0, 300).toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('accounts.google.com')
  );
}

/** Extrae el ID real del archivo de Google Drive desde cualquier formato de URL o celda */
function extractDriveFileId(input: string): string {
  const clean = (input || '').trim();
  if (!clean) return '';

  const matchD = clean.match(
    /\/(?:file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{15,})/
  );
  if (matchD?.[1]) return matchD[1];

  const matchQueryId = clean.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchQueryId?.[1]) return matchQueryId[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(clean) && clean !== DRIVE_ROOT_FOLDER_ID) {
    return clean;
  }

  return '';
}

/** Construye la URL de vista previa de un documento individual real de Google Drive */
function buildSingleDocPreviewUrl(driveFileId: string, driveUrl: string): string | null {
  const cleanUrl = (driveUrl || '').trim();
  const id = driveFileId || extractDriveFileId(cleanUrl);

  if (id && id !== DRIVE_ROOT_FOLDER_ID) {
    if (cleanUrl.includes('docs.google.com/document')) {
      return `https://docs.google.com/document/d/${id}/preview`;
    }
    if (cleanUrl.includes('docs.google.com/presentation')) {
      return `https://docs.google.com/presentation/d/${id}/embed`;
    }
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  if (
    cleanUrl.startsWith('http') &&
    !cleanUrl.includes('/folders/') &&
    !cleanUrl.includes('embeddedfolderview')
  ) {
    return cleanUrl.replace(/\/(?:view|edit)(?:\?.*)?$/, '/preview');
  }

  return null;
}

/** Parsea CSV o TSV (copiado directo de Google Sheets) convirtiendo la fila 1 en títulos de columna */
function parseCsvToRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvText || isHtmlString(csvText)) {
    return { headers: [], rows: [] };
  }

  // Si el usuario pegó celdas directamente desde Google Sheets (separadas por tabulador \t), detectar el delimitador
  const firstLine = csvText.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';

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
      } else if (ch === delimiter) {
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

/** Detecta si un conjunto de encabezados/filas corresponde a la hoja "usuarios" */
function isUsersSheetData(headers: string[], rows: Record<string, string>[] = []): boolean {
  if (!headers || headers.length === 0) return false;
  if (headers.some((h) => isHtmlString(h))) return false;

  const normHeaders = headers.map((h) => normalizeHeaderKey(h));
  const joined = normHeaders.join(' | ');

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

  const hasEmailCol = normHeaders.some((h) => /correo|email|e mail|mail|cuenta/.test(h));
  const hasUserMetaCol = normHeaders.some((h) =>
    /curso|seccion|perfil|rol|grado|estamento/.test(h)
  );

  if (hasEmailCol || (hasUserMetaCol && normHeaders.some((h) => /nombre/.test(h)))) {
    return true;
  }

  if (rows && rows.length > 0) {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const rowStr = Object.values(rows[r] || {}).join(' ');
      if (rowStr.includes('@') && !rowStr.includes('drive.google.com')) {
        return true;
      }
    }
  }

  return false;
}

/** Detecta si un conjunto de encabezados/filas corresponde a la hoja de Monografías */
function isMonographsSheetData(headers: string[], rows: Record<string, string>[] = []): boolean {
  if (!headers || headers.length === 0) return false;
  if (headers.some((h) => isHtmlString(h))) return false;
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

/** Detecta automáticamente los 18 títulos de columna en la hoja de Monografías */
function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const findCol = (patterns: RegExp[], excludePatterns: RegExp[] = []): string => {
    for (const pattern of patterns) {
      const found = headers.find((h) => {
        const norm = normalizeHeaderKey(h);
        if (excludePatterns.some((ex) => ex.test(norm))) return false;
        return pattern.test(norm);
      });
      if (found) return found;
    }
    return '';
  };

  return {
    docIdCol: findCol([/^documento id$/, /^id documento$/, /^codigo$/, /^documento_id$/], [/drive/]),
    fileNameCol: findCol(
      [
        /^nombre del archivo$/,
        /nombre.*archivo/,
        /^archivo$/,
        /^file\s*name$/,
        /archivo/,
      ],
      [/^id/, /url/, /enlace/, /link/, /documento id/]
    ),
    titleCol: findCol(
      [
        /^titulo$/,
        /^titulo de la monografia$/,
        /titulo.*monografia/,
        /^monografia$/,
        /nombre.*monografia/,
        /nombre.*trabajo/,
        /proyecto/,
      ],
      [/^archivo$/]
    ),
    authorCol: findCol([
      /^autor$/,
      /^autores$/,
      /^nombre y apellido$/,
      /nombre.*apellido/,
      /^estudiante$/,
      /nombre.*estudiante/,
    ]),
    gradeCol: findCol([/^grado$/, /^curso$/, /grado/, /nivel/]),
    academicYearCol: findCol([
      /^ano$/,
      /^ano lectivo$/,
      /ano.*lectivo/,
      /periodo.*lectivo/,
      /promocion/,
    ]),
    subjectCol: findCol([
      /^asignatura$/,
      /asignatura/,
      /^materia$/,
    ]),
    typeCol: findCol([/^tipo$/, /tipo.*documento/, /modalidad/]),
    keywordsCol: findCol([/^palabras clave$/, /palabras.*clave/, /keywords/, /etiquetas/]),
    abstractCol: findCol([/^resumen$/, /resumen/, /abstract/, /sintesis/]),
    advisorsCol: findCol([/^asesor\(es\)$/, /^asesores$/, /^asesor$/, /asesor/, /director/, /tutor/]),
    driveIdCol: findCol([
      /^drive file id$/,
      /drive.*file.*id/,
      /^id del archivo$/,
      /id.*archivo/,
      /drive.*id/,
    ]),
    driveUrlCol: findCol([
      /^url documento$/,
      /url.*documento/,
      /enlace.*drive/,
      /url.*drive/,
      /^enlace$/,
      /^url$/,
      /^link$/,
    ]),
    visibilityCol: findCol([/^visibilidad$/, /visibilidad/, /acceso/]),
    statusCol: findCol([/^estado$/, /estado/]),
    registeredDateCol: findCol([/^fecha registro$/, /fecha.*registro/, /creacion/]),
    updatedDateCol: findCol([/^fecha actualizacion$/, /fecha.*actualizacion/, /modificacion/]),
    academicUnitCol: findCol([
      /^area$/,
      /area/,
      /^unidad academica$/,
      /unidad.*academica/,
      /^unidad$/,
      /departamento/,
    ]),
    researchLineCol: findCol([
      /^linea de investigacion$/,
      /linea.*investigacion/,
      /^linea$/,
      /sublinea/,
    ]),
  };
}

/**
 * Convierte las filas de la hoja "usuarios" (soporta tanto 5 columnas como 4 columnas: nombres, curso, correo, sección)
 */
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
    /usuario/,
    /estudiante/,
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

  for (const row of rows) {
    let correo = (correoCol && row[correoCol]) || '';
    if (!correo || !correo.includes('@')) {
      const emailCell = Object.values(row).find((v) => {
        const str = String(v || '').trim();
        return str.includes('@') && !str.includes('drive.google.com') && !str.includes('http');
      });
      if (emailCell) correo = String(emailCell);
    }
    correo = correo.trim().toLowerCase();
    if (!correo) continue;

    const nombres =
      (nombresCol && row[nombresCol]) ||
      correo
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const curso = ((cursoCol && row[cursoCol]) || 'General').trim();
    const seccion = ((seccionCol && row[seccionCol]) || 'General').trim();
    let perfil = ((perfilCol && row[perfilCol]) || '').trim();

    const combinedRoleText = `${perfil} ${seccion} ${curso}`.toLowerCase();

    if (!perfil) {
      if (/admin|administrador|coordinador|directivo|rector|sistemas/i.test(combinedRoleText)) {
        perfil = 'Administrador';
      } else if (/docente|profesor|maestro|guia|guía/i.test(combinedRoleText)) {
        perfil = 'Docente';
      } else if (/no clases|administrativo|apoyo|servicios|planta/i.test(combinedRoleText)) {
        perfil = 'Personal no clases';
      } else {
        perfil = 'Estudiante';
      }
    }

    const isAdmin =
      correo === 'mebolanos@cem.edu.co' ||
      /admin|administrador|coordinador|directivo|sistemas|^si$|^sí$|^true$|^1$/i.test(perfil) ||
      /admin|administrador/i.test(combinedRoleText);

    parsedUsers.push({
      curso,
      seccion,
      nombres: nombres.trim(),
      correo,
      perfil,
      isAdmin,
      createdInApp: false,
      syncedToSheet: true,
      rawRow: { ...row },
    });
  }

  if (!parsedUsers.some((u) => u.correo === 'mebolanos@cem.edu.co')) {
    parsedUsers.unshift(DEFAULT_AUTHORIZED_USERS[0]);
  }

  return parsedUsers;
}

/** Obtiene el valor de una celda de usuario según el título exacto de la columna en Google Sheets */
function getUserCellValue(user: AuthorizedSchoolUser, header: string): string {
  if (user.rawRow) {
    if (user.rawRow[header] !== undefined && String(user.rawRow[header]).trim() !== '') {
      return String(user.rawRow[header]);
    }
    const normTarget = normalizeHeaderKey(header);
    const matchingKey = Object.keys(user.rawRow).find(
      (k) => normalizeHeaderKey(k) === normTarget
    );
    if (matchingKey && String(user.rawRow[matchingKey]).trim() !== '') {
      return String(user.rawRow[matchingKey]);
    }
  }

  const norm = normalizeHeaderKey(header);
  if (/correo|email|e mail|mail|cuenta/.test(norm)) return user.correo;
  if (/curso|grado|nivel/.test(norm)) return user.curso;
  if (/seccion|dependencia|area/.test(norm)) return user.seccion;
  if (/perfil|rol|cargo|tipo|estamento/.test(norm)) return user.perfil;
  if (/nombre|apellido|estudiante|usuario/.test(norm)) return user.nombres;
  return user.rawRow?.[header] || '';
}

/** Une la lista de usuarios leída de Google Sheets con la comunidad de Ekirayá asegurando que Google Sheets sea la fuente autorizada de la verdad */
function mergeUsersLists(
  sheetUsers: AuthorizedSchoolUser[],
  existingAppUsers: AuthorizedSchoolUser[]
): AuthorizedSchoolUser[] {
  // Si tenemos usuarios provenientes de Google Sheets, la hoja es la fuente autorizada (altas, bajas y ediciones en la hoja mandan)
  if (sheetUsers && sheetUsers.length > 0) {
    const map = new Map<string, AuthorizedSchoolUser>();

    // Los datos de Google Sheets sobreescriben cualquier copia local (reflejan nombres, curso, rol, etc. editados en Sheets)
    for (const u of sheetUsers) {
      if (u && u.correo) {
        const key = u.correo.trim().toLowerCase();
        map.set(key, {
          ...u,
          correo: key,
          isAdmin: Boolean(
            u.isAdmin ||
            key === 'mebolanos@cem.edu.co' ||
            /admin|administrador|coordinador|directivo/i.test(u.perfil || '')
          ),
          createdInApp: false,
          syncedToSheet: true,
          rawRow: u.rawRow ? { ...u.rawRow } : undefined,
        });
      }
    }

    // Conservar solo usuarios creados en la app que aún no hayan terminado de registrarse en Sheets
    for (const u of existingAppUsers || []) {
      if (u && u.correo && u.createdInApp && !u.syncedToSheet) {
        const key = u.correo.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, u);
        }
      }
    }

    // Asegurar que mebolanos@cem.edu.co siempre exista como fallback si la hoja no lo tiene
    const adminKey = 'mebolanos@cem.edu.co';
    if (!map.has(adminKey)) {
      map.set(adminKey, DEFAULT_AUTHORIZED_USERS[0]);
    }

    return Array.from(map.values());
  }

  // Fallback si aún no se ha conectado ni leído la hoja "usuarios" de Google Sheets
  const map = new Map<string, AuthorizedSchoolUser>();
  for (const defUser of DEFAULT_AUTHORIZED_USERS) {
    map.set(defUser.correo.toLowerCase(), defUser);
  }
  for (const u of existingAppUsers || []) {
    if (u && u.correo) {
      map.set(u.correo.trim().toLowerCase(), u);
    }
  }
  return Array.from(map.values());
}

function splitMultilineItems(raw: string): string[] {
  return String(raw || '')
    .split(/[\r\n]+/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter(Boolean);
}

function splitKeywords(raw: string): string[] {
  return String(raw || '')
    .replace(/[\r\n]+/g, ' ')
    .split(/[,;]+/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter(Boolean);
}

/** Convierte las filas reales de la BD organizada en objetos MonographDocument completos */
function mapSheetRowsToMonographs(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  headers: string[]
): MonographDocument[] {
  if (!rawRows || rawRows.length === 0 || isUsersSheetData(headers, rawRows)) {
    return [];
  }

  const getCell = (row: Record<string, string>, colName: string, fallbackKeys: string[] = []): string => {
    if (colName && row[colName] !== undefined) return String(row[colName]).trim();
    for (const k of fallbackKeys) {
      if (row[k] !== undefined) return String(row[k]).trim();
      const foundKey = Object.keys(row).find(
        (rk) => normalizeHeaderKey(rk) === normalizeHeaderKey(k)
      );
      if (foundKey && row[foundKey] !== undefined) return String(row[foundKey]).trim();
    }
    return '';
  };

  return rawRows
    .map((row, idx) => {
      const documentoId =
        getCell(row, mapping.docIdCol, ['documento_id', 'id']) || String(idx + 1);
      const titleVal = getCell(row, mapping.titleCol, [
        'titulo',
        'Título de la monografía',
        'Título',
      ]);
      const fileNameVal =
        getCell(row, mapping.fileNameCol, ['Nombre del archivo', 'archivo']) ||
        (titleVal ? `${documentoId}_${titleVal.slice(0, 45).replace(/\s+/g, '_')}.pdf` : '');

      const authorVal =
        getCell(row, mapping.authorCol, ['autor', 'Autor', 'Estudiante']) ||
        'Estudiante Grado 11°';
      const gradeVal = getCell(row, mapping.gradeCol, ['grado', 'Grado', 'curso']) || '11';
      const academicYearVal =
        getCell(row, mapping.academicYearCol, ['año', 'Año', 'Año lectivo']) || '2026';
      const subjectVal =
        getCell(row, mapping.subjectCol, ['asignatura', 'Asignatura']) || 'Proyecto de vida';
      const docTypeVal =
        getCell(row, mapping.typeCol, ['tipo', 'Tipo']) || 'Investigación';

      const keywordsRaw = getCell(row, mapping.keywordsCol, [
        'palabras_clave',
        'Palabras clave',
      ]);
      const keywords = splitKeywords(keywordsRaw);

      const abstractVal = getCell(row, mapping.abstractCol, ['resumen', 'Resumen']);
      const advisorsRaw = getCell(row, mapping.advisorsCol, [
        'Asesor(es)',
        'Asesores',
        'Asesor',
      ]);
      const advisors = splitMultilineItems(advisorsRaw);

      const areaRaw =
        getCell(row, mapping.academicUnitCol, ['Ärea', 'Área', 'Area', 'Unidad académica']) ||
        'Ciencias y Humanidades';
      const areaList = splitMultilineItems(areaRaw);
      const academicUnitVal = areaList.join(' · ') || areaRaw;

      const researchLineRaw = getCell(row, mapping.researchLineCol, [
        'Linea de investigación',
        'Línea de investigación',
      ]);
      const researchLineList = splitMultilineItems(researchLineRaw);
      const researchLineVal = researchLineList.join(' · ') || researchLineRaw;

      const visibilityVal =
        getCell(row, mapping.visibilityCol, ['visibilidad', 'Visibilidad']) || 'Digital';
      const statusVal =
        getCell(row, mapping.statusCol, ['estado', 'Estado']) || 'Finalizado';
      const registeredDateVal =
        getCell(row, mapping.registeredDateCol, ['fecha_registro']) || '23 enero 2026';
      const updatedDateVal =
        getCell(row, mapping.updatedDateCol, ['fecha_actualizacion']) || '10-04-2026';

      let rawUrl = getCell(row, mapping.driveUrlCol, ['url_documento', 'Enlace Drive']);
      if (!rawUrl && mapping.driveUrlCol && row[`${mapping.driveUrlCol}_url`]) {
        rawUrl = row[`${mapping.driveUrlCol}_url`];
      }
      const rawIdCell = getCell(row, mapping.driveIdCol, ['drive_file_id', 'ID del archivo']);
      const extractedFileId = extractDriveFileId(rawIdCell) || extractDriveFileId(rawUrl);

      const finalDriveUrl =
        rawUrl ||
        (extractedFileId
          ? `https://drive.google.com/file/d/${extractedFileId}/view`
          : DRIVE_ROOT_FOLDER_URL);

      return {
        id: `mono-${documentoId}-${idx}`,
        documentoId,
        documentCode: documentoId || `MONO-${idx + 1}`,
        driveFileId: extractedFileId,
        fileName: fileNameVal,
        title: titleVal || fileNameVal,
        author: authorVal,
        grade: gradeVal,
        academicYear: academicYearVal,
        subject: subjectVal,
        docType: docTypeVal,
        keywords,
        keywordsRaw,
        abstractText: abstractVal,
        advisors,
        advisorsRaw,
        academicUnit: academicUnitVal,
        areaList: areaList.length > 0 ? areaList : [academicUnitVal],
        researchLine: researchLineVal,
        researchLineList,
        visibility: visibilityVal,
        status: statusVal,
        registeredDate: registeredDateVal,
        updatedDate: updatedDateVal,
        format: 'PDF' as const,
        driveUrl: finalDriveUrl,
        isSample: false,
        rawRow: row,
      };
    })
    .filter((doc) => Boolean(doc.title.trim()));
}

const SAMPLE_THREE_MONOGRAPHS: MonographDocument[] = mapSheetRowsToMonographs(
  DEFAULT_REPO_ROWS,
  autoDetectColumnMapping(DEFAULT_REPO_HEADERS),
  DEFAULT_REPO_HEADERS
);

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({
  onCiteMonographInGestor,
  showToast,
}) => {
  // Datos del Repositorio inicializados con la nueva BD organizada de 20 monografías
  const [rawHeaders, setRawHeaders] = useState<string[]>(DEFAULT_REPO_HEADERS);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>(DEFAULT_REPO_ROWS);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(() =>
    autoDetectColumnMapping(DEFAULT_REPO_HEADERS)
  );

  const [forceShowSamples, setForceShowSamples] = useState<boolean>(false);

  // Datos y columnas de la hoja "usuarios" con los 37 integrantes de la comunidad Ekirayá
  const [authorizedUsers, setAuthorizedUsers] =
    useState<AuthorizedSchoolUser[]>(DEFAULT_AUTHORIZED_USERS);
  const [usuariosHeaders, setUsuariosHeaders] = useState<string[]>(DEFAULT_USUARIOS_HEADERS);
  const [currentUser, setCurrentUser] = useState<AuthorizedSchoolUser | null>(null);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filtros construidos directamente sobre las 17 columnas de la hoja "repositorio":
  // documento_id, titulo, autor, grado, año, Unidad Académica, Linea de investigación, tipo, palabras_clave, resumen, Asesor(es), drive_file_id, url_documento, visibilidad, estado, fecha_registro, fecha_actualizacion
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicUnit, setSelectedAcademicUnit] = useState<string>('all');
  const [selectedResearchLine, setSelectedResearchLine] = useState<string>('all');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'author' | 'unit' | 'year'>('id');
  const [previewMode, setPreviewMode] = useState<'featured3' | 'filtered' | 'reader'>('featured3');
  const [readerActiveDocId, setReaderActiveDocId] = useState<string>('2262');
  const [showColumnsExplainer, setShowColumnsExplainer] = useState<boolean>(true);
  const [isInitializingUsersSheet, setIsInitializingUsersSheet] = useState<boolean>(false);
  const [userProfileFilter, setUserProfileFilter] = useState<string>('all');

  // Paginación de la Vista Previa de 3 Monografías
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Modal de vista previa en pantalla completa
  const [previewDoc, setPreviewDoc] = useState<MonographDocument | null>(null);

  // Sección exclusiva de Administrador
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(true);
  const [appsScriptExecUrl, setAppsScriptExecUrl] = useState<string>('');
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [repoTabName, setRepoTabName] = useState<string>('repositorio');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [sheetAccessWarning, setSheetAccessWarning] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Importación directa por pegado o CSV (útil si el Sheet tiene restricción de dominio)
  const [showQuickPasteModal, setShowQuickPasteModal] = useState<boolean>(false);
  const [quickPasteText, setQuickPasteText] = useState<string>('');

  // Campos dinámicos para crear usuario y enviarlo con las columnas exactas de la hoja "usuarios"
  const [newUserFieldValues, setNewUserFieldValues] = useState<Record<string, string>>({});
  const [newUserIsAdminFlag, setNewUserIsAdminFlag] = useState<boolean>(false);
  const [showEditColumns, setShowEditColumns] = useState<boolean>(false);
  const [editingColumnsText, setEditingColumnsText] = useState<string>(
    DEFAULT_USUARIOS_HEADERS.join(', ')
  );

  // Registro y creación de usuario desde la app (alimenta en ambas direcciones)
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [registerName, setRegisterName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerCurso, setRegisterCurso] = useState<string>('11°');
  const [registerSeccion, setRegisterSeccion] = useState<string>('Bachillerato');
  const [registerPerfil, setRegisterPerfil] = useState<string>('Estudiante');
  const [isRegisteringUser, setIsRegisteringUser] = useState<boolean>(false);

  // Estados para Edición y Eliminación de Usuarios en el Panel de la App
  const [editingUser, setEditingUser] = useState<AuthorizedSchoolUser | null>(null);
  const [editUserFields, setEditUserFields] = useState<Record<string, string>>({});
  const [editUserIsAdmin, setEditUserIsAdmin] = useState<boolean>(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);

  const [deletingUser, setDeletingUser] = useState<AuthorizedSchoolUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Modal para conectar Apps Script si el usuario pulsa "Sincronizar ahora" sin URL
  const [showSyncConfigModal, setShowSyncConfigModal] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);

  /** Persiste toda la configuración en localStorage */
  const saveLocalRepoConfig = useCallback(
    (nextData: {
      appsScriptExecUrl: string;
      connectionUrl: string;
      repoTabName: string;
      accessToken: string;
      lastSyncDate: string | null;
      rawHeaders: string[];
      rawRows: Record<string, string>[];
      columnMapping: ColumnMapping;
      authorizedUsers: AuthorizedSchoolUser[];
      usuariosHeaders?: string[];
    }) => {
      try {
        localStorage.setItem(
          STORAGE_REPO_CONFIG_KEY,
          JSON.stringify({
            ...nextData,
            lastSyncTimestamp: Date.now(),
          })
        );
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  /**
   * Sincroniza monografías y hoja "usuarios":
   * 1) Primero lee desde el navegador vía JSONP (usa la sesión activa de Google @cem.edu.co si la hoja es privada del colegio)
   * 2) Luego sincroniza con el backend Express (/api/repo/sync) y Google Apps Script (/exec)
   */
  const executeSyncWithSheets = useCallback(
    async (
      targetScriptUrl: string,
      targetSheetUrl: string,
      targetToken: string,
      targetTabName: string,
      currentUsersList: AuthorizedSchoolUser[],
      options?: { silent?: boolean; triggerDriveScan?: boolean; isManual?: boolean }
    ) => {
      let cleanScript = targetScriptUrl.trim();
      let cleanSheet = targetSheetUrl.trim();

      if (cleanSheet.includes('script.google.com') && !cleanScript) {
        cleanScript = cleanSheet;
      }
      if (cleanScript.includes('/spreadsheets/d/') && !cleanSheet) {
        cleanSheet = cleanScript;
        cleanScript = '';
      }

      setIsSyncing(true);
      setSheetAccessWarning(null);

      try {
        let clientUsuariosHeaders: string[] = [];
        let clientUsuariosRows: Record<string, string>[] = [];
        let clientUsers: AuthorizedSchoolUser[] = [];
        let clientRawHeaders: string[] = [];
        let clientRawRows: Record<string, string>[] = [];

        // PASO A: Lectura directa desde el navegador vía JSONP (funciona incluso con hojas restringidas a @cem.edu.co)
        const sheetId = extractSpreadsheetId(cleanSheet || cleanScript);
        const gidMatch = (cleanSheet || cleanScript).match(/[#&?]gid=([0-9]+)/);
        const urlGid = gidMatch?.[1];

        if (sheetId) {
          for (const sheetCandidate of [
            'usuarios',
            'Usuarios',
            'USUARIOS',
            'usuario',
            'Usuario',
            'users',
            'Users',
          ]) {
            const browserUsersTab = await fetchSheetTabViaBrowserJsonp(sheetId, {
              sheetName: sheetCandidate,
            });
            if (
              browserUsersTab &&
              browserUsersTab.headers.length > 0 &&
              isUsersSheetData(browserUsersTab.headers, browserUsersTab.rows)
            ) {
              clientUsuariosHeaders = browserUsersTab.headers;
              clientUsuariosRows = browserUsersTab.rows;
              clientUsers = parseUsersSheetRows(browserUsersTab.rows, browserUsersTab.headers);
              break;
            }
          }

          if (clientUsuariosHeaders.length === 0) {
            const firstTab = await fetchSheetTabViaBrowserJsonp(
              sheetId,
              urlGid ? { gid: urlGid } : {}
            );
            if (firstTab && firstTab.headers.length > 0) {
              if (isUsersSheetData(firstTab.headers, firstTab.rows)) {
                clientUsuariosHeaders = firstTab.headers;
                clientUsuariosRows = firstTab.rows;
                clientUsers = parseUsersSheetRows(firstTab.rows, firstTab.headers);
              } else if (isMonographsSheetData(firstTab.headers, firstTab.rows)) {
                clientRawHeaders = firstTab.headers;
                clientRawRows = firstTab.rows;
              }
            }
          }

          if (clientRawHeaders.length === 0) {
            const candidateRepoTabs = Array.from(
              new Set([
                targetTabName.trim(),
                'repositorio',
                'Repositorio',
                'REPOSITORIO',
                'Hoja 1',
                'Sheet 1',
                'Hoja1',
                'Sheet1',
                'Monografías',
                'Monografias',
                'Unidades Académicas',
              ])
            ).filter(Boolean);

            for (const candidateTab of candidateRepoTabs) {
              const browserRepoTab = await fetchSheetTabViaBrowserJsonp(sheetId, {
                sheetName: candidateTab,
              });
              if (
                browserRepoTab &&
                browserRepoTab.headers.length > 0 &&
                isMonographsSheetData(browserRepoTab.headers, browserRepoTab.rows)
              ) {
                clientRawHeaders = browserRepoTab.headers;
                clientRawRows = browserRepoTab.rows;
                break;
              }
            }
          }
        }

        // PASO B: Si hay URL Web App de Apps Script (/exec), consultar también vía JSONP desde el navegador
        if (cleanScript && cleanScript.includes('script.google.com')) {
          const jsonpExec = await callAppsScriptViaBrowserJsonp(cleanScript, {
            token: targetToken.trim() || 'EKIRAYA-2026',
            action: options?.triggerDriveScan ? 'syncDriveAndSheets' : 'syncRepo',
            sheet: targetTabName.trim() || 'repositorio',
            repoTabName: targetTabName.trim() || 'repositorio',
            _t: String(Date.now()),
          });
          if (jsonpExec && !jsonpExec.error) {
            const rawUHeaders =
              (Array.isArray(jsonpExec.usuariosHeaders) ? jsonpExec.usuariosHeaders : null) ||
              (Array.isArray(jsonpExec.usersHeaders) ? jsonpExec.usersHeaders : null) ||
              [];
            const uHeaders: string[] = rawUHeaders.map(String);
            const uRows: Record<string, string>[] =
              (Array.isArray(jsonpExec.usuariosRows) ? jsonpExec.usuariosRows : null) ||
              (Array.isArray(jsonpExec.usersRows) ? jsonpExec.usersRows : null) ||
              (Array.isArray(jsonpExec.users) ? jsonpExec.users : null) ||
              [];
            if (uHeaders.length > 0 || uRows.length > 0) {
              const effHeaders =
                uHeaders.length > 0 ? uHeaders : Object.keys(uRows[0] || {});
              clientUsuariosHeaders = effHeaders;
              clientUsuariosRows = uRows;
              clientUsers = parseUsersSheetRows(uRows, effHeaders);
            }

            const rHeaders: string[] = Array.isArray(jsonpExec.headers)
              ? jsonpExec.headers.map(String)
              : [];
            const rRows: Record<string, string>[] = Array.isArray(jsonpExec.rows)
              ? jsonpExec.rows
              : [];
            if (rHeaders.length > 0 && isMonographsSheetData(rHeaders, rRows)) {
              clientRawHeaders = rHeaders;
              clientRawRows = rRows;
            }
          }
        }

        const combinedClientUsers =
          clientUsers.length > 0
            ? mergeUsersLists(clientUsers, currentUsersList)
            : currentUsersList;

        // PASO C: Sincronizar con el servidor Node.js (/api/repo/sync)
        const serverResp = await fetch('/api/repo/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptExecUrl: cleanScript,
            connectionUrl: cleanSheet,
            accessToken: targetToken.trim(),
            repoTabName: targetTabName.trim() || 'Repositorio',
            triggerDriveScan: Boolean(options?.triggerDriveScan),
            clientUsers: combinedClientUsers,
            clientUsuariosHeaders,
            clientUsuariosRows,
            clientRawHeaders,
            clientRawRows,
          }),
        });

        if (serverResp.ok) {
          const data = await serverResp.json();
          if (data?.state) {
            const st = data.state;
            const mergedUsers = mergeUsersLists(st.authorizedUsers || [], combinedClientUsers);
            const incomingHeaders: string[] = Array.isArray(st.rawHeaders) ? st.rawHeaders : [];
            const incomingRows: Record<string, string>[] = Array.isArray(st.rawRows)
              ? st.rawRows
              : [];
            const incomingUsuariosHeaders: string[] =
              Array.isArray(st.usuariosHeaders) && st.usuariosHeaders.length > 0
                ? st.usuariosHeaders
                : clientUsuariosHeaders.length > 0
                  ? clientUsuariosHeaders
                  : usuariosHeaders;

            const validMonoData = isMonographsSheetData(incomingHeaders, incomingRows);
            const finalHeaders =
              validMonoData && incomingHeaders.length > 0 ? incomingHeaders : DEFAULT_REPO_HEADERS;
            const finalRows =
              validMonoData && incomingRows.length > 0 ? incomingRows : DEFAULT_REPO_ROWS;
            const detectedMapping =
              finalHeaders.length > 0 ? autoDetectColumnMapping(finalHeaders) : columnMapping;

            setRawHeaders(finalHeaders);
            setRawRows(finalRows);
            setColumnMapping(detectedMapping);
            setAuthorizedUsers(mergedUsers);
            setUsuariosHeaders(incomingUsuariosHeaders);
            setEditingColumnsText(incomingUsuariosHeaders.join(', '));
            setLastSyncDate(st.lastSyncDate || new Date().toLocaleString('es-CO'));

            if (data.sheetAccessWarning && clientUsuariosHeaders.length === 0 && clientRawHeaders.length === 0) {
              setSheetAccessWarning(String(data.sheetAccessWarning));
            }
            if (finalRows.length > 0) {
              setForceShowSamples(false);
            }

            setCurrentUser((prev) => {
              if (!prev) return null;
              const refreshed = mergedUsers.find(
                (u) => u.correo.toLowerCase() === prev.correo.toLowerCase()
              );
              if (refreshed) {
                try {
                  localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(refreshed));
                } catch {
                  // Ignore
                }
                return refreshed;
              }
              return prev;
            });

            saveLocalRepoConfig({
              appsScriptExecUrl: st.appsScriptExecUrl || cleanScript,
              connectionUrl: st.connectionUrl || cleanSheet,
              repoTabName: st.repoTabName || targetTabName,
              accessToken: st.accessToken || targetToken,
              lastSyncDate: st.lastSyncDate || new Date().toLocaleString('es-CO'),
              rawHeaders: finalHeaders,
              rawRows: finalRows,
              columnMapping: detectedMapping,
              authorizedUsers: mergedUsers,
              usuariosHeaders: incomingUsuariosHeaders,
            });

            if (!options?.silent) {
              if (options?.isManual) {
                showToast(
                  `¡Sincronización manual en tiempo real completada! Hoja 'Repositorio': ${finalRows.length} monografías actualizadas · ${mergedUsers.length} usuarios sincronizados.`
                );
              } else if (data.sheetAccessWarning && clientUsuariosHeaders.length === 0) {
                showToast(data.sheetAccessWarning);
              } else if (finalRows.length > 0) {
                showToast(
                  `Sincronización exitosa: ${mergedUsers.length} usuarios (${incomingUsuariosHeaders.join(' · ')}) y ${finalRows.length} monografías en hoja 'Repositorio'.`
                );
              } else {
                showToast(
                  `Hoja "usuarios" sincronizada (${mergedUsers.length} usuarios · Columnas: ${incomingUsuariosHeaders.join(' · ')}).`
                );
              }
            }
            return;
          }
        }
      } catch {
        // Fallback en cliente si el endpoint local no responde
      } finally {
        setIsSyncing(false);
      }
    },
    [columnMapping, saveLocalRepoConfig, showToast, usuariosHeaders]
  );

  /**
   * Sincronización manual para la hoja 'Repositorio' conectando con Apps Script:
   * Asegura que el botón 'Sincronizar ahora' actualice correctamente la base de datos en tiempo real.
   */
  const handleManualSyncNow = async () => {
    const cleanScript = (appsScriptExecUrl || '').trim();
    const cleanConn = (connectionUrl || '').trim();

    if (!cleanScript && !cleanConn) {
      setShowSyncConfigModal(true);
      return;
    }

    showToast('Conectando con Apps Script para sincronizar la hoja "Repositorio" en tiempo real...');
    await executeSyncWithSheets(
      cleanScript,
      cleanConn,
      accessToken,
      repoTabName || 'repositorio',
      authorizedUsers,
      { triggerDriveScan: false, silent: false, isManual: true }
    );
  };

  /**
   * Aplica un estado compartido recibido desde el servidor Node.js o desde otra terminal en tiempo real.
   * Garantiza que la información mostrada corresponda fielmente a Google Sheets.
   */
  const applySharedState = useCallback(
    (st: any) => {
      if (!st || typeof st !== 'object') return;

      if (st.appsScriptExecUrl !== undefined && st.appsScriptExecUrl !== '') {
        setAppsScriptExecUrl(st.appsScriptExecUrl);
      }
      if (st.connectionUrl !== undefined && st.connectionUrl !== '') {
        setConnectionUrl(st.connectionUrl);
      }
      if (st.repoTabName !== undefined && st.repoTabName !== '') {
        setRepoTabName(st.repoTabName);
      }
      if (st.accessToken !== undefined && st.accessToken !== '') {
        setAccessToken(st.accessToken);
      }
      if (st.lastSyncDate) {
        setLastSyncDate(st.lastSyncDate);
      }

      let effectiveHeaders = rawHeaders;
      let effectiveRows = rawRows;

      if (
        Array.isArray(st.rawHeaders) &&
        Array.isArray(st.rawRows) &&
        isMonographsSheetData(st.rawHeaders, st.rawRows)
      ) {
        effectiveHeaders = st.rawHeaders;
        effectiveRows = st.rawRows;
        setRawHeaders(st.rawHeaders);
        setRawRows(st.rawRows);
        const detected = autoDetectColumnMapping(st.rawHeaders);
        setColumnMapping(detected);
        if (st.rawRows.length > 0) {
          setForceShowSamples(false);
        }
      }

      let effectiveUsers = authorizedUsers;
      if (Array.isArray(st.authorizedUsers) && st.authorizedUsers.length > 0) {
        effectiveUsers = st.authorizedUsers;
        setAuthorizedUsers(st.authorizedUsers);
        setCurrentUser((prev) => {
          if (!prev) return null;
          const refreshed = st.authorizedUsers.find(
            (u: AuthorizedSchoolUser) => u.correo.toLowerCase() === prev.correo.toLowerCase()
          );
          if (refreshed) {
            try {
              localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(refreshed));
            } catch {
              // ignore
            }
            return refreshed;
          }
          return prev;
        });
      }

      let effectiveUserHeaders = usuariosHeaders;
      if (Array.isArray(st.usuariosHeaders) && st.usuariosHeaders.length > 0) {
        effectiveUserHeaders = st.usuariosHeaders;
        setUsuariosHeaders(st.usuariosHeaders);
        setEditingColumnsText(st.usuariosHeaders.join(', '));
      }

      saveLocalRepoConfig({
        appsScriptExecUrl: st.appsScriptExecUrl || appsScriptExecUrl,
        connectionUrl: st.connectionUrl || connectionUrl,
        repoTabName: st.repoTabName || repoTabName,
        accessToken: st.accessToken || accessToken,
        lastSyncDate: st.lastSyncDate || lastSyncDate,
        rawHeaders: effectiveHeaders,
        rawRows: effectiveRows,
        columnMapping: autoDetectColumnMapping(effectiveHeaders),
        authorizedUsers: effectiveUsers,
        usuariosHeaders: effectiveUserHeaders,
      });
    },
    [
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate,
      rawHeaders,
      rawRows,
      authorizedUsers,
      usuariosHeaders,
      saveLocalRepoConfig,
    ]
  );

  /**
   * Guarda de manera centralizada la dirección de implementación de Google Sheets / Apps Script
   * en el servidor Node.js (/api/repo/config) para que quede disponible para todas las terminales,
   * computadores e IPs que accedan al aplicativo (soporta más de 50 dispositivos simultáneos).
   */
  const handleSaveGlobalConfigToServer = useCallback(
    async (showUserFeedback = false) => {
      const cleanScript = (appsScriptExecUrl || '').trim();
      const cleanSheet = (connectionUrl || '').trim();
      const cleanToken = (accessToken || '').trim() || 'EKIRAYA-2026';
      const cleanTab = (repoTabName || '').trim() || 'repositorio';

      if (!cleanScript && !cleanSheet && !showUserFeedback) {
        return;
      }

      setIsSavingConfig(true);
      try {
        const resp = await fetch('/api/repo/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptExecUrl: cleanScript,
            connectionUrl: cleanSheet,
            accessToken: cleanToken,
            repoTabName: cleanTab,
            authorizedUsers,
            usuariosHeaders,
            rawHeaders,
            rawRows,
          }),
        });

        if (resp.ok) {
          const result = await resp.json();
          if (result?.state) {
            applySharedState(result.state);
          }
          if (showUserFeedback) {
            const count = (result?.state?.authorizedUsers || authorizedUsers || []).length;
            showToast(`✅ Configuración y ${count} usuarios guardados en el servidor para todos los equipos.`);
          }
          if (cleanScript || cleanSheet) {
            executeSyncWithSheets(
              cleanScript,
              cleanSheet,
              cleanToken,
              cleanTab,
              authorizedUsers,
              { triggerDriveScan: false, silent: !showUserFeedback }
            );
          }
        } else {
          const errData = await resp.json().catch(() => null);
          const errMsg = errData?.error || 'No se pudo guardar la configuración en el servidor central.';
          if (showUserFeedback) {
            showToast(`⚠️ ${errMsg}`);
          }
        }
      } catch (err: any) {
        if (showUserFeedback) {
          showToast(`⚠️ Error al contactar al servidor: ${err?.message || 'Error de conexión'}`);
        }
      } finally {
        setIsSavingConfig(false);
      }
    },
    [appsScriptExecUrl, connectionUrl, accessToken, repoTabName, authorizedUsers, usuariosHeaders, rawHeaders, rawRows, applySharedState, showToast, executeSyncWithSheets]
  );

  // 1. Carga inicial: Recupera de localStorage y sincroniza de inmediato con el servidor central /api/repo/state
  useEffect(() => {
    let accumulatedUsers: AuthorizedSchoolUser[] = [...DEFAULT_AUTHORIZED_USERS];
    let savedScriptUrl = '';
    let savedSheetUrl = '';
    let savedToken = 'EKIRAYA-2026';
    let savedTab = 'repositorio';
    let savedHeaders: string[] = [];
    let savedRows: Record<string, string>[] = [];
    let savedUsuariosHeaders: string[] = DEFAULT_USUARIOS_HEADERS;
    let savedLastSync: string | null = null;

    try {
      // Recorrer claves anteriores para rescatar configuración local rápida
      for (const key of [...LEGACY_CONFIG_KEYS].reverse()) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== 'object') continue;

          const rawExec = String(parsed.appsScriptExecUrl || parsed.appsScriptUrl || '').trim();
          const rawConn = String(parsed.connectionUrl || parsed.usersSheetUrl || '').trim();

          if (rawExec.includes('script.google.com')) savedScriptUrl = rawExec;
          else if (rawConn.includes('script.google.com')) savedScriptUrl = rawConn;

          if (rawConn.includes('/spreadsheets/d/')) savedSheetUrl = rawConn;
          else if (rawExec.includes('/spreadsheets/d/')) savedSheetUrl = rawExec;

          if (parsed.repoTabName) savedTab = String(parsed.repoTabName);
          if (parsed.accessToken) savedToken = String(parsed.accessToken);
          if (parsed.lastSyncDate) savedLastSync = String(parsed.lastSyncDate);
          if (Array.isArray(parsed.usuariosHeaders) && parsed.usuariosHeaders.length > 0) {
            savedUsuariosHeaders = parsed.usuariosHeaders.map(String);
          }

          if (Array.isArray(parsed.authorizedUsers) && parsed.authorizedUsers.length > 0) {
            accumulatedUsers = mergeUsersLists(parsed.authorizedUsers, accumulatedUsers);
          }

          if (Array.isArray(parsed.rawHeaders) && Array.isArray(parsed.rawRows)) {
            if (isUsersSheetData(parsed.rawHeaders, parsed.rawRows)) {
              savedUsuariosHeaders = parsed.rawHeaders.map(String);
              const rescuedUsers = parseUsersSheetRows(parsed.rawRows, parsed.rawHeaders);
              accumulatedUsers = mergeUsersLists(rescuedUsers, accumulatedUsers);
            } else if (
              isMonographsSheetData(parsed.rawHeaders, parsed.rawRows) &&
              parsed.rawRows.length > 0
            ) {
              savedHeaders = parsed.rawHeaders;
              savedRows = parsed.rawRows;
            }
          }
        } catch {
          // Ignore malformed key
        }
      }

      setAppsScriptExecUrl(savedScriptUrl);
      setConnectionUrl(savedSheetUrl);
      setRepoTabName(savedTab);
      setAccessToken(savedToken);
      setLastSyncDate(savedLastSync);
      setAuthorizedUsers(accumulatedUsers);
      setUsuariosHeaders(savedUsuariosHeaders);
      setEditingColumnsText(savedUsuariosHeaders.join(', '));

      if (savedHeaders.length > 0 && savedRows.length > 0) {
        setRawHeaders(savedHeaders);
        setRawRows(savedRows);
        setColumnMapping(autoDetectColumnMapping(savedHeaders));
      }

      // Restaurar sesión activa del usuario
      for (const authKey of LEGACY_AUTH_KEYS) {
        const savedAuth = localStorage.getItem(authKey);
        if (savedAuth) {
          try {
            const parsedAuth = JSON.parse(savedAuth);
            if (parsedAuth?.correo) {
              const matched = accumulatedUsers.find(
                (u) => u.correo.toLowerCase() === String(parsedAuth.correo).toLowerCase()
              );
              if (matched) {
                setCurrentUser(matched);
                break;
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Consultar de inmediato al servidor central para unificar con cualquier otra terminal
    fetch('/api/repo/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverState) => {
        if (serverState) {
          applySharedState(serverState);
          const effectiveScript = serverState.appsScriptExecUrl || savedScriptUrl;
          const effectiveSheet = serverState.connectionUrl || savedSheetUrl;
          const effectiveTok = serverState.accessToken || savedToken;
          const effectiveTab = serverState.repoTabName || savedTab;
          const effectiveUsrs =
            serverState.authorizedUsers && serverState.authorizedUsers.length > 0
              ? serverState.authorizedUsers
              : accumulatedUsers;

          // Si el cliente tiene una URL o usuarios guardados en su localStorage que el servidor aún no tiene,
          // registrarlos automáticamente en el servidor central para beneficiar a todas las demás terminales:
          if (
            (!serverState.appsScriptExecUrl && savedScriptUrl) ||
            (!serverState.connectionUrl && savedSheetUrl) ||
            (accumulatedUsers.length > (serverState.authorizedUsers?.length || 0))
          ) {
            fetch('/api/repo/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appsScriptExecUrl: effectiveScript,
                connectionUrl: effectiveSheet,
                accessToken: effectiveTok,
                repoTabName: effectiveTab,
                authorizedUsers: accumulatedUsers,
                usuariosHeaders: savedUsuariosHeaders,
                rawHeaders: savedHeaders,
                rawRows: savedRows,
              }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((res) => {
                if (res?.state) applySharedState(res.state);
              })
              .catch(() => {});
          }

          if (effectiveScript || effectiveSheet) {
            executeSyncWithSheets(
              effectiveScript,
              effectiveSheet,
              effectiveTok,
              effectiveTab,
              effectiveUsrs,
              { silent: true, triggerDriveScan: false }
            );
          }
        } else if (savedScriptUrl || savedSheetUrl) {
          executeSyncWithSheets(
            savedScriptUrl,
            savedSheetUrl,
            savedToken,
            savedTab,
            accumulatedUsers,
            { silent: true, triggerDriveScan: false }
          );
        }
      })
      .catch(() => {
        if (savedScriptUrl || savedSheetUrl) {
          executeSyncWithSheets(
            savedScriptUrl,
            savedSheetUrl,
            savedToken,
            savedTab,
            accumulatedUsers,
            { silent: true, triggerDriveScan: false }
          );
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Conexión en tiempo real multi-terminal vía Server-Sent Events (SSE)
  // Cualquier terminal que agregue o edite un usuario o documento propaga el cambio inmediatamente a las demás
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let isCancelled = false;

    const connectSSE = () => {
      if (isCancelled) return;
      try {
        es = new EventSource('/api/repo/events');
        es.onopen = () => {
          setIsRealtimeActive(true);
        };
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.state) {
              applySharedState(data.state);
              setIsRealtimeActive(true);
            }
          } catch {
            // ignore parse error
          }
        };
        es.onerror = () => {
          setIsRealtimeActive(false);
          es?.close();
          if (!isCancelled) {
            reconnectTimer = window.setTimeout(connectSSE, 4000);
          }
        };
      } catch {
        setIsRealtimeActive(false);
      }
    };

    connectSSE();

    return () => {
      isCancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [applySharedState]);

  // 3. Sincronización entre pestañas en el mismo navegador mediante BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('ekiraya_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.state) {
          applySharedState(event.data.state);
        }
      };
    } catch {
      // BroadcastChannel opcional en entornos sin soporte
    }
    return () => {
      channel?.close();
    };
  }, [applySharedState]);

  // 4. Sincronización periódica en tiempo real con Google Sheets (cada 20s) y al enfocar la pestaña
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        fetch('/api/repo/state')
          .then((r) => (r.ok ? r.json() : null))
          .then((st) => {
            if (st) applySharedState(st);
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Polling de verificación continua cada 10 segundos para más de 50 terminales simultáneas
    const intervalId = window.setInterval(() => {
      if (!document.hidden && !isSyncing) {
        fetch('/api/repo/state')
          .then((r) => (r.ok ? r.json() : null))
          .then((st) => {
            if (st) applySharedState(st);
          })
          .catch(() => {});
      }
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [
    appsScriptExecUrl,
    connectionUrl,
    accessToken,
    repoTabName,
    authorizedUsers,
    executeSyncWithSheets,
    applySharedState,
    isSyncing,
  ]);

  // Monografías sincronizadas desde Google Sheets
  const syncedMonographs = useMemo(() => {
    if (rawRows.length === 0) return [];
    return mapSheetRowsToMonographs(rawRows, columnMapping, rawHeaders);
  }, [rawRows, columnMapping, rawHeaders]);

  // Si aún no hay monografías en la hoja o si el usuario activó "Ver 3 Monografías de Muestra", carga siempre las 3 de muestra
  const isShowingSamples = forceShowSamples || syncedMonographs.length === 0;

  const monographs: MonographDocument[] = useMemo(() => {
    if (forceShowSamples || syncedMonographs.length === 0) {
      return SAMPLE_THREE_MONOGRAPHS;
    }
    return syncedMonographs;
  }, [forceShowSamples, syncedMonographs]);

  // Validación de acceso por dominio institucional (@cem.edu.co / @est.cem.edu.co) y administradores
  const handleLoginWithUsersSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setLoginError('Por favor ingresa tu correo institucional (@cem.edu.co o @est.cem.edu.co).');
      return;
    }

    const isInstitutional =
      cleanEmail.endsWith('@cem.edu.co') ||
      cleanEmail.endsWith('@est.cem.edu.co') ||
      cleanEmail.endsWith('@ekiraya.edu.co');

    if (!isInstitutional) {
      setLoginError(
        'Acceso restringido: Solo se permite ingresar con correos institucionales autorizados (@cem.edu.co o @est.cem.edu.co).'
      );
      return;
    }

    // Buscar en la lista de usuarios autorizados
    let foundUser = authorizedUsers.find(
      (u) =>
        u.correo.toLowerCase() === cleanEmail ||
        (cleanEmail.endsWith('@est.cem.edu.co') &&
          u.correo.toLowerCase() === cleanEmail.replace('@est.cem.edu.co', '@cem.edu.co')) ||
        (cleanEmail.endsWith('@cem.edu.co') &&
          u.correo.toLowerCase() === cleanEmail.replace('@cem.edu.co', '@est.cem.edu.co'))
    );

    if (!foundUser) {
      // Acceso directo por dominio institucional
      const isStudentDomain = cleanEmail.endsWith('@est.cem.edu.co');
      const isAdminEmail = cleanEmail === 'mebolanos@cem.edu.co';
      const usernamePart = cleanEmail.split('@')[0];
      const formattedName = usernamePart
        .split(/[._-]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join(' ');

      const inferredPerfil = isAdminEmail
        ? 'Administrador'
        : isStudentDomain
          ? 'Estudiante'
          : 'Docente';

      foundUser = {
        curso: isStudentDomain ? '11°' : 'Docente',
        seccion: isStudentDomain ? 'Bachillerato' : 'Academia',
        nombres: formattedName || cleanEmail,
        correo: cleanEmail,
        perfil: inferredPerfil,
        isAdmin: isAdminEmail || /admin/i.test(inferredPerfil),
        createdInApp: true,
        syncedToSheet: false,
      };

      setAuthorizedUsers((prev) => [
        ...prev.filter((u) => u.correo.toLowerCase() !== cleanEmail),
        foundUser!,
      ]);
    }

    setLoginError(null);
    setCurrentUser(foundUser);
    setLoginEmailInput('');
    try {
      localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(foundUser));
    } catch {
      // Ignore storage errors
    }
    showToast(`Bienvenido(a), ${foundUser.nombres} (${foundUser.perfil})`);
  };

  const handleLogoutUser = () => {
    setCurrentUser(null);
    setShowAdminPanel(false);
    setPreviewDoc(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('Sesión cerrada correctamente');
  };

  const handleCiteMonograph = (doc: MonographDocument) => {
    const nameParts = doc.author.trim().split(/\s+/);
    const firstName =
      nameParts.length > 1
        ? nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
        : doc.author;
    const lastName =
      nameParts.length > 1
        ? nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')
        : '';

    const presetForm: Partial<CitationFormData> = {
      sourceType: 'thesis',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      thesisSubtype: 'online_archive',
      thesisLevel: `Monografía de grado (${doc.academicUnit} - ${doc.subject})`,
      authors: [
        {
          firstName,
          lastName: lastName || firstName,
        },
      ],
      title: doc.title,
      year: doc.academicYear.match(/\d{4}/)?.[0] || doc.academicYear || '2026',
      publisher: 'Colegio Ekirayá Educación Montessori',
      url: doc.driveUrl || DRIVE_ROOT_FOLDER_URL,
    };
    onCiteMonographInGestor(presetForm, doc.title);
  };

  const handleUpdateColumnMapping = (field: keyof ColumnMapping, colName: string) => {
    const updated = { ...columnMapping, [field]: colName };
    setColumnMapping(updated);
    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate,
      rawHeaders,
      rawRows,
      columnMapping: updated,
      authorizedUsers,
      usuariosHeaders,
    });
  };

  /**
   * Crea un usuario en Cita Master usando exactamente las columnas de la hoja "usuarios"
   * y lo envía a Google Sheets tanto desde el navegador (JSONP / GET) como desde el servidor (/api/repo/users)
   */
  const handleAddAuthorizedUserAndSyncToSheet = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawRow: Record<string, string> = {};
    usuariosHeaders.forEach((h) => {
      rawRow[h] = (newUserFieldValues[h] || '').trim();
    });

    const findValByPattern = (patterns: RegExp[], fallback = ''): string => {
      for (const p of patterns) {
        const col = usuariosHeaders.find((h) => p.test(normalizeHeaderKey(h)));
        if (col && rawRow[col]) return rawRow[col];
      }
      return fallback;
    };

    let cleanMail = findValByPattern(
      [/correo/, /email/, /e mail/, /mail/, /cuenta/],
      ''
    ).toLowerCase();
    if (!cleanMail) {
      const anyEmailVal = Object.values(rawRow).find((v) => v.includes('@'));
      if (anyEmailVal) cleanMail = anyEmailVal.trim().toLowerCase();
    }

    let cleanName = findValByPattern(
      [/nombre/, /apellido/, /estudiante/, /usuario/],
      ''
    );
    if (!cleanName) {
      const firstNonEmpty = Object.values(rawRow).find((v) => v && !v.includes('@'));
      if (firstNonEmpty) cleanName = firstNonEmpty.trim();
    }

    if (!cleanMail || !cleanMail.includes('@') || !cleanName) {
      showToast('Completa al menos el Nombre y el Correo institucional (@) en las columnas.');
      return;
    }

    const cleanCourse = findValByPattern([/curso/, /grado/, /nivel/], 'General');
    const cleanSection = findValByPattern([/seccion/, /dependencia/, /area/], 'General');
    const rawPerfilVal = findValByPattern(
      [/perfil/, /rol/, /cargo/, /tipo/, /estamento/],
      ''
    );

    const isAdmin =
      newUserIsAdminFlag ||
      cleanMail === 'mebolanos@cem.edu.co' ||
      /admin/i.test(rawPerfilVal) ||
      /admin/i.test(cleanCourse) ||
      /admin/i.test(cleanSection);

    const effectivePerfil =
      rawPerfilVal ||
      (isAdmin
        ? 'Administrador'
        : /docente|profesor/i.test(cleanCourse) || /docente|profesor/i.test(cleanSection)
          ? 'Docente'
          : /no clases|apoyo|planta/i.test(cleanSection)
            ? 'Personal no clases'
            : 'Estudiante');

    usuariosHeaders.forEach((h) => {
      const norm = normalizeHeaderKey(h);
      if (/correo|email|e mail|mail|cuenta/.test(norm)) {
        rawRow[h] = cleanMail;
      } else if (/perfil|rol|cargo|tipo|estamento/.test(norm) && !rawRow[h]) {
        rawRow[h] = effectivePerfil;
      }
    });

    const newUser: AuthorizedSchoolUser = {
      curso: cleanCourse,
      seccion: cleanSection,
      nombres: cleanName,
      correo: cleanMail,
      perfil: effectivePerfil,
      isAdmin,
      createdInApp: true,
      syncedToSheet: false,
      rawRow,
    };

    const updatedLocalUsers = [
      ...authorizedUsers.filter((u) => u.correo.toLowerCase() !== cleanMail),
      newUser,
    ];
    setAuthorizedUsers(updatedLocalUsers);

    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      rawHeaders,
      rawRows,
      columnMapping,
      authorizedUsers: updatedLocalUsers,
      usuariosHeaders,
    });

    setNewUserFieldValues({});
    setNewUserIsAdminFlag(false);
    setIsSavingUser(true);

    try {
      let browserPushed = false;
      const effectiveExec = (
        appsScriptExecUrl ||
        (connectionUrl.includes('script.google.com') ? connectionUrl : '')
      ).trim();

      // 1. Enviar desde el navegador vía JSONP y respaldo GET no-cors
      if (effectiveExec && effectiveExec.includes('script.google.com')) {
        const jsonpRes = await callAppsScriptViaBrowserJsonp(effectiveExec, {
          action: 'addUser',
          token: accessToken || 'EKIRAYA-2026',
          curso: newUser.curso,
          seccion: newUser.seccion,
          nombres: newUser.nombres,
          correo: newUser.correo,
          perfil: newUser.perfil,
          rowJson: JSON.stringify(rawRow),
        });

        if (jsonpRes && (jsonpRes.success || Array.isArray(jsonpRes.usersRows))) {
          browserPushed = true;
        } else {
          try {
            const sep = effectiveExec.includes('?') ? '&' : '?';
            const qs = new URLSearchParams({
              action: 'addUser',
              token: accessToken || 'EKIRAYA-2026',
              curso: newUser.curso,
              seccion: newUser.seccion,
              nombres: newUser.nombres,
              correo: newUser.correo,
              perfil: newUser.perfil,
              rowJson: JSON.stringify(rawRow),
              _t: String(Date.now()),
            });
            await fetch(`${effectiveExec}${sep}${qs.toString()}`, {
              method: 'GET',
              mode: 'no-cors',
              cache: 'no-store',
            });
            browserPushed = true;
          } catch {
            // ignore
          }
        }
      }

      // 2. Enviar al servidor (/api/repo/users)
      const resp = await fetch('/api/repo/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { ...newUser, syncedToSheet: browserPushed },
          usuariosHeaders,
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.state?.authorizedUsers) {
          const merged = mergeUsersLists(data.state.authorizedUsers, updatedLocalUsers);
          if (browserPushed) {
            const idx = merged.findIndex((u) => u.correo.toLowerCase() === cleanMail);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], syncedToSheet: true, rawRow };
            }
          }
          setAuthorizedUsers(merged);
          saveLocalRepoConfig({
            appsScriptExecUrl,
            connectionUrl,
            repoTabName,
            accessToken,
            lastSyncDate: data.state.lastSyncDate || new Date().toLocaleString('es-CO'),
            rawHeaders,
            rawRows,
            columnMapping,
            authorizedUsers: merged,
            usuariosHeaders,
          });
        }

        if (data.pushedToSheet || browserPushed) {
          showToast(
            `¡Usuario "${newUser.nombres}" creado y sincronizado en la hoja "usuarios" de Google Sheets!`
          );
        } else {
          showToast(
            `Usuario "${newUser.nombres}" activo en Cita Master. Conecta la URL Web App (/exec) de Apps Script en el Campo A o usa "Copiar fila para Sheets".`
          );
        }

        // Sincronización de metadatos con Sheets al crear usuario
        executeSyncWithSheets(
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
          repoTabName,
          updatedLocalUsers,
          { triggerDriveScan: false, silent: true }
        );
      }
    } catch {
      showToast(`Usuario "${newUser.nombres}" guardado y habilitado en Cita Master.`);
    } finally {
      setIsSavingUser(false);
    }
  };

  /**
   * Registro y creación de usuario desde la app (desde el login o modal):
   * Guarda el usuario en la hoja "usuarios", lo habilita en la sesión,
   * y desencadena la sincronización bidireccional de la hoja "repositorio" y Google Drive.
   */
  const handleRegisterAndLoginNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = registerEmail.trim().toLowerCase();
    const cleanName = registerName.trim();

    if (!cleanMail || !cleanName) {
      showToast('Por favor diligencia el nombre completo y correo institucional.');
      return;
    }

    setIsRegisteringUser(true);

    const isAdmin = /admin|rector|directivo|coordinad/i.test(registerPerfil);
    const rawRow: Record<string, string> = {
      Nombres: cleanName,
      Curso: registerCurso.trim() || '11°',
      Correo: cleanMail,
      Sección: registerSeccion.trim() || 'Bachillerato',
      Perfil: registerPerfil.trim() || 'Estudiante',
    };

    const newUser: AuthorizedSchoolUser = {
      curso: registerCurso.trim() || '11°',
      seccion: registerSeccion.trim() || 'Bachillerato',
      nombres: cleanName,
      correo: cleanMail,
      perfil: registerPerfil.trim() || 'Estudiante',
      isAdmin,
      createdInApp: true,
      syncedToSheet: false,
      rawRow,
    };

    const updatedUsers = [
      ...authorizedUsers.filter((u) => u.correo.toLowerCase() !== cleanMail),
      newUser,
    ];
    setAuthorizedUsers(updatedUsers);
    setCurrentUser(newUser);
    setShowCreateUserModal(false);
    setLoginError(null);

    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      rawHeaders,
      rawRows,
      columnMapping,
      authorizedUsers: updatedUsers,
      usuariosHeaders,
    });

    showToast(`¡Usuario "${cleanName}" creado! Sincronizando repositorio en ambas direcciones...`);

    try {
      // 1. Enviar al backend /api/repo/users
      await fetch('/api/repo/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: newUser,
          usuariosHeaders,
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
        }),
      });

      // 2. Sincronización con Google Sheets
      await executeSyncWithSheets(
        appsScriptExecUrl,
        connectionUrl,
        accessToken,
        repoTabName,
        updatedUsers,
        { triggerDriveScan: false }
      );
    } catch {
      // ignore
    } finally {
      setIsRegisteringUser(false);
    }
  };

  /**
   * Inicia la edición de un usuario seleccionado en el panel
   */
  const handleStartEditUser = (user: AuthorizedSchoolUser) => {
    setEditingUser(user);
    const initialValues: Record<string, string> = {
      Nombres: user.nombres,
      Curso: user.curso,
      Correo: user.correo,
      Sección: user.seccion,
      Perfil: user.perfil,
      ...(user.rawRow || {}),
    };
    usuariosHeaders.forEach((h) => {
      if (!initialValues[h]) {
        initialValues[h] = getUserCellValue(user, h);
      }
    });
    setEditUserFields(initialValues);
    setEditUserIsAdmin(user.isAdmin);
  };

  /**
   * Guarda los cambios de un usuario editado y los sincroniza con Google Sheets y el backend
   */
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const originalEmail = editingUser.correo.trim().toLowerCase();
    const cleanEmail = (
      editUserFields['Correo'] ||
      editUserFields['correo'] ||
      editUserFields['Correo institucional'] ||
      editingUser.correo
    )
      .trim()
      .toLowerCase();

    const cleanName = (
      editUserFields['Nombres'] ||
      editUserFields['nombres'] ||
      editUserFields['Nombre completo'] ||
      editingUser.nombres
    ).trim();

    if (!cleanEmail || !cleanName) {
      showToast('El nombre y el correo institucional son obligatorios.');
      return;
    }

    setIsUpdatingUser(true);

    const cleanProfile = (
      editUserFields['Perfil'] ||
      editUserFields['perfil'] ||
      editingUser.perfil
    ).trim() || 'Estudiante';

    const isAdmin =
      editUserIsAdmin ||
      cleanEmail === 'mebolanos@cem.edu.co' ||
      /admin|administrador|coordinador|directivo/i.test(cleanProfile);

    const cleanCurso = (
      editUserFields['Curso'] ||
      editUserFields['curso'] ||
      editingUser.curso
    ).trim() || '11°';

    const cleanSeccion = (
      editUserFields['Sección'] ||
      editUserFields['seccion'] ||
      editingUser.seccion
    ).trim() || 'Bachillerato';

    const builtRawRow: Record<string, string> = {
      ...(editingUser.rawRow || {}),
      ...editUserFields,
      Nombres: cleanName,
      Correo: cleanEmail,
      Curso: cleanCurso,
      Sección: cleanSeccion,
      Perfil: cleanProfile,
    };

    const updatedUser: AuthorizedSchoolUser = {
      nombres: cleanName,
      correo: cleanEmail,
      curso: cleanCurso,
      seccion: cleanSeccion,
      perfil: cleanProfile,
      isAdmin,
      createdInApp: editingUser.createdInApp ?? false,
      syncedToSheet: false,
      rawRow: builtRawRow,
    };

    // Actualiza en el estado local
    const updatedUsers = authorizedUsers
      .filter((u) => u.correo.toLowerCase() !== originalEmail && u.correo.toLowerCase() !== cleanEmail)
      .concat(updatedUser);

    setAuthorizedUsers(updatedUsers);

    // Si el usuario actual es el editado, actualizar sesión activa
    if (currentUser?.correo.toLowerCase() === originalEmail) {
      setCurrentUser(updatedUser);
    }

    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      rawHeaders,
      rawRows,
      columnMapping,
      authorizedUsers: updatedUsers,
      usuariosHeaders,
    });

    try {
      let browserPushed = false;
      const effectiveExec = (
        appsScriptExecUrl ||
        (connectionUrl.includes('script.google.com') ? connectionUrl : '')
      ).trim();

      // 1. Sincronizar vía JSONP con Apps Script directamente desde el navegador hacia Google Sheets
      if (effectiveExec && effectiveExec.includes('script.google.com')) {
        const jsonpRes = await callAppsScriptViaBrowserJsonp(effectiveExec, {
          action: 'updateUser',
          subAction: 'update',
          manageAction: 'update',
          spreadsheetId: '1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs',
          connectionUrl: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
          sheetUrl: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
          token: accessToken || 'EKIRAYA-2026',
          originalCorreo: originalEmail,
          originalEmail: originalEmail,
          curso: updatedUser.curso,
          seccion: updatedUser.seccion,
          nombres: updatedUser.nombres,
          nombre: updatedUser.nombres,
          correo: updatedUser.correo,
          email: updatedUser.correo,
          perfil: updatedUser.perfil,
          rol: updatedUser.perfil,
          rawRowJson: JSON.stringify(builtRawRow),
          rowJson: JSON.stringify(builtRawRow),
          _t: String(Date.now()),
        });
        if (
          jsonpRes &&
          (jsonpRes.success ||
            Array.isArray(jsonpRes.usuariosRows) ||
            Array.isArray(jsonpRes.usersRows))
        ) {
          browserPushed = true;
          const uRows = jsonpRes.usuariosRows || jsonpRes.usersRows;
          const rawUHeaders = jsonpRes.usuariosHeaders || jsonpRes.usersHeaders;
          const uHeaders: string[] = Array.isArray(rawUHeaders)
            ? rawUHeaders.map(String)
            : usuariosHeaders;
          if (Array.isArray(uRows) && uRows.length > 0) {
            const sheetUsers = parseUsersSheetRows(uRows, uHeaders);
            const freshUsers = mergeUsersLists(sheetUsers, updatedUsers);
            setAuthorizedUsers(freshUsers);
          }
        }
      }

      // 2. Enviar actualización al backend Express (que también sincroniza con Apps Script en Google Sheets y propaga a todas las terminales)
      const resp = await fetch('/api/repo/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { ...updatedUser, syncedToSheet: browserPushed },
          originalEmail,
          usuariosHeaders,
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.state?.authorizedUsers) {
          const merged = mergeUsersLists(data.state.authorizedUsers, updatedUsers);
          setAuthorizedUsers(merged);
        }
        showToast(
          data?.pushedToSheet || browserPushed
            ? `¡Usuario "${updatedUser.nombres}" editado y sincronizado en Google Sheets!`
            : `Usuario "${updatedUser.nombres}" editado correctamente en la base de datos.`
        );
      } else {
        showToast(`Usuario "${updatedUser.nombres}" actualizado.`);
      }

      // Sincronización en segundo plano con el servidor
      executeSyncWithSheets(
        appsScriptExecUrl,
        connectionUrl,
        accessToken,
        repoTabName,
        updatedUsers,
        { triggerDriveScan: false, silent: true }
      );
    } catch {
      showToast(`Usuario "${updatedUser.nombres}" guardado localmente.`);
    } finally {
      setIsUpdatingUser(false);
      setEditingUser(null);
    }
  };

  /**
   * Abre modal de confirmación para eliminar un usuario
   */
  const handleStartDeleteUser = (user: AuthorizedSchoolUser) => {
    setDeletingUser(user);
  };

  /**
   * Confirma la eliminación del usuario, borrándolo de la app y sincronizando con Google Sheets
   */
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;

    const emailToDelete = deletingUser.correo.trim().toLowerCase();
    const nameToDelete = deletingUser.nombres;
    setIsDeletingUser(true);

    const updatedUsers = authorizedUsers.filter(
      (u) => u.correo.toLowerCase() !== emailToDelete
    );
    setAuthorizedUsers(updatedUsers);

    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      rawHeaders,
      rawRows,
      columnMapping,
      authorizedUsers: updatedUsers,
      usuariosHeaders,
    });

    try {
      const effectiveExec = (
        appsScriptExecUrl ||
        (connectionUrl.includes('script.google.com') ? connectionUrl : '')
      ).trim();

      // 1. Eliminar en Apps Script / Google Sheets vía JSONP
      if (effectiveExec && effectiveExec.includes('script.google.com')) {
        await callAppsScriptViaBrowserJsonp(effectiveExec, {
          action: 'deleteUser',
          subAction: 'delete',
          spreadsheetId: '1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs',
          connectionUrl: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
          sheetUrl: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
          token: accessToken || 'EKIRAYA-2026',
          correo: emailToDelete,
          email: emailToDelete,
        });
      }

      // 2. Enviar DELETE al backend
      await fetch('/api/repo/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToDelete,
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
        }),
      });

      showToast(`¡Usuario "${nameToDelete}" eliminado y sincronizado en Google Sheets!`);

      // Si el usuario eliminado era el que tenía la sesión iniciada, cerrar sesión
      if (currentUser?.correo.toLowerCase() === emailToDelete) {
        handleLogoutUser();
      }

      // Sincronización en segundo plano con Sheets
      executeSyncWithSheets(
        appsScriptExecUrl,
        connectionUrl,
        accessToken,
        repoTabName,
        updatedUsers,
        { triggerDriveScan: false, silent: true }
      );
    } catch {
      showToast(`Usuario "${nameToDelete}" eliminado de la base local.`);
    } finally {
      setIsDeletingUser(false);
      setDeletingUser(null);
    }
  };

  /**
   * Permite importar un CSV o pegar directamente celdas de Google Sheets (tanto de "usuarios" como de "Repositorio")
   */
  const handleProcessQuickPasteOrCsv = (rawText: string) => {
    const parsed = parseCsvToRows(rawText);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      showToast('No se detectaron filas válidas. Verifica el texto o archivo CSV.');
      return;
    }

    if (isUsersSheetData(parsed.headers, parsed.rows)) {
      const importedUsers = parseUsersSheetRows(parsed.rows, parsed.headers);
      const merged = mergeUsersLists(importedUsers, authorizedUsers);
      setUsuariosHeaders(parsed.headers);
      setEditingColumnsText(parsed.headers.join(', '));
      setAuthorizedUsers(merged);
      const nowStr = new Date().toLocaleString('es-CO');
      setLastSyncDate(nowStr);
      saveLocalRepoConfig({
        appsScriptExecUrl,
        connectionUrl,
        repoTabName,
        accessToken,
        lastSyncDate: nowStr,
        rawHeaders,
        rawRows,
        columnMapping,
        authorizedUsers: merged,
        usuariosHeaders: parsed.headers,
      });
      // Sincronizar cada usuario importado y las columnas exactas con el servidor
      for (const u of importedUsers) {
        fetch('/api/repo/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: u,
            usuariosHeaders: parsed.headers,
            appsScriptExecUrl,
            connectionUrl,
            accessToken,
          }),
        }).catch(() => {});
      }
      setShowQuickPasteModal(false);
      setQuickPasteText('');
      showToast(
        `¡${importedUsers.length} usuarios sincronizados con la tabla exacta de Sheets (${parsed.headers.join(' · ')})!`
      );
    } else {
      const detected = autoDetectColumnMapping(parsed.headers);
      setRawHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setColumnMapping(detected);
      setForceShowSamples(false);
      const nowStr = new Date().toLocaleString('es-CO');
      setLastSyncDate(nowStr);
      saveLocalRepoConfig({
        appsScriptExecUrl,
        connectionUrl,
        repoTabName,
        accessToken,
        lastSyncDate: nowStr,
        rawHeaders: parsed.headers,
        rawRows: parsed.rows,
        columnMapping: detected,
        authorizedUsers,
        usuariosHeaders,
      });

      // Guardar y sincronizar con el servidor para todas las terminales
      fetch('/api/repo/import-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: parsed.headers,
          rows: parsed.rows,
        }),
      }).catch(() => {});

      setShowQuickPasteModal(false);
      setQuickPasteText('');
      showToast(`¡${parsed.rows.length} monografías importadas al repositorio y sincronizadas en tiempo real!`);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      handleProcessQuickPasteOrCsv(text);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleCopyAppsScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = APPS_SCRIPT_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedScript(true);
    showToast('Código Google Apps Script copiado al portapapeles');
    setTimeout(() => setCopiedScript(false), 2200);
  };

  const handleApplyUsuariosHeaders = (nextCols: string[]) => {
    const cleanCols = nextCols.map((c) => c.trim()).filter(Boolean);
    if (cleanCols.length === 0) return;
    setUsuariosHeaders(cleanCols);
    setEditingColumnsText(cleanCols.join(', '));
    setShowEditColumns(false);
    saveLocalRepoConfig({
      appsScriptExecUrl,
      connectionUrl,
      repoTabName,
      accessToken,
      lastSyncDate,
      rawHeaders,
      rawRows,
      columnMapping,
      authorizedUsers,
      usuariosHeaders: cleanCols,
    });
    showToast(`Columnas de la hoja "usuarios" actualizadas: ${cleanCols.join(' · ')}`);
  };

  const handleCopyUsersTableForSheets = async () => {
    const headerLine = usuariosHeaders.join('\t');
    const rowLines = authorizedUsers.map((u) =>
      usuariosHeaders.map((h) => getUserCellValue(u, h).replace(/\t|\r|\n/g, ' ')).join('\t')
    );
    const tsv = [headerLine, ...rowLines].join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast(
      'Tabla copiada en formato Google Sheets (TSV). Puedes pegarla directamente con Ctrl+V en tu hoja "usuarios".'
    );
  };

  const handleDownloadUsersCsv = () => {
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headerLine = usuariosHeaders.map(escapeCsv).join(',');
    const rowLines = authorizedUsers.map((u) =>
      usuariosHeaders.map((h) => escapeCsv(getUserCellValue(u, h))).join(',')
    );
    const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'usuarios_colegio_ekiraya.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Archivo CSV con ${authorizedUsers.length} usuarios descargado correctamente.`);
  };

  const handleInitializeUsersSheetInGoogleSheets = async () => {
    setIsInitializingUsersSheet(true);
    try {
      let browserPushed = false;
      const effectiveExec = (
        appsScriptExecUrl ||
        (connectionUrl.includes('script.google.com') ? connectionUrl : '')
      ).trim();

      if (effectiveExec && effectiveExec.includes('script.google.com')) {
        const resJsonp = await callAppsScriptViaBrowserJsonp(effectiveExec, {
          action: 'initUsersSheet',
          token: accessToken || 'EKIRAYA-2026',
        });
        if (resJsonp && (resJsonp.success || Array.isArray(resJsonp.usersRows))) {
          browserPushed = true;
        }
      }

      const resp = await fetch('/api/repo/init-users-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appsScriptExecUrl,
          connectionUrl,
          accessToken,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.state?.authorizedUsers) {
          setAuthorizedUsers(data.state.authorizedUsers);
        }
        if (data?.pushedToSheet || browserPushed) {
          showToast(
            `¡Hoja "usuarios" creada y poblada en Google Sheets con los ${authorizedUsers.length} integrantes del colegio!`
          );
        } else {
          showToast(
            `Hoja "usuarios" lista con ${authorizedUsers.length} usuarios. Conecta la URL /exec o usa "Copiar tabla para Sheets" / "Descargar CSV".`
          );
        }
      }
    } catch {
      showToast(`Hoja "usuarios" verificada con ${authorizedUsers.length} usuarios.`);
    } finally {
      setIsInitializingUsersSheet(false);
    }
  };

  // Lista filtrada de usuarios para el panel de administración y búsqueda
  const displayedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return authorizedUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return authorizedUsers.filter((u) => {
      const allVals = Object.values(u.rawRow || {}).join(' ').toLowerCase();
      return (
        u.nombres.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.curso.toLowerCase().includes(q) ||
        u.seccion.toLowerCase().includes(q) ||
        u.perfil.toLowerCase().includes(q) ||
        allVals.includes(q)
      );
    });
  }, [authorizedUsers, userSearchQuery]);

  // Listas dinámicas reorganizadas según la nueva BD (Ärea, Linea de investigación, asignatura, Asesor(es), autor, año)
  const academicUnits = useMemo(() => {
    const set = new Set<string>();
    monographs.forEach((m) => {
      if (m.areaList && m.areaList.length > 0) {
        m.areaList.forEach((a) => {
          if (a.trim()) set.add(a.trim());
        });
      } else if (m.academicUnit?.trim()) {
        set.add(m.academicUnit.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [monographs]);

  const researchLines = useMemo(() => {
    const set = new Set<string>();
    monographs
      .filter(
        (m) =>
          selectedAcademicUnit === 'all' ||
          m.areaList?.includes(selectedAcademicUnit) ||
          m.academicUnit === selectedAcademicUnit
      )
      .forEach((m) => {
        if (m.researchLineList && m.researchLineList.length > 0) {
          m.researchLineList.forEach((rl) => {
            if (rl.trim()) set.add(rl.trim());
          });
        } else if (m.researchLine?.trim()) {
          set.add(m.researchLine.trim());
        }
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [monographs, selectedAcademicUnit]);

  const docTypesList = useMemo(
    () =>
      Array.from(
        new Set(
          monographs
            .map((m) => m.docType)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [monographs]
  );

  const advisorsList = useMemo(() => {
    const set = new Set<string>();
    monographs.forEach((m) => {
      (m.advisors || []).forEach((adv) => {
        if (adv.trim()) set.add(adv.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [monographs]);

  const academicYears = useMemo(
    () =>
      Array.from(new Set(monographs.map((m) => m.academicYear).filter(Boolean))).sort((a, b) =>
        b.localeCompare(a, 'es')
      ),
    [monographs]
  );

  const authors = useMemo(
    () =>
      Array.from(new Set(monographs.map((m) => m.author).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [monographs]
  );

  // 3 Ejemplos destacados representativos de distintas unidades académicas verificadas en la hoja "repositorio"
  const featuredThreeMonographs = useMemo(() => {
    const targetIds = ['2262', '2530', '2945'];
    const found = targetIds
      .map((id) => monographs.find((m) => m.documentoId === id))
      .filter(Boolean) as MonographDocument[];
    if (found.length === 3) return found;
    return monographs.slice(0, 3);
  }, [monographs]);

  // Búsqueda e indexación multicriterio con todas las 17 columnas de la hoja "repositorio"
  const filteredMonographs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return monographs
      .filter((m) => {
        if (
          selectedAcademicUnit !== 'all' &&
          !m.areaList?.includes(selectedAcademicUnit) &&
          m.academicUnit !== selectedAcademicUnit
        ) {
          return false;
        }
        if (
          selectedResearchLine !== 'all' &&
          !m.researchLineList?.includes(selectedResearchLine) &&
          m.researchLine !== selectedResearchLine
        ) {
          return false;
        }
        if (selectedAdvisor !== 'all' && !(m.advisors || []).includes(selectedAdvisor))
          return false;
        if (selectedAcademicYear !== 'all' && m.academicYear !== selectedAcademicYear)
          return false;
        if (selectedAuthor !== 'all' && m.author !== selectedAuthor) return false;
        if (selectedDocType !== 'all' && m.docType !== selectedDocType) return false;
        if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;

        if (!q) return true;

        const searchableFields = [
          m.documentoId,
          m.documentCode,
          m.fileName,
          m.title,
          m.author,
          m.grade,
          m.academicYear,
          m.docType,
          m.keywordsRaw,
          m.abstractText,
          m.advisorsRaw,
          m.academicUnit,
          m.researchLine,
          m.status,
          m.visibility,
        ]
          .join(' ')
          .toLowerCase();

        return searchableFields.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'id') {
          const numA = parseInt(a.documentoId, 10);
          const numB = parseInt(b.documentoId, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.documentoId.localeCompare(b.documentoId, 'es');
        }
        if (sortBy === 'author') return a.author.localeCompare(b.author, 'es');
        if (sortBy === 'unit') return a.academicUnit.localeCompare(b.academicUnit, 'es');
        if (sortBy === 'year') return b.academicYear.localeCompare(a.academicYear, 'es');
        return a.title.localeCompare(b.title, 'es');
      });
  }, [
    monographs,
    searchQuery,
    selectedAcademicUnit,
    selectedResearchLine,
    selectedAdvisor,
    selectedAcademicYear,
    selectedAuthor,
    selectedDocType,
    selectedStatus,
    sortBy,
  ]);

  // Vista Previa de 3 Monografías por página
  const ITEMS_PER_VIEW = 3;
  const isDefaultView =
    previewMode === 'featured3' &&
    !searchQuery &&
    selectedAcademicUnit === 'all' &&
    selectedResearchLine === 'all' &&
    selectedAdvisor === 'all' &&
    selectedAuthor === 'all' &&
    selectedAcademicYear === 'all' &&
    selectedDocType === 'all';

  const activeMonographList = isDefaultView ? featuredThreeMonographs : filteredMonographs;

  const totalPages = Math.max(1, Math.ceil(activeMonographList.length / ITEMS_PER_VIEW));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const threePreviewMonographs = activeMonographList.slice(
    safePageIndex * ITEMS_PER_VIEW,
    safePageIndex * ITEMS_PER_VIEW + ITEMS_PER_VIEW
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAcademicUnit('all');
    setSelectedResearchLine('all');
    setSelectedAdvisor('all');
    setSelectedAuthor('all');
    setSelectedAcademicYear('all');
    setSelectedDocType('all');
    setSelectedStatus('all');
    setSortBy('id');
    setPreviewMode('featured3');
    setPageIndex(0);
  };

  const renderSyncConfigModal = () => {
    if (!showSyncConfigModal) return null;

    const hasConfig = Boolean(appsScriptExecUrl || connectionUrl);

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-900 text-white flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Dirección de la Implementación de Google Sheets
                </h3>
                <p className="text-[11px] text-slate-500">
                  Guardada en el servidor central · Sincronización en vivo cada 10s para todas las terminales (50+ equipos)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSyncConfigModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                hasConfig
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              {hasConfig ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-xs">
                  {hasConfig
                    ? 'Conexión Central Activa en el Servidor'
                    : 'Configura la dirección para conectar todas las terminales'}
                </div>
                <p className="leading-relaxed text-[11px]">
                  {hasConfig
                    ? 'La dirección se encuentra guardada en el servidor central. Todos los equipos (estudiantes, docentes, salas de cómputo) consultan automáticamente esta misma fuente en vivo cada 10 segundos.'
                    : 'Pega la URL de tu implementación de Google Apps Script o el enlace directo de tu Google Sheets. Se guardará en el servidor y estará activa de inmediato para cualquier computador o IP que ingrese.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-violet-950 mb-1">
                A. URL de la Aplicación Web de Google Apps Script (/exec) — Escritura en Sheets y escaneo Drive
              </label>
              <input
                type="url"
                value={appsScriptExecUrl}
                onChange={(e) => setAppsScriptExecUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-xl border border-violet-300 bg-violet-50/40 py-2.5 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                En Google Sheets: Extensiones → Apps Script → Implementar → Nueva implementación → Tipo: Aplicación web (Acceso: Cualquier persona).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                B. Enlace directo del archivo de Google Sheets (docs.google.com/spreadsheets/d/...)
              </label>
              <input
                type="url"
                value={connectionUrl}
                onChange={(e) => setConnectionUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pestaña de Monografías
                </label>
                <input
                  type="text"
                  value={repoTabName}
                  onChange={(e) => setRepoTabName(e.target.value)}
                  placeholder="repositorio (u Hoja 1)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Token Institucional
                </label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EKIRAYA-2026"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowSyncConfigModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleSaveGlobalConfigToServer(true);
                await executeSyncWithSheets(
                  appsScriptExecUrl,
                  connectionUrl,
                  accessToken,
                  repoTabName,
                  authorizedUsers,
                  { isManual: true }
                );
                setShowSyncConfigModal(false);
              }}
              disabled={isSavingConfig || isSyncing}
              className="px-5 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#f8c62e]" />
              <span>
                {isSavingConfig || isSyncing
                  ? 'Guardando en servidor...'
                  : 'Guardar en Servidor para Todos los Equipos y Sincronizar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateUserModal = () => {
    if (!showCreateUserModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-700" />
              <h3 className="text-base font-bold text-slate-900">
                Crear Usuario en el Sistema
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUserModal(false)}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Al crear un usuario desde la app, este se registrará en la hoja <strong>usuarios</strong> y se sincronizará automáticamente para todas las terminales y dispositivos.
          </p>

          <form onSubmit={handleRegisterAndLoginNewUser} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Ej. Sofía Mendoza"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo institucional (@cem.edu.co) *
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="nombre@cem.edu.co"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curso / Grado
                </label>
                <input
                  type="text"
                  value={registerCurso}
                  onChange={(e) => setRegisterCurso(e.target.value)}
                  placeholder="11°"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sección
                </label>
                <input
                  type="text"
                  value={registerSeccion}
                  onChange={(e) => setRegisterSeccion(e.target.value)}
                  placeholder="Bachillerato"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Perfil en el Colegio
              </label>
              <select
                value={registerPerfil}
                onChange={(e) => setRegisterPerfil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-600 focus:outline-none bg-white"
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Docente">Docente</option>
                <option value="Directivo">Directivo</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isRegisteringUser}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegisteringUser ? 'animate-spin' : ''}`} />
                <span>{isRegisteringUser ? 'Guardando y sincronizando...' : 'Crear usuario y sincronizar ahora'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============================================================================
  // ACCESO PÚBLICO INSTITUCIONAL DIRECTO + PANEL DE ADMINISTRADOR DEDICADO
  // ============================================================================
  const isAdmin = Boolean(currentUser?.isAdmin || showAdminPanel);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO PRINCIPAL DEL REPOSITORIO — ACCESO PÚBLICO INSTITUCIONAL */}
      <div className="bg-gradient-to-br from-[#44345c] via-[#664d88] to-[#533e6f] rounded-2xl p-5 sm:p-7 text-white border border-violet-800/40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-[#f8c62e]" />
              <span>Carpeta Drive: Unidades Académicas ({DRIVE_ROOT_FOLDER_ID})</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300 font-bold">Acceso Abierto Institucional</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Repositorio de Monografías — Proyecto de Vida
            </h1>
            <p className="text-violet-100/90 text-xs sm:text-sm leading-relaxed">
              Consulta, búsqueda e indexación por{' '}
              <strong>
                título, autor, grado, año, unidad académica, línea de investigación y resumen
              </strong>
              . Con visualizador de PDF y generación de citas APA 2026.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                showAdminPanel
                  ? 'bg-[#f8c62e] text-slate-950 font-bold shadow-md'
                  : 'bg-white text-violet-950 hover:bg-violet-50'
              }`}
            >
              <Settings className="w-4 h-4 text-violet-700" />
              <span>
                {showAdminPanel
                  ? 'Cerrar Panel Administrador'
                  : '⚙️ Panel de Administración'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              title="Sincronizar ahora con Google Sheets"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Sheets'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowQuickPasteModal(true)}
              title="Pegar celdas copiadas directamente de Google Sheets"
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pegar de Sheets</span>
            </button>
          </div>
        </div>

        {/* BARRA DE ESTADO DE LA HOJA Y TOTAL DE MONOGRAFÍAS */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{rawRows.length} Monografías Disponibles</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100 font-mono text-[11px]">
              ID Hoja: 1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs
            </span>
          </div>

          <div className="flex items-center gap-2 text-violet-200 text-xs">
            <span className="relative flex h-2 w-2">
              {isRealtimeActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRealtimeActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
            </span>
            <span>
              Sincronización en vivo
              {lastSyncDate ? ` · Última: ${lastSyncDate}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN EXCLUSIVA DE ADMINISTRADOR (OCULTA PARA OTROS PERFILES)
         ========================================================================= */}
      {isAdmin && showAdminPanel && (
        <section className="bg-[#FAF5FF] rounded-2xl border-2 border-violet-300 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-900 text-white flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                  Exclusivo Perfil Administrador
                </span>
                <h2 className="text-base sm:text-lg font-bold text-violet-950">
                  Panel Administrativo · Sincronización Bidireccional Drive ↔ Google Sheets ↔ Cita
                  Master
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminPanel(false)}
              className="text-xs font-semibold text-violet-700 hover:underline self-start sm:self-auto"
            >
              Minimizar panel administrativo
            </button>
          </div>

          {/* 1. CONEXIÓN: URL WEB APP APPS SCRIPT (/EXEC) + URL GOOGLE SHEETS */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-700" />
                <span>
                  1. Configuración de Sincronización con Google Apps Script (/exec) y Google Sheets
                </span>
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-violet-700" />
                  <span>Subir CSV de Sheets</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowQuickPasteModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Table2 className="w-3.5 h-3.5 text-violet-700" />
                  <span>Pegar tabla de Sheets</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-violet-950 mb-1">
                  A. URL de la Aplicación Web de Google Apps Script (/exec) — Lectura y sincronización de Google Sheets
                </label>
                <input
                  type="url"
                  value={appsScriptExecUrl}
                  onChange={(e) => setAppsScriptExecUrl(e.target.value)}
                  onBlur={() => handleSaveGlobalConfigToServer(false)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-violet-300 bg-violet-50/40 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  B. Enlace directo de tu archivo de Google Sheets (docs.google.com/spreadsheets/d/...)
                </label>
                <input
                  type="url"
                  value={connectionUrl}
                  onChange={(e) => setConnectionUrl(e.target.value)}
                  onBlur={() => handleSaveGlobalConfigToServer(false)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la pestaña de Monografías en Google Sheets
                </label>
                <input
                  type="text"
                  value={repoTabName}
                  onChange={(e) => setRepoTabName(e.target.value)}
                  onBlur={() => handleSaveGlobalConfigToServer(false)}
                  placeholder="Hoja 1 (o Repositorio)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Token Institucional
                </label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  onBlur={() => handleSaveGlobalConfigToServer(false)}
                  placeholder="EKIRAYA-2026"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            {sheetAccessWarning && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{sheetAccessWarning}</span>
              </div>
            )}

            {!appsScriptExecUrl.includes('script.google.com') && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>¿Cómo activar la sincronización de escritura hacia Google Sheets?</strong>{' '}
                  En tu Google Sheet ve a <strong>Extensiones → Apps Script</strong>, pega el
                  código de abajo, haz clic en{' '}
                  <strong>
                    Implementar → Nueva implementación → Aplicación web (Acceso: Cualquier persona)
                  </strong>{' '}
                  y pega la URL <code>https://script.google.com/macros/s/.../exec</code> en el{' '}
                  <strong>Campo A</strong>.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Sincronización en vivo cada 10s · Multi-terminal activo (50+ dispositivos).
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveGlobalConfigToServer(true)}
                  disabled={isSavingConfig}
                  className="px-3.5 py-2 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  title="Guardar esta URL en el servidor para que todos los computadores e IPs tengan acceso inmediato"
                >
                  <Save className="w-3.5 h-3.5 text-[#f8c62e]" />
                  <span>
                    {isSavingConfig
                      ? 'Guardando...'
                      : 'Guardar URL en Servidor (Para Todos los Equipos)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    executeSyncWithSheets(
                      appsScriptExecUrl,
                      connectionUrl,
                      accessToken,
                      repoTabName,
                      authorizedUsers,
                      { triggerDriveScan: false }
                    )
                  }
                  disabled={isSyncing}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Sheets'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. MAPEO DINÁMICO DE TÍTULOS DE COLUMNA DE MONOGRAFÍAS */}
          {rawHeaders.length > 0 && (
            <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Table2 className="w-4 h-4 text-violet-700" />
                <span>
                  2. Títulos de Columna Leídos en la Hoja de Monografías ({rawHeaders.length}{' '}
                  columnas)
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { key: 'fileNameCol' as const, label: 'Nombre del archivo' },
                  { key: 'titleCol' as const, label: 'Título de la monografía' },
                  { key: 'authorCol' as const, label: 'Autor' },
                  { key: 'academicYearCol' as const, label: 'Año lectivo' },
                  { key: 'subjectCol' as const, label: 'Asignatura' },
                  { key: 'academicUnitCol' as const, label: 'Unidad académica' },
                  { key: 'driveUrlCol' as const, label: 'Enlace Drive' },
                  { key: 'driveIdCol' as const, label: 'ID del archivo' },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <label className="block font-semibold text-slate-800 mb-1">
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key]}
                      onChange={(e) => handleUpdateColumnMapping(field.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-900"
                    >
                      <option value="">-- Automático --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. CÓDIGO GOOGLE APPS SCRIPT COMPLETO EN EL PERFIL ADMINISTRATIVO */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Code2 className="w-4 h-4 text-violet-700" />
                <span>
                  3. Código Google Apps Script Oficial (Lectura e indexación de Monografías)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Código copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar código Apps Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        </section>
      )}

      {/* =========================================================================
          FILTRO MULTICRITERIO Y BÚSQUEDA DEL REPOSITORIO DE MONOGRAFÍAS
         ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        {/* Chips de acceso rápido por Unidad Académica */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-violet-600" />
            <span>Filtrar por Unidad Académica (Columna &ldquo;Unidad Académica&rdquo;):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedAcademicUnit('all');
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedAcademicUnit === 'all'
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todas las áreas ({monographs.length})
            </button>
            {academicUnits.map((area) => {
              const count = monographs.filter(
                (m) => m.areaList?.includes(area) || m.academicUnit === area
              ).length;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    setSelectedAcademicUnit(area);
                    setPreviewMode('filtered');
                    setPageIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedAcademicUnit === area
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200/60'
                  }`}
                >
                  {area} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Buscador general multicriterio + Botón "Sincronizar ahora" + Selector de orden */}
        <div className="flex flex-col lg:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              placeholder="Buscar en la hoja repositorio por ID, título, autor, palabras clave, asesor, unidad académica o resumen..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 bg-slate-50/60 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPageIndex(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* BOTÓN "SINCRONIZAR AHORA" - Sincronización manual en ambas direcciones + Indicador en tiempo real */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                executeSyncWithSheets(
                  appsScriptExecUrl,
                  connectionUrl,
                  accessToken,
                  repoTabName,
                  authorizedUsers,
                  { triggerDriveScan: false, isManual: true }
                )
              }
              disabled={isSyncing}
              title="Sincronizar ahora con Google Sheets para actualizar las monografías y usuarios"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
            </button>

            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                isRealtimeActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="Sincronización en tiempo real activa entre todas las terminales y Google Sheets"
            >
              <span className="relative flex h-2 w-2">
                {isRealtimeActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isRealtimeActive ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span>{isRealtimeActive ? 'Tiempo Real (Sheets)' : 'Reconectando...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-violet-700 shrink-0" />
            <label htmlFor="repoSortSelect" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              id="repoSortSelect"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'title' | 'author' | 'year' | 'id' | 'unit')
              }
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="id">ID de Documento (2262, 2530...)</option>
              <option value="title">Título de la monografía (A - Z)</option>
              <option value="author">Autor / Estudiante (A - Z)</option>
              <option value="unit">Unidad Académica</option>
              <option value="year">Año lectivo (Más reciente)</option>
            </select>
          </div>
        </div>

        {/* 6 Selectores construidos con las columnas de la hoja "repositorio" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              1. Unidad Académica
            </label>
            <select
              value={selectedAcademicUnit}
              onChange={(e) => {
                setSelectedAcademicUnit(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas ({academicUnits.length})</option>
              {academicUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              2. Línea de investig.
            </label>
            <select
              value={selectedResearchLine}
              onChange={(e) => {
                setSelectedResearchLine(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas ({researchLines.length})</option>
              {researchLines.map((rl) => (
                <option key={rl} value={rl}>
                  {rl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              3. Tipo de Documento
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => {
                setSelectedDocType(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos ({docTypesList.length})</option>
              {docTypesList.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              4. Asesor(es)
            </label>
            <select
              value={selectedAdvisor}
              onChange={(e) => {
                setSelectedAdvisor(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos ({advisorsList.length})</option>
              {advisorsList.map((adv) => (
                <option key={adv} value={adv}>
                  {adv}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              5. Autor / Estudiante
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos ({authors.length})</option>
              {authors.map((auth) => (
                <option key={auth} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              6. Año y Grado
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                setPreviewMode('filtered');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los años ({academicYears.length})</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} (Grado 11°)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de resultados y botones de navegación */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-violet-700" />
            <span>
              Mostrando <strong>{threePreviewMonographs.length}</strong> documentos en pantalla (de{' '}
              <strong>{activeMonographList.length}</strong> de la hoja <em>repositorio</em>)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Pestañas para conmutar entre los 3 Ejemplos Destacados, el catálogo completo y el lector en pantalla */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPreviewMode('featured3');
                  setPageIndex(0);
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewMode === 'featured3'
                    ? 'bg-violet-700 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                ⭐ 3 Ejemplos en Tarjetas
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode('reader');
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewMode === 'reader'
                    ? 'bg-violet-700 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                📖 Lector en Pantalla (3 Ejemplos)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode('filtered');
                  setPageIndex(0);
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewMode === 'filtered'
                    ? 'bg-violet-700 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                📑 Ver Todas ({filteredMonographs.length})
              </button>
            </div>

            {(searchQuery ||
              selectedAcademicUnit !== 'all' ||
              selectedResearchLine !== 'all' ||
              selectedAdvisor !== 'all' ||
              selectedAcademicYear !== 'all' ||
              selectedAuthor !== 'all' ||
              selectedDocType !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-violet-700 hover:text-violet-950 font-semibold underline"
              >
                Restablecer todos los filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          VISTA PREVIA EN PANTALLA DE TRES EJEMPLOS DE LOS DOCUMENTOS
         ========================================================================= */}
      {threePreviewMonographs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron monografías con esos criterios de búsqueda
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Intenta buscar por otro ID de documento, título de monografía, autor, año lectivo o unidad académica.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 transition-colors"
          >
            Ver los 3 ejemplos destacados ({featuredThreeMonographs.length})
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {previewMode === 'featured3'
                    ? 'Vista Previa en Pantalla: 3 Ejemplos Destacados de la Hoja "repositorio"'
                    : `Vista Previa de Monografías (${threePreviewMonographs.length} de ${filteredMonographs.length})`}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {previewMode === 'featured3' ? '⭐ 3 Ejemplos Verificados' : 'Paginado de 3 en 3'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualización simultánea de 3 monografías con su unidad académica, línea de investigación, autor, asesor y resumen.
              </p>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePageIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-violet-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anteriores 3</span>
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Grupo {safePageIndex + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePageIndex >= totalPages - 1}
                  className="px-3 py-1.5 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguientes 3</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* VISTA PREVIA EN PANTALLA: LECTOR COMPLETO DE LOS 3 EJEMPLOS O CUADRÍCULA DE 3 MONOGRAFÍAS */}
          {previewMode === 'reader' ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold">
                    Lector Interactivo en Pantalla · 3 Ejemplos Verificados de la Hoja &ldquo;repositorio&rdquo;
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {featuredThreeMonographs.map((m, idx) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setReaderActiveDocId(m.documentoId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        (readerActiveDocId === m.documentoId || (!readerActiveDocId && idx === 0))
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-amber-300 font-bold">#{m.documentoId}</span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{m.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const readerDoc =
                  monographs.find((m) => m.documentoId === readerActiveDocId) ||
                  featuredThreeMonographs[0];
                const readerPreviewUrl = readerDoc
                  ? buildSingleDocPreviewUrl(readerDoc.driveFileId, readerDoc.driveUrl)
                  : null;

                if (!readerDoc) return null;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                    <div className="lg:col-span-5 p-6 bg-slate-50/70 border-r border-slate-200 flex flex-col justify-between space-y-4">
                      <div className="space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-100 text-violet-900 border border-violet-200">
                            Documento ID: #{readerDoc.documentoId}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-xs border border-emerald-300">
                            {readerDoc.status || 'Finalizado'} · {readerDoc.visibility || 'Digital'}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{readerDoc.academicUnit}</span>
                            <span aria-hidden="true">·</span>
                            <span>Grado {readerDoc.grade || '11°'} ({readerDoc.academicYear})</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {readerDoc.title}
                          </h3>
                        </div>

                        {readerDoc.researchLine && (
                          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-900 border border-violet-200/80 text-xs">
                            <span className="text-[10px] font-bold text-violet-700 uppercase block mb-0.5">
                              Línea de investigación:
                            </span>
                            <span className="font-medium">{readerDoc.researchLine}</span>
                          </div>
                        )}

                        <div className="space-y-1.5 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Autor / Estudiante:</span>
                            <strong className="text-slate-900 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-violet-700" />
                              <span>{readerDoc.author}</span>
                            </strong>
                          </div>
                          {readerDoc.advisorsRaw && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-slate-500">Asesor(es):</span>
                              <span className="font-medium text-slate-800">{readerDoc.advisorsRaw}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Tipo de Documento:</span>
                            <span className="font-medium text-slate-800">{readerDoc.docType}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Resumen de la Investigación:
                          </span>
                          <p className="text-xs text-slate-700 line-relaxed bg-white p-3.5 rounded-xl border border-slate-200 italic max-h-48 overflow-y-auto">
                            &ldquo;{readerDoc.abstractText}&rdquo;
                          </p>
                        </div>

                        {readerDoc.keywords && readerDoc.keywords.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                              Palabras Clave (Clic para filtrar):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {readerDoc.keywords.map((kw, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(kw);
                                    setPreviewMode('filtered');
                                    setPageIndex(0);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-white hover:bg-violet-100 text-slate-700 hover:text-violet-900 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  #{kw}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCiteMonograph(readerDoc)}
                          className="flex-1 px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Citar en Gestor (APA 7)</span>
                        </button>
                        <a
                          href={readerDoc.driveUrl || (readerDoc.driveFileId ? `https://drive.google.com/file/d/${readerDoc.driveFileId}/view` : DRIVE_ROOT_FOLDER_URL)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir en Drive</span>
                        </a>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-slate-900 flex flex-col justify-between relative min-h-[580px]">
                      <div className="p-3 bg-slate-950 text-white flex items-center justify-between text-xs px-4 border-b border-slate-800">
                        <span className="font-semibold text-slate-300 truncate max-w-md">
                          Vista previa en pantalla: {readerDoc.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(readerDoc)}
                          className="px-3 py-1 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pantalla Completa</span>
                        </button>
                      </div>

                      <div className="flex-1 w-full relative">
                        {readerPreviewUrl ? (
                          <iframe
                            src={readerPreviewUrl}
                            title={`Visor en pantalla de ${readerDoc.title}`}
                            className="w-full h-full min-h-[540px] border-0 bg-white"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
                            <BookOpen className="w-12 h-12 text-violet-400 mx-auto" />
                            <h4 className="text-base font-bold">{readerDoc.title}</h4>
                            <a
                              href={readerDoc.driveUrl || DRIVE_ROOT_FOLDER_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold inline-flex items-center gap-2"
                            >
                              <span>Abrir documento en Google Drive</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* GRID CON LA VISTA PREVIA EN PANTALLA DE TRES EJEMPLOS DE LOS DOCUMENTOS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {threePreviewMonographs.map((doc, idx) => {
              const singlePreviewUrl = buildSingleDocPreviewUrl(
                doc.driveFileId,
                doc.driveUrl
              );

              return (
                <article
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 overflow-hidden flex flex-col justify-between shadow-2xs transition-all"
                >
                  {/* PORTADA ACADÉMICA / VISTA PREVIA EN PANTALLA */}
                  <div className="relative p-5 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white flex flex-col justify-between min-h-[170px] border-b border-violet-800/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-200 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Colegio Ekirayá · Grado 11°</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/30">
                        ID: {doc.documentoId}
                      </span>
                    </div>

                    <div className="my-2 space-y-1">
                      <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-300" />
                        <span>{doc.academicUnit}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {doc.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-violet-200">
                      <span className="font-semibold text-white truncate max-w-[170px]">
                        {doc.author}
                      </span>
                      <span className="font-mono text-violet-300">{doc.academicYear} · {doc.status}</span>
                    </div>
                  </div>

                  {/* VENTANA DE VISTA PREVIA DEL DOCUMENTO EN PANTALLA */}
                  <div className="relative bg-slate-900 border-b border-slate-200 h-52 overflow-hidden group">
                    {singlePreviewUrl ? (
                      <iframe
                        src={singlePreviewUrl}
                        title={`Vista previa en pantalla de ${doc.title}`}
                        className="w-full h-full border-0 bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-950 text-white">
                        <FileText className="w-8 h-8 text-violet-400 mb-1" />
                        <span className="text-xs font-bold line-clamp-1">{doc.title}</span>
                        <span className="text-[10px] text-slate-400">
                          ID: {doc.documentoId} · {doc.academicUnit}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-950 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-colors shadow-xs cursor-pointer border border-white/20"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ampliar visor</span>
                    </button>
                  </div>

                  {/* METADATOS Y RESUMEN DETALLADO DEL DOCUMENTO */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                          <Building2 className="w-3 h-3 text-violet-700" />
                          <span>{doc.academicUnit}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                          Grado {doc.grade || '11'} · {doc.academicYear}
                        </span>
                      </div>

                      {doc.researchLine && (
                        <div className="text-[10px] font-semibold text-violet-800 bg-violet-50/70 p-2 rounded-lg border border-violet-100">
                          <span className="text-slate-500 uppercase block text-[9px] mb-0.5">Línea de investigación:</span>
                          <span className="line-clamp-2">{doc.researchLine}</span>
                        </div>
                      )}

                      {/* Resumen / Abstract de la monografía */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Resumen del Proyecto:
                        </span>
                        <p className="text-[11px] text-slate-700 line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70 italic">
                          &ldquo;{doc.abstractText || `Investigación desarrollada en el Colegio Ekirayá en la unidad de ${doc.academicUnit}.`}&rdquo;
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Autor(a):</span>
                          <span className="font-semibold text-slate-900 flex items-center gap-1 text-right">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                            <span>{doc.author}</span>
                          </span>
                        </div>
                        {doc.advisorsRaw && (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-slate-500">Asesor(es):</span>
                            <span className="font-medium text-slate-800 text-right">
                              {doc.advisorsRaw}
                            </span>
                          </div>
                        )}
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-200/70">
                            <div className="text-[10px] text-slate-500 mb-1">Palabras clave:</div>
                            <div className="flex flex-wrap items-center gap-1">
                              {doc.keywords.slice(0, 3).map((kw, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(kw);
                                    setPreviewMode('filtered');
                                    setPageIndex(0);
                                  }}
                                  title={`Filtrar por palabra clave: ${kw}`}
                                  className="px-1.5 py-0.5 rounded bg-white hover:bg-violet-100 text-slate-700 hover:text-violet-900 border border-slate-200 text-[10px] transition-colors cursor-pointer"
                                >
                                  #{kw}
                                </button>
                              ))}
                              {doc.keywords.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{doc.keywords.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción del documento */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ampliar Vista Previa</span>
                      </button>

                      <a
                        href={doc.driveUrl || (doc.driveFileId ? `https://drive.google.com/file/d/${doc.driveFileId}/view` : DRIVE_ROOT_FOLDER_URL)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors border border-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver Drive</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCiteMonograph(doc)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Citar en Gestor</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>
      )}

      {/* =========================================================================
          MODAL PARA PEGAR TABLA DIRECTAMENTE DESDE GOOGLE SHEETS
         ========================================================================= */}
      {showQuickPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Pegar celdas directamente desde Google Sheets (Hoja &ldquo;usuarios&rdquo; o
                &ldquo;Repositorio&rdquo;)
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickPasteModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Selecciona las celdas en tu archivo de Google Sheets (incluyendo la primera fila de
              títulos como <code>Curso, Sección, Nombre y Apellido, Correo institucional, Perfil</code>
              ), cópialas (<code>Ctrl+C</code>) y pégalas aquí abajo:
            </p>

            <textarea
              rows={7}
              value={quickPasteText}
              onChange={(e) => setQuickPasteText(e.target.value)}
              placeholder={
                'Curso\tSección\tNombre y Apellido\tCorreo institucional\tPerfil\n11°\tBachillerato\tSofía Mendoza\tsmendoza@cem.edu.co\tEstudiante'
              }
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickPasteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleProcessQuickPasteOrCsv(quickPasteText)}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold"
              >
                Importar y Sincronizar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración Sheets */}
      {renderSyncConfigModal()}

      {/* =========================================================================
          MODAL DE VISTA PREVIA AMPLIADA DE LA MONOGRAFÍA SELECCIONADA
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#664d88] text-white flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-violet-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>
                    {previewDoc.academicUnit} · {previewDoc.subject} · {previewDoc.fileName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold truncate mt-0.5">
                  {previewDoc.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const docToCite = previewDoc;
                    setPreviewDoc(null);
                    handleCiteMonograph(docToCite);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white text-violet-950 hover:bg-violet-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-700" />
                  <span>Citar esta Monografía</span>
                </button>
                <a
                  href={
                    previewDoc.driveFileId
                      ? `https://drive.google.com/file/d/${previewDoc.driveFileId}/view`
                      : previewDoc.driveUrl || DRIVE_ROOT_FOLDER_URL
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-violet-800 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-violet-500/40"
                >
                  <span>Abrir en Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg bg-violet-900/60 hover:bg-violet-900 text-white"
                  aria-label="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-violet-900 bg-violet-100 px-2 py-0.5 rounded border border-violet-200">
                  {previewDoc.documentCode || 'MONO'}
                </span>
                <span>
                  <strong>Autor(a):</strong> {previewDoc.author}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong>Área:</strong> {previewDoc.academicUnit}
                </span>
                {previewDoc.researchLine && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong>Línea:</strong> {previewDoc.researchLine}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  <strong>Asignatura:</strong> {previewDoc.subject}
                </span>
                {previewDoc.advisorsRaw && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong>Asesor(es):</strong> {previewDoc.advisorsRaw}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  <strong>Grado/Año:</strong> {previewDoc.grade ? `Grado ${previewDoc.grade}°` : 'Grado 11°'} · {previewDoc.academicYear}
                </span>
              </div>
              <span className="font-mono text-[11px] text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                {previewDoc.fileName}
              </span>
            </div>

            <div className="flex-1 bg-slate-100 relative overflow-y-auto">
              {buildSingleDocPreviewUrl(previewDoc.driveFileId, previewDoc.driveUrl) ? (
                <div className="w-full h-full flex flex-col">
                  {previewDoc.abstractText && (
                    <div className="p-4 bg-white border-b border-slate-200 text-xs text-slate-700 space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-violet-950 uppercase tracking-wide text-[11px]">
                          Resumen de la Monografía ({previewDoc.academicUnit} — {previewDoc.subject})
                        </span>
                        {previewDoc.keywords && previewDoc.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {previewDoc.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 text-[10px]"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="leading-relaxed line-clamp-3">{previewDoc.abstractText}</p>
                    </div>
                  )}
                  <iframe
                    title={`Vista previa de ${previewDoc.fileName}`}
                    src={buildSingleDocPreviewUrl(previewDoc.driveFileId, previewDoc.driveUrl)!}
                    className="w-full flex-1 border-0"
                    allow="autoplay"
                  />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto my-6 bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-10 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-6 space-y-2">
                    <div className="flex justify-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet-900 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                        {previewDoc.documentCode}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-violet-800 py-0.5">
                        Colegio Ekirayá · Grado {previewDoc.grade || '11°'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                      Área: {previewDoc.academicUnit} {previewDoc.researchLine ? `(Línea: ${previewDoc.researchLine})` : ''} · Asignatura:{' '}
                      {previewDoc.subject}
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 pt-2">
                      {previewDoc.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 pt-1">
                      <strong>Autor(a):</strong> {previewDoc.author} ·{' '}
                      <strong>Asesor(es):</strong> {previewDoc.advisorsRaw || 'Equipo docente'} ·{' '}
                      <strong>Año:</strong> {previewDoc.academicYear}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1.5">
                        1. Resumen de la Investigación
                      </h5>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {previewDoc.abstractText ||
                          `Documento monográfico perteneciente a la unidad académica ${previewDoc.academicUnit} en el área de ${previewDoc.subject}.`}
                      </p>
                    </div>

                    {previewDoc.keywords && previewDoc.keywords.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1.5">
                          2. Palabras Clave
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {previewDoc.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-lg bg-violet-50 text-violet-900 border border-violet-200 text-xs font-medium"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-xs text-slate-500">
                      Archivo: {previewDoc.fileName}
                    </span>
                    <a
                      href={previewDoc.driveUrl || DRIVE_ROOT_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <span>Abrir carpeta en Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
