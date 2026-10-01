import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { CitationFormData } from '../types/citation';

export interface MonographDocument {
  id: string;
  driveFileId: string;
  fileName: string;
  title: string;
  author: string;
  academicYear: string;
  subject: string;
  academicUnit: string;
  format: 'PDF' | 'Google Doc' | 'DOCX' | 'Archivo';
  driveUrl: string;
  rawRow?: Record<string, string>;
}

export interface AuthorizedSchoolUser {
  curso: string;
  seccion: string;
  nombres: string;
  correo: string;
  perfil: string;
  isAdmin: boolean;
}

interface ColumnMapping {
  fileNameCol: string;
  titleCol: string;
  authorCol: string;
  academicYearCol: string;
  subjectCol: string;
  academicUnitCol: string;
  driveUrlCol: string;
  driveIdCol: string;
}

interface RepositorioSectionProps {
  onCiteMonographInGestor: (formData: Partial<CitationFormData>, title: string) => void;
  showToast: (msg: string) => void;
}

const DRIVE_ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const DRIVE_ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_ROOT_FOLDER_ID}`;

const STORAGE_REPO_CONFIG_KEY = 'ekiraya_repo_unidades_academicas_v4';
const STORAGE_AUTH_USER_KEY = 'ekiraya_repo_authorized_user_v4';

// Administrador inicial para garantizar acceso al Panel Administrativo antes de sincronizar la hoja
const DEFAULT_AUTHORIZED_USERS: AuthorizedSchoolUser[] = [
  {
    curso: 'Administración',
    seccion: 'Dirección / Coordinación',
    nombres: 'Coordinación y Administración Cita Master',
    correo: 'mebolanos@cem.edu.co',
    perfil: 'Administrador',
    isAdmin: true,
  },
];

// Tres monografías iniciales para la vista previa de 3 monografías (se reemplazan automáticamente al sincronizar Google Sheets)
const DEFAULT_THREE_MONOGRAPHS: MonographDocument[] = [
  {
    id: 'preview-mono-1',
    driveFileId: '',
    fileName: 'Monografia_Unidad_Ciencias_Naturales_2026.pdf',
    title:
      'Evaluación de macroinvertebrados bentónicos como bioindicadores de calidad del agua en humedales de la Sabana',
    author: 'Mendoza Restrepo, Sofía',
    academicYear: '2025-2026',
    subject: 'Biología y Ecología',
    academicUnit: 'Ciencias Naturales y Educación Ambiental',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
  },
  {
    id: 'preview-mono-2',
    driveFileId: '',
    fileName: 'Monografia_Unidad_Humanidades_Literatura_2026.pdf',
    title:
      'Narrativas de la memoria y reconstrucción del tejido social en la novela colombiana contemporánea',
    author: 'Castellanos Uribe, Mateo',
    academicYear: '2025-2026',
    subject: 'Literatura y Lengua Castellana',
    academicUnit: 'Humanidades y Lenguas',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
  },
  {
    id: 'preview-mono-3',
    driveFileId: '',
    fileName: 'Monografia_Unidad_Matematicas_Fisica_2026.pdf',
    title:
      'Modelado matemático de la eficiencia energética de paneles fotovoltaicos en entornos escolares de montaña',
    author: 'Quintero Lozano, Samuel',
    academicYear: '2025-2026',
    subject: 'Física y Matemáticas',
    academicUnit: 'Matemáticas, Física y Tecnología',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
  },
];

export const APPS_SCRIPT_CODE = `/**
 * COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI — CITA MASTER
 * Script de Sincronización entre la Carpeta de Drive "Unidades académicas"
 * (ID: 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC) y el archivo de Google Sheets.
 *
 * Hojas gestionadas en este Google Sheet:
 * 1) Hoja "Repositorio":
 *    Columnas: Nombre del archivo | Título de la monografía | Autor | Año lectivo | Asignatura | Unidad académica | ID del archivo | Enlace Drive
 * 2) Hoja "usuarios":
 *    Columnas exactas: Curso | Sección | Nombre y Apellido | Correo institucional | Perfil
 */

const ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const REPO_SHEET_NAME = 'Repositorio';
const USERS_SHEET_NAME = 'usuarios';
const INSTITUTIONAL_TOKEN = 'EKIRAYA-2026';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('🔄 Sincronizar carpeta Unidades Académicas con Sheets', 'sincronizarUnidadesAcademicas')
    .addItem('👥 Verificar estructura hoja usuarios', 'inicializarHojaUsuarios')
    .addToUi();
}

/**
 * Crea o verifica la hoja "usuarios" respetando exactamente las columnas:
 * Curso | Sección | Nombre y Apellido | Correo institucional | Perfil
 */
function inicializarHojaUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet =
    ss.getSheetByName(USERS_SHEET_NAME) ||
    ss.getSheetByName('Usuarios') ||
    ss.getSheetByName('USUARIOS');

  const expectedUserHeaders = [
    'Curso',
    'Sección',
    'Nombre y Apellido',
    'Correo institucional',
    'Perfil'
  ];

  if (!userSheet) {
    userSheet = ss.insertSheet(USERS_SHEET_NAME);
    userSheet.appendRow(expectedUserHeaders);
    userSheet.getRange(1, 1, 1, expectedUserHeaders.length).setFontWeight('bold');
    userSheet.appendRow([
      'Administración',
      'Coordinación Académica',
      'Administrador Cita Master',
      'mebolanos@cem.edu.co',
      'Administrador'
    ]);
  } else if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(expectedUserHeaders);
    userSheet.getRange(1, 1, 1, expectedUserHeaders.length).setFontWeight('bold');
  }
}

/**
 * Recorre recursivamente la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC ("Unidades académicas")
 * y sincroniza todos los archivos en la hoja "Repositorio" según los títulos de cada columna:
 * Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura, Unidad académica, ID del archivo, Enlace Drive
 */
function sincronizarUnidadesAcademicas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REPO_SHEET_NAME);

  const expectedHeaders = [
    'Nombre del archivo',
    'Título de la monografía',
    'Autor',
    'Año lectivo',
    'Asignatura',
    'Unidad académica',
    'ID del archivo',
    'Enlace Drive'
  ];

  if (!sheet) {
    sheet = ss.insertSheet(REPO_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).trim(); });

  // Si la hoja activa era la de "usuarios", crear/usar la pestaña "Repositorio" separada
  const normalizedFirstRow = headers.join(' ').toLowerCase();
  if (normalizedFirstRow.includes('correo institucional') || normalizedFirstRow.includes('perfil')) {
    sheet = ss.getSheetByName(REPO_SHEET_NAME) || ss.insertSheet(REPO_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(expectedHeaders);
      sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold');
    }
  }

  const repoData = sheet.getDataRange().getValues();
  const repoHeaders = repoData[0].map(function(h) { return String(h).trim(); });

  let idColIdx = repoHeaders.findIndex(function(h) { return /id/i.test(h); });
  let urlColIdx = repoHeaders.findIndex(function(h) { return /enlace|url|link|drive/i.test(h); });
  let nameColIdx = repoHeaders.findIndex(function(h) { return /archivo|file/i.test(h); });

  const existingKeys = new Set();
  for (let i = 1; i < repoData.length; i++) {
    const rowId = idColIdx >= 0 ? String(repoData[i][idColIdx]).trim() : '';
    const rowUrl = urlColIdx >= 0 ? String(repoData[i][urlColIdx]).trim() : '';
    const rowName = nameColIdx >= 0 ? String(repoData[i][nameColIdx]).trim() : '';
    if (rowId) existingKeys.add(rowId);
    if (rowUrl) existingKeys.add(rowUrl);
    if (rowName) existingKeys.add(rowName);
  }

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  recorrerCarpetasDrive(rootFolder, [], sheet, repoHeaders, existingKeys);
  inicializarHojaUsuarios();
}

function recorrerCarpetasDrive(folder, pathParts, sheet, headers, existingKeys) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileName = file.getName();

    if (existingKeys.has(fileId) || existingKeys.has(fileUrl)) continue;

    const cleanTitle = fileName
      .replace(/\\.(pdf|docx|doc)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    // Jerarquía dentro de Unidades académicas:
    // Nivel 0: Unidad académica | Nivel 1: Asignatura / Estudiante | Nivel final: Autor
    const unidadAcademica = pathParts.length > 0 ? pathParts[0] : folder.getName();
    const asignatura = pathParts.length > 1 ? pathParts[1] : unidadAcademica;
    const autor = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Estudiante Grado 11';
    const anioLectivo = String(new Date(file.getDateCreated()).getFullYear());

    const newRow = headers.map(function(headerName) {
      const h = headerName.toLowerCase();
      if (h.includes('archivo') && !h.includes('id')) return fileName;
      if (h.includes('título') || h.includes('titulo') || h.includes('monografía') || h.includes('monografia')) return cleanTitle;
      if (h.includes('autor') || h.includes('estudiante') || h.includes('nombre y apellido')) return autor;
      if (h.includes('año') || h.includes('ano') || h.includes('lectivo') || h.includes('fecha')) return anioLectivo;
      if (h.includes('asignatura') || h.includes('materia') || h.includes('área') || h.includes('area')) return asignatura;
      if (h.includes('unidad')) return unidadAcademica;
      if (h.includes('id')) return fileId;
      if (h.includes('enlace') || h.includes('url') || h.includes('link') || h.includes('drive')) return fileUrl;
      return '';
    });

    sheet.appendRow(newRow);
    existingKeys.add(fileId);
  }

  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    const sub = subFolders.next();
    recorrerCarpetasDrive(sub, pathParts.concat([sub.getName()]), sheet, headers, existingKeys);
  }
}

function leerHojaPorTitulos(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) {
    return { headers: [], rows: [] };
  }
  const values = sheet.getDataRange().getDisplayValues();
  const rawHeaders = values[0].map(function(h, idx) {
    return String(h || '').trim() || ('Columna_' + (idx + 1));
  });
  const richTextValues = sheet.getDataRange().getRichTextValues();
  const rows = [];

  for (let r = 1; r < values.length; r++) {
    const rowValues = values[r];
    const isEmpty = rowValues.every(function(cell) { return !String(cell || '').trim(); });
    if (isEmpty) continue;

    const rowObj = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const colTitle = rawHeaders[c];
      const cellVal = String(rowValues[c] || '').trim();
      const richLink = richTextValues[r] && richTextValues[r][c] ? richTextValues[r][c].getLinkUrl() : null;
      if (richLink && !cellVal.startsWith('http')) {
        rowObj[colTitle + '_url'] = richLink;
      }
      rowObj[colTitle] = cellVal;
    }
    rows.push(rowObj);
  }
  return { headers: rawHeaders, rows: rows };
}

/**
 * Endpoint Web App (JSON) para Cita Master:
 * Devuelve los documentos de "Repositorio" y los perfiles de "usuarios" (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil).
 */
function doGet(e) {
  const tokenParam = e && e.parameter && e.parameter.token ? e.parameter.token : '';
  if (INSTITUTIONAL_TOKEN && tokenParam && tokenParam !== INSTITUTIONAL_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Token no válido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  let repoSheet = ss.getSheetByName(REPO_SHEET_NAME);
  let usersSheet =
    ss.getSheetByName(USERS_SHEET_NAME) ||
    ss.getSheetByName('Usuarios') ||
    ss.getSheetByName('USUARIOS');

  // Detectar automáticamente si alguna pestaña tiene las columnas de usuarios (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
  for (let i = 0; i < allSheets.length; i++) {
    const sh = allSheets[i];
    if (sh.getLastRow() > 0) {
      const firstRowStr = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getDisplayValues()[0].join(' ').toLowerCase();
      if (!usersSheet && (firstRowStr.includes('correo institucional') || firstRowStr.includes('nombre y apellido') || firstRowStr.includes('perfil'))) {
        usersSheet = sh;
      } else if (!repoSheet && (firstRowStr.includes('monografía') || firstRowStr.includes('monografia') || firstRowStr.includes('asignatura') || firstRowStr.includes('archivo'))) {
        repoSheet = sh;
      }
    }
  }

  if (!repoSheet) repoSheet = allSheets[0];

  const repoData = leerHojaPorTitulos(repoSheet);
  const usersData = leerHojaPorTitulos(usersSheet);

  return ContentService.createTextOutput(JSON.stringify({
    folderId: ROOT_FOLDER_ID,
    headers: repoData.headers,
    rows: repoData.rows,
    usuariosHeaders: usersData.headers,
    usuariosRows: usersData.rows
  })).setMimeType(ContentService.MimeType.JSON);
}`;

/** Normaliza encabezados de columna para compararlos sin importar tildes ni mayúsculas */
function normalizeHeaderKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/** Construye la URL de vista previa de un documento individual (nunca la lista de Drive) */
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

/** Parsea CSV de Google Sheets convirtiendo la fila 1 en títulos de columna */
function parseCsvToRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
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

/** Detecta si un conjunto de encabezados corresponde a la hoja "usuarios" (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil) */
function isUsersSheetHeaders(headers: string[]): boolean {
  const joined = headers.map((h) => normalizeHeaderKey(h)).join(' | ');
  return (
    joined.includes('correo institucional') ||
    joined.includes('nombre y apellido') ||
    (joined.includes('curso') && joined.includes('seccion') && joined.includes('perfil'))
  );
}

/** Detecta automáticamente los títulos de columna en la hoja de Monografías */
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
    fileNameCol: findCol(
      [/^nombre del archivo$/, /nombre.*archivo/, /^archivo$/, /^file\s*name$/, /^documento$/],
      [/^id/, /url/, /enlace/, /link/]
    ),
    titleCol: findCol(
      [
        /^titulo de la monografia$/,
        /titulo.*monografia/,
        /^titulo$/,
        /^monografia$/,
        /nombre.*monografia/,
        /nombre.*trabajo/,
        /tema/,
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
      /autor.*estudiante/,
      /estudiante.*autor/,
      /apellidos/,
      /nombres/,
    ]),
    academicYearCol: findCol([
      /^ano lectivo$/,
      /ano.*lectivo/,
      /periodo.*lectivo/,
      /^ano$/,
      /promocion/,
      /cohorte/,
      /fecha/,
    ]),
    subjectCol: findCol([
      /^asignatura$/,
      /asignatura/,
      /^materia$/,
      /^area$/,
      /disciplina/,
    ]),
    academicUnitCol: findCol([
      /^unidad academica$/,
      /unidad.*academica/,
      /^unidad$/,
      /departamento/,
    ]),
    driveUrlCol: findCol([
      /enlace.*drive/,
      /url.*drive/,
      /^enlace$/,
      /^url$/,
      /^link$/,
      /vista.*previa/,
      /hipervinculo/,
    ]),
    driveIdCol: findCol([/^id del archivo$/, /id.*archivo/, /drive.*id/, /^file.*id$/, /^id$/]),
  };
}

/**
 * Convierte las filas de la hoja "usuarios" con las columnas:
 * Curso | Sección | Nombre y Apellido | Correo institucional | Perfil
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

  const cursoCol = findHeader([/^curso$/, /^grado$/, /nivel/]);
  const seccionCol = findHeader([/^seccion$/, /dependencia/, /area/]);
  const nombresCol = findHeader([
    /^nombre y apellido$/,
    /nombre.*apellido/,
    /^nombres?$/,
    /nombre.*completo/,
    /usuario/,
    /estudiante/,
  ]);
  const correoCol = findHeader([
    /^correo institucional$/,
    /correo.*institucional/,
    /^correo$/,
    /email/,
    /e mail/,
    /mail/,
    /cuenta/,
  ]);
  const perfilCol = findHeader([/^perfil$/, /^rol$/, /^administrador$/, /^admin$/, /estamento/]);

  const parsedUsers: AuthorizedSchoolUser[] = [];

  for (const row of rows) {
    let correo = (correoCol && row[correoCol]) || '';
    if (!correo) {
      const emailCell = Object.values(row).find((v) => String(v || '').includes('@'));
      if (emailCell) correo = String(emailCell);
    }
    correo = correo.trim().toLowerCase();
    if (!correo || !correo.includes('@')) continue;

    const nombres =
      (nombresCol && row[nombresCol]) ||
      correo.split('@')[0].replace(/[._-]/g, ' ');
    const curso = (cursoCol && row[cursoCol]) || 'General';
    const seccion = (seccionCol && row[seccionCol]) || 'General';
    const perfil = (perfilCol && row[perfilCol]) || 'Estudiante';

    const combinedRoleText = `${perfil} ${seccion} ${curso}`.toLowerCase();
    const isAdmin =
      correo === 'mebolanos@cem.edu.co' ||
      /admin|administrador|coordinador|directivo|sistemas|^si$|^sí$|^true$|^1$/i.test(
        perfil.trim()
      ) ||
      /admin|administrador/i.test(combinedRoleText);

    parsedUsers.push({
      curso: curso.trim(),
      seccion: seccion.trim(),
      nombres: nombres.trim(),
      correo,
      perfil: perfil.trim(),
      isAdmin,
    });
  }

  // Asegurar que el correo administrador principal siempre esté autorizado
  if (!parsedUsers.some((u) => u.correo === 'mebolanos@cem.edu.co')) {
    parsedUsers.push(DEFAULT_AUTHORIZED_USERS[0]);
  }

  return parsedUsers;
}

/** Convierte las filas de la hoja del Repositorio en documentos incluyendo Unidad académica */
function mapSheetRowsToMonographs(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  headers: string[]
): MonographDocument[] {
  return rawRows
    .map((row, idx) => {
      let rawUrl = (mapping.driveUrlCol && row[mapping.driveUrlCol]) || '';
      if (!rawUrl && mapping.driveUrlCol && row[`${mapping.driveUrlCol}_url`]) {
        rawUrl = row[`${mapping.driveUrlCol}_url`];
      }
      if (!rawUrl) {
        for (const key of Object.keys(row)) {
          const val = String(row[key] || '');
          if (val.includes('drive.google.com') || val.includes('docs.google.com')) {
            rawUrl = val;
            break;
          }
        }
      }

      const rawIdCell = (mapping.driveIdCol && row[mapping.driveIdCol]) || '';
      const extractedFileId = extractDriveFileId(rawIdCell) || extractDriveFileId(rawUrl);

      let authorVal = (mapping.authorCol && row[mapping.authorCol]) || '';
      const firstNameHeader = headers.find((h) =>
        /^nombres?(?:_estudiante)?$/i.test(normalizeHeaderKey(h))
      );
      const lastNameHeader = headers.find((h) =>
        /^apellidos?(?:_estudiante)?$/i.test(normalizeHeaderKey(h))
      );
      if (firstNameHeader && lastNameHeader && (row[firstNameHeader] || row[lastNameHeader])) {
        const f = (row[firstNameHeader] || '').trim();
        const l = (row[lastNameHeader] || '').trim();
        authorVal = [f, l].filter(Boolean).join(' ');
      }

      const fileNameVal =
        (mapping.fileNameCol && row[mapping.fileNameCol]) ||
        (mapping.titleCol && row[mapping.titleCol]) ||
        `Monografia_${idx + 1}.pdf`;

      const titleVal =
        (mapping.titleCol && row[mapping.titleCol]) ||
        fileNameVal.replace(/\.(pdf|docx|doc)$/i, '').replace(/[_-]+/g, ' ');

      const academicUnitVal =
        (mapping.academicUnitCol && row[mapping.academicUnitCol]) ||
        (mapping.subjectCol && row[mapping.subjectCol]) ||
        'Unidades Académicas';

      const subjectVal =
        (mapping.subjectCol && row[mapping.subjectCol]) ||
        academicUnitVal ||
        'Asignatura General';

      const academicYearVal =
        (mapping.academicYearCol && row[mapping.academicYearCol]) || '2025-2026';

      let format: 'PDF' | 'Google Doc' | 'DOCX' | 'Archivo' = 'PDF';
      if (/\.docx?$/i.test(fileNameVal)) format = 'DOCX';
      else if (rawUrl.includes('docs.google.com/document')) format = 'Google Doc';

      const finalDriveUrl =
        rawUrl ||
        (extractedFileId
          ? `https://drive.google.com/file/d/${extractedFileId}/view`
          : DRIVE_ROOT_FOLDER_URL);

      return {
        id: `sheet-row-${idx}-${extractedFileId || idx}`,
        driveFileId: extractedFileId,
        fileName: fileNameVal,
        title: titleVal,
        author: authorVal || 'Estudiante Grado 11°',
        academicYear: academicYearVal,
        subject: subjectVal,
        academicUnit: academicUnitVal,
        format,
        driveUrl: finalDriveUrl,
        rawRow: row,
      };
    })
    .filter((doc) => Boolean(doc.title.trim() || doc.fileName.trim()));
}

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({
  onCiteMonographInGestor,
  showToast,
}) => {
  // Datos del Repositorio (Monografías)
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fileNameCol: '',
    titleCol: '',
    authorCol: '',
    academicYearCol: '',
    subjectCol: '',
    academicUnitCol: '',
    driveUrlCol: '',
    driveIdCol: '',
  });

  // Datos de la hoja "usuarios" (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
  const [authorizedUsers, setAuthorizedUsers] =
    useState<AuthorizedSchoolUser[]>(DEFAULT_AUTHORIZED_USERS);
  const [currentUser, setCurrentUser] = useState<AuthorizedSchoolUser | null>(null);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filtros de búsqueda: Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura y Unidad académica
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicUnit, setSelectedAcademicUnit] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'file'>('title');

  // Paginación de la Vista Previa de 3 Monografías (muestra de 3 en 3)
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Modal de vista previa en pantalla completa
  const [previewDoc, setPreviewDoc] = useState<MonographDocument | null>(null);

  // Sección exclusiva de Administrador (oculta para estudiantes, docentes y personal no administrador)
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(true);
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [usersSheetUrl, setUsersSheetUrl] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Agregar usuario en la tabla autorizada (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
  const [newUserCourse, setNewUserCourse] = useState('');
  const [newUserSection, setNewUserSection] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserProfile, setNewUserProfile] = useState('Estudiante');

  // Cargar configuración y sesión de localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      let loadedUsers = DEFAULT_AUTHORIZED_USERS;

      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig?.connectionUrl) setConnectionUrl(parsedConfig.connectionUrl);
        if (parsedConfig?.usersSheetUrl) setUsersSheetUrl(parsedConfig.usersSheetUrl);
        if (parsedConfig?.accessToken) setAccessToken(parsedConfig.accessToken);
        if (parsedConfig?.lastSyncDate) setLastSyncDate(parsedConfig.lastSyncDate);
        if (Array.isArray(parsedConfig?.rawHeaders)) setRawHeaders(parsedConfig.rawHeaders);
        if (Array.isArray(parsedConfig?.rawRows)) setRawRows(parsedConfig.rawRows);
        if (parsedConfig?.columnMapping) setColumnMapping(parsedConfig.columnMapping);
        if (
          Array.isArray(parsedConfig?.authorizedUsers) &&
          parsedConfig.authorizedUsers.length > 0
        ) {
          loadedUsers = parsedConfig.authorizedUsers;
          setAuthorizedUsers(loadedUsers);
        }
      }

      const savedAuth = localStorage.getItem(STORAGE_AUTH_USER_KEY);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth?.correo) {
          const matched = loadedUsers.find(
            (u) => u.correo.toLowerCase() === String(parsedAuth.correo).toLowerCase()
          );
          if (matched) {
            setCurrentUser(matched);
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Lista de monografías (usa las filas sincronizadas de Google Sheets o las 3 vistas previas iniciales)
  const monographs: MonographDocument[] = useMemo(() => {
    if (rawRows.length === 0) return DEFAULT_THREE_MONOGRAPHS;
    const mapped = mapSheetRowsToMonographs(rawRows, columnMapping, rawHeaders);
    return mapped.length > 0 ? mapped : DEFAULT_THREE_MONOGRAPHS;
  }, [rawRows, columnMapping, rawHeaders]);

  // Validación estricta contra la hoja "usuarios" (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
  const handleLoginWithUsersSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setLoginError('Por favor ingresa tu Correo institucional.');
      return;
    }

    const foundUser = authorizedUsers.find((u) => u.correo.toLowerCase() === cleanEmail);

    if (!foundUser) {
      setLoginError(
        'Acceso restringido: Tu Correo institucional no se encuentra registrado en la hoja "usuarios" autorizada del Colegio Ekirayá.'
      );
      return;
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

  /**
   * Sincroniza tanto la hoja del Repositorio como la hoja "usuarios"
   * (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
   */
  const handleSyncRepositoryAndUsers = async () => {
    const cleanUrl = connectionUrl.trim();
    const cleanUsersUrl = usersSheetUrl.trim();

    if (!cleanUrl && !cleanUsersUrl) {
      showToast('Pega el enlace de tu Google Sheet o la URL Web App de Apps Script');
      return;
    }

    setIsSyncing(true);
    try {
      let headers: string[] = [...rawHeaders];
      let rows: Record<string, string>[] = [...rawRows];
      let loadedUsers: AuthorizedSchoolUser[] = [...authorizedUsers];

      const primaryUrl = cleanUrl || cleanUsersUrl;
      const sheetIdMatch = primaryUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);

      if (sheetIdMatch?.[1]) {
        const sheetId = sheetIdMatch[1];
        const gidMatch = primaryUrl.match(/[#&?]gid=(\d+)/);
        const gidParam = gidMatch?.[1] ? `&gid=${gidMatch[1]}` : '';

        // 1. Leer la hoja indicada en el enlace principal
        const csvEndpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
        const resp = await fetch(csvEndpoint);
        if (!resp.ok) {
          throw new Error('No se pudo leer el Google Sheet.');
        }
        const csvText = await resp.text();
        const parsedPrimary = parseCsvToRows(csvText);

        // Verificar si la primera pestaña es la de "usuarios" (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
        if (isUsersSheetHeaders(parsedPrimary.headers)) {
          loadedUsers = parseUsersSheetRows(parsedPrimary.rows, parsedPrimary.headers);
          // Intentar cargar también la pestaña "Repositorio" del mismo archivo
          try {
            const repoResp = await fetch(
              `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Repositorio`
            );
            if (repoResp.ok) {
              const repoCsv = await repoResp.text();
              const parsedRepo = parseCsvToRows(repoCsv);
              if (!isUsersSheetHeaders(parsedRepo.headers) && parsedRepo.rows.length > 0) {
                headers = parsedRepo.headers;
                rows = parsedRepo.rows;
              }
            }
          } catch {
            // No hay pestaña Repositorio aún
          }
        } else {
          headers = parsedPrimary.headers;
          rows = parsedPrimary.rows;
        }

        // 2. Intentar leer la hoja "usuarios" explícitamente
        const targetUsersSheetId =
          cleanUsersUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] || sheetId;
        const usersGidMatch = cleanUsersUrl.match(/[#&?]gid=(\d+)/);
        const usersCsvEndpoint = usersGidMatch?.[1]
          ? `https://docs.google.com/spreadsheets/d/${targetUsersSheetId}/gviz/tq?tqx=out:csv&gid=${usersGidMatch[1]}`
          : `https://docs.google.com/spreadsheets/d/${targetUsersSheetId}/gviz/tq?tqx=out:csv&sheet=usuarios`;

        try {
          const usersResp = await fetch(usersCsvEndpoint);
          if (usersResp.ok) {
            const usersCsv = await usersResp.text();
            const parsedUsersSheet = parseCsvToRows(usersCsv);
            if (isUsersSheetHeaders(parsedUsersSheet.headers) || parsedUsersSheet.rows.length > 0) {
              loadedUsers = parseUsersSheetRows(
                parsedUsersSheet.rows,
                parsedUsersSheet.headers
              );
            }
          }
        } catch {
          // Mantiene loadedUsers
        }
      } else {
        // Conexión vía Web App de Google Apps Script (/exec)
        const separator = primaryUrl.includes('?') ? '&' : '?';
        const requestUrl = accessToken.trim()
          ? `${primaryUrl}${separator}token=${encodeURIComponent(accessToken.trim())}`
          : primaryUrl;

        const resp = await fetch(requestUrl);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();

        if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) {
          const incomingHeaders = data.headers.map((h: string) => String(h).trim());
          if (isUsersSheetHeaders(incomingHeaders)) {
            loadedUsers = parseUsersSheetRows(data.rows, incomingHeaders);
          } else {
            headers = incomingHeaders;
            rows = data.rows;
          }
        }

        if (Array.isArray(data?.usuariosRows) && Array.isArray(data?.usuariosHeaders)) {
          const parsedUsers = parseUsersSheetRows(data.usuariosRows, data.usuariosHeaders);
          if (parsedUsers.length > 0) {
            loadedUsers = parsedUsers;
          }
        }
      }

      const detectedMapping =
        headers.length > 0 ? autoDetectColumnMapping(headers) : columnMapping;
      const nowStr = new Date().toLocaleString('es-CO');

      if (headers.length > 0) setRawHeaders(headers);
      if (rows.length > 0) setRawRows(rows);
      setColumnMapping(detectedMapping);
      setAuthorizedUsers(loadedUsers);
      setLastSyncDate(nowStr);
      setPageIndex(0);

      if (currentUser) {
        const refreshedCurrent = loadedUsers.find(
          (u) => u.correo.toLowerCase() === currentUser.correo.toLowerCase()
        );
        if (refreshedCurrent) {
          setCurrentUser(refreshedCurrent);
          localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(refreshedCurrent));
        }
      }

      localStorage.setItem(
        STORAGE_REPO_CONFIG_KEY,
        JSON.stringify({
          connectionUrl: cleanUrl,
          usersSheetUrl: cleanUsersUrl,
          accessToken: accessToken.trim(),
          lastSyncDate: nowStr,
          rawHeaders: headers,
          rawRows: rows,
          columnMapping: detectedMapping,
          authorizedUsers: loadedUsers,
        })
      );

      showToast(
        `Sincronizado: ${rows.length} monografías y ${loadedUsers.length} usuarios registrados.`
      );
    } catch {
      showToast(
        'Error al conectar con Google Sheets. Verifica que el archivo tenga permiso de lectura o usa el Web App de Apps Script.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateColumnMapping = (field: keyof ColumnMapping, colName: string) => {
    const updated = { ...columnMapping, [field]: colName };
    setColumnMapping(updated);
    try {
      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      const parsed = savedConfig ? JSON.parse(savedConfig) : {};
      localStorage.setItem(
        STORAGE_REPO_CONFIG_KEY,
        JSON.stringify({
          ...parsed,
          columnMapping: updated,
        })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const handleAddAuthorizedUserManually = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = newUserEmail.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@') || !newUserName.trim()) {
      showToast('Completa Nombre y Apellido y Correo institucional');
      return;
    }

    const isAdminProfile = /admin/i.test(newUserProfile);
    const newUser: AuthorizedSchoolUser = {
      curso: newUserCourse.trim() || 'General',
      seccion: newUserSection.trim() || 'General',
      nombres: newUserName.trim(),
      correo: cleanMail,
      perfil: newUserProfile.trim(),
      isAdmin: isAdminProfile || cleanMail === 'mebolanos@cem.edu.co',
    };

    const updatedUsers = [
      ...authorizedUsers.filter((u) => u.correo.toLowerCase() !== cleanMail),
      newUser,
    ];
    setAuthorizedUsers(updatedUsers);
    setNewUserCourse('');
    setNewUserSection('');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserProfile('Estudiante');

    try {
      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      const parsed = savedConfig ? JSON.parse(savedConfig) : {};
      localStorage.setItem(
        STORAGE_REPO_CONFIG_KEY,
        JSON.stringify({
          ...parsed,
          authorizedUsers: updatedUsers,
        })
      );
    } catch {
      // Ignore storage errors
    }
    showToast(`Usuario agregado: ${newUser.nombres} (${newUser.perfil})`);
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

  // Listas únicas dinámicas para los selectores de filtro (incluyendo Unidad académica)
  const academicUnits = useMemo(
    () =>
      Array.from(new Set(monographs.map((m) => m.academicUnit).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [monographs]
  );

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          monographs
            .filter(
              (m) =>
                selectedAcademicUnit === 'all' || m.academicUnit === selectedAcademicUnit
            )
            .map((m) => m.subject)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [monographs, selectedAcademicUnit]
  );

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

  // Búsqueda e indexación por:
  // Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura y Unidad académica
  const filteredMonographs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return monographs
      .filter((m) => {
        if (selectedAcademicUnit !== 'all' && m.academicUnit !== selectedAcademicUnit)
          return false;
        if (selectedSubject !== 'all' && m.subject !== selectedSubject) return false;
        if (selectedAcademicYear !== 'all' && m.academicYear !== selectedAcademicYear)
          return false;
        if (selectedAuthor !== 'all' && m.author !== selectedAuthor) return false;

        if (!q) return true;

        const searchableFields = [
          m.fileName,
          m.title,
          m.author,
          m.academicYear,
          m.subject,
          m.academicUnit,
        ]
          .join(' ')
          .toLowerCase();

        return searchableFields.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'file') return a.fileName.localeCompare(b.fileName, 'es');
        if (sortBy === 'author') return a.author.localeCompare(b.author, 'es');
        if (sortBy === 'year') return b.academicYear.localeCompare(a.academicYear, 'es');
        return a.title.localeCompare(b.title, 'es');
      });
  }, [
    monographs,
    searchQuery,
    selectedAcademicUnit,
    selectedSubject,
    selectedAcademicYear,
    selectedAuthor,
    sortBy,
  ]);

  // Vista Previa de 3 Monografías por página
  const ITEMS_PER_VIEW = 3;
  const totalPages = Math.max(1, Math.ceil(filteredMonographs.length / ITEMS_PER_VIEW));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const threePreviewMonographs = filteredMonographs.slice(
    safePageIndex * ITEMS_PER_VIEW,
    safePageIndex * ITEMS_PER_VIEW + ITEMS_PER_VIEW
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAcademicUnit('all');
    setSelectedSubject('all');
    setSelectedAcademicYear('all');
    setSelectedAuthor('all');
    setPageIndex(0);
  };

  // ============================================================================
  // PANTALLA DE CONTROL DE ACCESO: SOLO USUARIOS EN LA HOJA "USUARIOS"
  // (Curso, Sección, Nombre y Apellido, Correo institucional, Perfil)
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-6 space-y-6">
        <div className="bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] rounded-2xl p-6 sm:p-8 text-white border border-violet-800/40 shadow-md space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Acceso Exclusivo · Hoja &ldquo;usuarios&rdquo; Colegio Ekirayá</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Repositorio de Monografías — Unidades Académicas
            </h1>
            <p className="text-violet-100/90 text-sm leading-relaxed">
              El acceso al repositorio está habilitado únicamente para los{' '}
              <strong>estudiantes, docentes, personal de no clases y administradores</strong>{' '}
              registrados en la hoja <code>usuarios</code> (
              <em>Curso, Sección, Nombre y Apellido, Correo institucional, Perfil</em>).
            </p>
          </div>

          <form
            onSubmit={handleLoginWithUsersSheet}
            className="bg-white rounded-xl p-5 text-slate-900 space-y-4 shadow-sm"
          >
            <div>
              <label
                htmlFor="repoUserEmail"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5"
              >
                Correo institucional registrado en la hoja &ldquo;usuarios&rdquo;
              </label>
              <input
                id="repoUserEmail"
                type="email"
                value={loginEmailInput}
                onChange={(e) => {
                  setLoginEmailInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="ejemplo: mebolanos@cem.edu.co"
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-600"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                Para configurar por primera vez como administrador ingresa{' '}
                <code>mebolanos@cem.edu.co</code>.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Ingresar al Repositorio</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.isAdmin;

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DEL REPOSITORIO CON PERFIL VALIDADO DESDE LA HOJA "USUARIOS" */}
      <div className="bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] rounded-2xl p-6 sm:p-8 text-white border border-violet-800/40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-violet-200" />
              <span>Carpeta: Unidades Académicas ({DRIVE_ROOT_FOLDER_ID})</span>
              <span aria-hidden="true">·</span>
              <span>Perfil: {currentUser.perfil}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Repositorio de Monografías — Unidades Académicas
            </h1>
            <p className="text-violet-100/90 text-sm sm:text-base leading-relaxed">
              Búsqueda e indexación por{' '}
              <strong>
                nombre del archivo, título de la monografía, autor, año lectivo, asignatura y
                unidad académica
              </strong>
              .
            </p>
          </div>

          {/* SOLO EL PERFIL ADMINISTRADOR VE EL ACCESO A LA SECCIÓN ADMINISTRATIVA */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs ${
                  showAdminPanel
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white text-violet-950 hover:bg-violet-50'
                }`}
              >
                <Settings className="w-4 h-4 text-violet-700" />
                <span>
                  {showAdminPanel
                    ? 'Ocultar Sección de Administrador'
                    : 'Abrir Sección de Administrador'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogoutUser}
              className="px-4 py-2 rounded-xl bg-violet-900/60 hover:bg-violet-900 text-violet-100 border border-violet-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cambiar de usuario / Salir</span>
            </button>
          </div>
        </div>

        {/* DATOS DEL USUARIO AUTENTICADO SEGÚN LA HOJA "USUARIOS" */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">
              <Unlock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Nombre y Apellido: {currentUser.nombres}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Curso:</strong> {currentUser.curso}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Sección:</strong> {currentUser.seccion}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Perfil:</strong> {currentUser.perfil}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100 font-mono">
              {currentUser.correo}
            </span>
          </div>

          {isAdmin && lastSyncDate && (
            <span className="text-violet-200">
              Última sincronización Sheets: {lastSyncDate}
            </span>
          )}
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
                  Panel Administrativo · Sincronización Carpeta Drive ↔ Google Sheets y Hoja
                  &ldquo;usuarios&rdquo;
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

          {/* 1. CONEXIÓN CON EL ARCHIVO DE GOOGLE SHEETS / WEB APP APPS SCRIPT */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-700" />
              <span>
                1. Sincronizar Google Sheets (Pestaña &ldquo;Repositorio&rdquo; y Pestaña
                &ldquo;usuarios&rdquo;)
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pega aquí la URL de tu <strong>Google Sheet</strong> o la URL <code>/exec</code> del{' '}
              <strong>Google Apps Script</strong> desplegado en tu hoja. El sistema sincronizará
              automáticamente las monografías de la carpeta{' '}
              <code>1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC</code> y la hoja <code>usuarios</code> con
              las columnas{' '}
              <strong>
                Curso, Sección, Nombre y Apellido, Correo institucional, Perfil
              </strong>
              :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL de tu Google Sheet o Web App de Apps Script (/exec)
                </label>
                <input
                  type="url"
                  value={connectionUrl}
                  onChange={(e) => setConnectionUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/... o https://script.google.com/..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL específica de la pestaña &ldquo;usuarios&rdquo; (Opcional)
                </label>
                <input
                  type="url"
                  value={usersSheetUrl}
                  onChange={(e) => setUsersSheetUrl(e.target.value)}
                  placeholder="Si está en el mismo archivo se detecta sola"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Token Institucional
                </label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EKIRAYA-2026"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Reconoce las columnas de usuarios:{' '}
                <strong>Curso · Sección · Nombre y Apellido · Correo institucional · Perfil</strong>
              </span>

              <button
                type="button"
                onClick={handleSyncRepositoryAndUsers}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Sincronizando con Sheets...' : 'Sincronizar Ahora con Sheets'}
                </span>
              </button>
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

          {/* 3. TABLA DE LA HOJA "USUARIOS" (CURSO, SECCIÓN, NOMBRE Y APELLIDO, CORREO INSTITUCIONAL, PERFIL) */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-700" />
                <span>
                  3. Hoja &ldquo;usuarios&rdquo; Sincronizada ({authorizedUsers.length} usuarios con
                  acceso)
                </span>
              </h3>
              <span className="text-xs text-slate-500">
                Columnas: Curso · Sección · Nombre y Apellido · Correo institucional · Perfil
              </span>
            </div>

            {/* Formulario rápido con las 5 columnas exactas de la hoja del usuario */}
            <form
              onSubmit={handleAddAuthorizedUserManually}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <input
                type="text"
                value={newUserCourse}
                onChange={(e) => setNewUserCourse(e.target.value)}
                placeholder="Curso (ej. 11°, Docente)"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
              />
              <input
                type="text"
                value={newUserSection}
                onChange={(e) => setNewUserSection(e.target.value)}
                placeholder="Sección (ej. Bachillerato)"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
              />
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nombre y Apellido"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
              />
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Correo institucional"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
              />
              <select
                value={newUserProfile}
                onChange={(e) => setNewUserProfile(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Docente">Docente</option>
                <option value="Personal no clases">Personal no clases</option>
                <option value="Administrador">Administrador</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-semibold"
              >
                + Añadir Usuario
              </button>
            </form>

            <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Curso</th>
                    <th className="py-2 px-3 font-semibold">Sección</th>
                    <th className="py-2 px-3 font-semibold">Nombre y Apellido</th>
                    <th className="py-2 px-3 font-semibold">Correo institucional</th>
                    <th className="py-2 px-3 font-semibold">Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {authorizedUsers.map((u) => (
                    <tr key={u.correo} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{u.curso}</td>
                      <td className="py-2 px-3 text-slate-600">{u.seccion}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{u.nombres}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{u.correo}</td>
                      <td className="py-2 px-3">
                        {u.isAdmin ? (
                          <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-900 font-semibold">
                            {u.perfil} (Admin)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {u.perfil}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. CÓDIGO GOOGLE APPS SCRIPT COMPLETO EN EL PERFIL ADMINISTRATIVO */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Code2 className="w-4 h-4 text-violet-700" />
                <span>
                  4. Código Google Apps Script Actualizado (Sincroniza Carpeta Drive ↔ Hoja
                  &ldquo;Repositorio&rdquo; y Hoja &ldquo;usuarios&rdquo;)
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
            <p className="text-xs text-slate-600">
              Pega este código en <strong>Extensiones → Apps Script</strong> dentro de tu archivo de
              Google Sheets y ejecuta <code>sincronizarUnidadesAcademicas</code> para llenar
              automáticamente la hoja con los archivos de la carpeta{' '}
              <code>1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC</code>:
            </p>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        </section>
      )}

      {/* =========================================================================
          FORMULARIO DE FILTRO Y BÚSQUEDA (INCLUYE UNIDAD ACADÉMICA)
         ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Buscar por nombre del archivo, título de la monografía, autor, año lectivo, asignatura o unidad académica..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 bg-slate-50/60 focus:bg-white"
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

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-violet-700 shrink-0" />
            <label htmlFor="repoSortSelect" className="text-xs font-semibold text-slate-600">
              Ordenar por:
            </label>
            <select
              id="repoSortSelect"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'title' | 'author' | 'year' | 'file')
              }
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="title">Título de la monografía (A - Z)</option>
              <option value="file">Nombre del archivo (A - Z)</option>
              <option value="author">Autor (A - Z)</option>
              <option value="year">Año lectivo (Más reciente)</option>
            </select>
          </div>
        </div>

        {/* Selectores por Unidad académica, Asignatura, Año lectivo y Autor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Unidad Académica
            </label>
            <select
              value={selectedAcademicUnit}
              onChange={(e) => {
                setSelectedAcademicUnit(e.target.value);
                setSelectedSubject('all');
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas las unidades ({academicUnits.length})</option>
              {academicUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Asignatura
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas las asignaturas ({subjects.length})</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Año Lectivo
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los años lectivos ({academicYears.length})</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Autor / Estudiante
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los autores ({authors.length})</option>
              {authors.map((auth) => (
                <option key={auth} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-violet-700" />
            <span>
              Mostrando <strong>{threePreviewMonographs.length}</strong> en vista previa (de{' '}
              <strong>{filteredMonographs.length}</strong> resultados encontrados)
            </span>
          </div>

          {(searchQuery ||
            selectedAcademicUnit !== 'all' ||
            selectedSubject !== 'all' ||
            selectedAcademicYear !== 'all' ||
            selectedAuthor !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-violet-700 hover:text-violet-950 font-semibold underline"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
          VISTA PREVIA DE TRES MONOGRAFÍAS (NO LA LISTA DE DRIVE)
         ========================================================================= */}
      {filteredMonographs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron monografías con esos criterios de búsqueda
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Intenta buscar por otro nombre de archivo, título de monografía, autor, año lectivo,
            asignatura o unidad académica.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 transition-colors"
          >
            Ver las monografías disponibles
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Vista Previa de Monografías ({threePreviewMonographs.length})
              </h2>
              <p className="text-xs text-slate-500">
                Visualización de hasta 3 monografías simultáneas con su unidad académica,
                asignatura, autor y año lectivo.
              </p>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePageIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-violet-50 disabled:opacity-40 flex items-center gap-1"
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
                  className="px-3 py-1.5 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Siguientes 3</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {threePreviewMonographs.map((doc) => {
              const singlePreviewUrl = buildSingleDocPreviewUrl(
                doc.driveFileId,
                doc.driveUrl
              );

              return (
                <article
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 overflow-hidden flex flex-col justify-between shadow-2xs transition-all"
                >
                  {/* VISOR DE VISTA PREVIA DE LA MONOGRAFÍA */}
                  <div className="relative h-56 bg-slate-100 border-b border-slate-200 overflow-hidden">
                    {singlePreviewUrl ? (
                      <iframe
                        title={`Vista previa de ${doc.title}`}
                        src={singlePreviewUrl}
                        className="w-full h-full border-0 bg-white"
                      />
                    ) : (
                      <div className="w-full h-full p-5 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-violet-900 bg-violet-100 px-2 py-0.5 rounded">
                            {doc.academicUnit}
                          </span>
                          <span className="font-mono">{doc.format}</span>
                        </div>
                        <div className="my-auto px-2 py-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                            Colegio Ekirayá · {doc.subject}
                          </div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-3 leading-snug">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {doc.author} · {doc.academicYear}
                          </p>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-mono text-center">
                          {doc.fileName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* METADATOS DE LA MONOGRAFÍA */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                          <Building2 className="w-3 h-3 text-violet-700" />
                          <span>{doc.academicUnit}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          Año lectivo: {doc.academicYear}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">
                          Título de la monografía
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                          {doc.title}
                        </h3>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Asignatura:</span>
                          <span className="font-semibold text-slate-800 text-right">
                            {doc.subject}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Autor:</span>
                          <span className="font-semibold text-slate-900 flex items-center gap-1 text-right">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                            <span>{doc.author}</span>
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/70">
                          <span className="text-slate-500 block mb-0.5">Nombre del archivo:</span>
                          <span className="font-mono text-[11px] text-slate-700 flex items-center gap-1 break-all">
                            <FileText className="w-3 h-3 text-violet-700 shrink-0" />
                            <span>{doc.fileName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ampliar Vista Previa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCiteMonograph(doc)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
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
        </section>
      )}

      {/* =========================================================================
          MODAL DE VISTA PREVIA AMPLIADA DE LA MONOGRAFÍA SELECCIONADA
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#4C1D95] text-white flex flex-wrap items-center justify-between gap-3">
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
              <div>
                <strong>Autor:</strong> {previewDoc.author} · <strong>Unidad académica:</strong>{' '}
                {previewDoc.academicUnit} · <strong>Asignatura:</strong> {previewDoc.subject} ·{' '}
                <strong>Año lectivo:</strong> {previewDoc.academicYear}
              </div>
              <span className="font-mono text-[11px] text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                {previewDoc.fileName}
              </span>
            </div>

            <div className="flex-1 bg-slate-50 relative">
              {buildSingleDocPreviewUrl(previewDoc.driveFileId, previewDoc.driveUrl) ? (
                <iframe
                  title={`Vista previa de ${previewDoc.fileName}`}
                  src={buildSingleDocPreviewUrl(previewDoc.driveFileId, previewDoc.driveUrl)!}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <FileText className="w-12 h-12 text-violet-700" />
                  <div className="max-w-lg space-y-2">
                    <h4 className="text-base font-bold text-slate-900">{previewDoc.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Autor: <strong>{previewDoc.author}</strong> · Unidad académica:{' '}
                      <strong>{previewDoc.academicUnit}</strong> · Asignatura:{' '}
                      <strong>{previewDoc.subject}</strong> ({previewDoc.academicYear})
                    </p>
                  </div>
                  <a
                    href={previewDoc.driveUrl || DRIVE_ROOT_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <span>Abrir documento directamente en Google Drive</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
