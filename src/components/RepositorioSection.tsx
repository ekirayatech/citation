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

const STORAGE_REPO_CONFIG_KEY = 'ekiraya_repo_unidades_academicas_v5';
const STORAGE_AUTH_USER_KEY = 'ekiraya_repo_authorized_user_v5';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Administrador inicial para que puedas entrar al Panel Administrativo antes de conectar la hoja
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

export const APPS_SCRIPT_CODE = `/**
 * COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI — CITA MASTER
 * Script Bidireccional (Google Drive <-> Google Sheets <-> Cita Master)
 * Carpeta "Unidades académicas": 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC
 *
 * Funcionalidades:
 * 1) Lee y sincroniza la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC en la pestaña "Repositorio"
 *    SIN sobrescribir los cambios manuales que hagas en Google Sheets.
 * 2) Programa un activador (Trigger) automático cada 24 horas.
 * 3) Permite crear usuarios desde Cita Master directamente en la pestaña "usuarios"
 *    (Curso | Sección | Nombre y Apellido | Correo institucional | Perfil).
 * 4) Entrega en tiempo real cualquier cambio manual hecho en Google Sheets.
 */

const ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const REPO_SHEET_NAME = 'Repositorio';
const USERS_SHEET_NAME = 'usuarios';
const INSTITUTIONAL_TOKEN = 'EKIRAYA-2026';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('🔄 Sincronizar carpeta Unidades Académicas ahora', 'sincronizarUnidadesAcademicas')
    .addItem('⏰ Activar sincronización automática cada 24 horas', 'configurarTrigger24Horas')
    .addItem('👥 Verificar estructura hoja usuarios', 'inicializarHojaUsuarios')
    .addToUi();
}

/**
 * Configura el activador automático en Google Apps Script para que se ejecute cada 24 horas
 */
function configurarTrigger24Horas() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sincronizarUnidadesAcademicas') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('sincronizarUnidadesAcademicas')
    .timeBased()
    .everyDays(1)
    .create();
}

/**
 * Obtiene o crea la pestaña "usuarios" con las columnas exactas:
 * Curso | Sección | Nombre y Apellido | Correo institucional | Perfil
 */
function obtenerOCrearHojaUsuarios() {
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

  // Buscar si alguna hoja existente ya tiene estas columnas
  if (!userSheet) {
    const all = ss.getSheets();
    for (let i = 0; i < all.length; i++) {
      if (all[i].getLastRow() > 0) {
        const row1 = all[i].getRange(1, 1, 1, Math.max(1, all[i].getLastColumn())).getDisplayValues()[0].join(' ').toLowerCase();
        if (row1.includes('correo institucional') || row1.includes('nombre y apellido')) {
          userSheet = all[i];
          break;
        }
      }
    }
  }

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

  return userSheet;
}

function inicializarHojaUsuarios() {
  obtenerOCrearHojaUsuarios();
}

/**
 * Agrega o actualiza un usuario en la hoja "usuarios" cuando se crea desde Cita Master
 */
function agregarUsuarioEnSheet(params) {
  const userSheet = obtenerOCrearHojaUsuarios();
  const data = userSheet.getDataRange().getDisplayValues();
  const headers = data[0].map(function(h) { return String(h).trim(); });

  const correoNuevo = String(params.correo || '').trim().toLowerCase();
  if (!correoNuevo) return;

  let correoColIdx = headers.findIndex(function(h) { return /correo|email|mail/i.test(h); });
  if (correoColIdx < 0) correoColIdx = 3;

  // Construir fila según el orden real de los títulos de columna en la hoja usuarios
  const nuevaFila = headers.map(function(h) {
    const k = h.toLowerCase();
    if (k.includes('curso') || k.includes('grado')) return params.curso || '';
    if (k.includes('sección') || k.includes('seccion')) return params.seccion || '';
    if (k.includes('nombre')) return params.nombres || '';
    if (k.includes('correo') || k.includes('email')) return correoNuevo;
    if (k.includes('perfil') || k.includes('rol')) return params.perfil || 'Estudiante';
    return '';
  });

  // Si el correo ya existe en alguna fila, actualiza esa fila; si no, inserta una nueva
  for (let r = 1; r < data.length; r++) {
    const correoExistente = String(data[r][correoColIdx] || '').trim().toLowerCase();
    if (correoExistente === correoNuevo) {
      userSheet.getRange(r + 1, 1, 1, nuevaFila.length).setValues([nuevaFila]);
      return;
    }
  }

  userSheet.appendRow(nuevaFila);
}

/**
 * Recorre recursivamente la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC ("Unidades académicas").
 * Respeta todos los cambios manuales hechos en Google Sheets (solo agrega archivos nuevos que no estén por ID/URL).
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

  const repoData = sheet.getDataRange().getDisplayValues();
  const repoHeaders = repoData[0].map(function(h) { return String(h).trim(); });

  let idColIdx = repoHeaders.findIndex(function(h) { return /^id|id del archivo|id_archivo/i.test(h); });
  let urlColIdx = repoHeaders.findIndex(function(h) { return /enlace|url|link|drive/i.test(h); });
  let nameColIdx = repoHeaders.findIndex(function(h) { return /nombre del archivo|archivo|file/i.test(h); });

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
  obtenerOCrearHojaUsuarios();
}

function recorrerCarpetasDrive(folder, pathParts, sheet, headers, existingKeys) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileName = file.getName();

    // Si ya existe en Google Sheets, NO lo sobrescribe para conservar cambios manuales
    if (existingKeys.has(fileId) || existingKeys.has(fileUrl) || existingKeys.has(fileName)) continue;

    const cleanTitle = fileName
      .replace(/\\.(pdf|docx|doc)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    const unidadAcademica = pathParts.length > 0 ? pathParts[0] : folder.getName();
    const asignatura = pathParts.length > 1 ? pathParts[1] : unidadAcademica;
    const autor = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Estudiante Grado 11';
    const anioLectivo = String(new Date(file.getDateCreated()).getFullYear());

    const newRow = headers.map(function(headerName) {
      const h = headerName.toLowerCase();
      if (h.includes('archivo') && !h.includes('id')) return fileName;
      if (h.includes('título') || h.includes('titulo') || h.includes('monografía') || h.includes('monografia')) return cleanTitle;
      if (h.includes('autor') || h.includes('estudiante')) return autor;
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
 * Endpoint Web App (GET/POST):
 * - Si recibe action=addUser, guarda el usuario en la pestaña "usuarios" de Google Sheets.
 * - Si recibe action=syncDrive (o si la hoja Repositorio está vacía), sincroniza la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC.
 * - Devuelve las filas actuales de "Repositorio" y "usuarios" respetando cualquier edición manual en Sheets.
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const tokenParam = params.token || '';
  if (INSTITUTIONAL_TOKEN && tokenParam && tokenParam !== INSTITUTIONAL_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Token no válido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.action === 'addUser') {
    agregarUsuarioEnSheet(params);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let repoSheet = ss.getSheetByName(REPO_SHEET_NAME);

  if (params.action === 'syncDrive' || !repoSheet || repoSheet.getLastRow() <= 1) {
    try {
      sincronizarUnidadesAcademicas();
      repoSheet = ss.getSheetByName(REPO_SHEET_NAME);
    } catch (err) {
      // Continúa leyendo las hojas disponibles
    }
  }

  const allSheets = ss.getSheets();
  let usersSheet = obtenerOCrearHojaUsuarios();

  if (!repoSheet) {
    for (let i = 0; i < allSheets.length; i++) {
      const sh = allSheets[i];
      if (sh.getName() !== usersSheet.getName() && sh.getLastRow() > 0) {
        repoSheet = sh;
        break;
      }
    }
  }

  const repoData = leerHojaPorTitulos(repoSheet);
  const usersData = leerHojaPorTitulos(usersSheet);

  return ContentService.createTextOutput(JSON.stringify({
    folderId: ROOT_FOLDER_ID,
    syncedAt: new Date().toISOString(),
    headers: repoData.headers,
    rows: repoData.rows,
    usuariosHeaders: usersData.headers,
    usuariosRows: usersData.rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return doGet(e);
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

  if (!parsedUsers.some((u) => u.correo === 'mebolanos@cem.edu.co')) {
    parsedUsers.push(DEFAULT_AUTHORIZED_USERS[0]);
  }

  return parsedUsers;
}

/** Convierte las filas reales de la hoja del Repositorio en documentos incluyendo Unidad académica */
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
        '';

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
        (mapping.academicYearCol && row[mapping.academicYearCol]) || 'Sin año lectivo';

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
        fileName: fileNameVal || titleVal,
        title: titleVal,
        author: authorVal || 'Autor sin especificar',
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
  // Datos reales del Repositorio (sin monografías de muestra ficticias)
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

  // Paginación de la Vista Previa de 3 Monografías Reales (muestra de 3 en 3)
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Modal de vista previa en pantalla completa
  const [previewDoc, setPreviewDoc] = useState<MonographDocument | null>(null);

  // Sección exclusiva de Administrador
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [usersSheetUrl, setUsersSheetUrl] = useState<string>('');
  const [repoTabName, setRepoTabName] = useState<string>('Repositorio');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Campos para crear usuario y enviarlo a la hoja "usuarios" de Google Sheets
  const [newUserCourse, setNewUserCourse] = useState('');
  const [newUserSection, setNewUserSection] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserProfile, setNewUserProfile] = useState('Estudiante');

  /**
   * Función central de sincronización con Google Sheets / Google Apps Script
   * - Si forceDriveSync = true y está conectado a Apps Script (/exec), también escanea la carpeta Drive 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC.
   * - Siempre usa cache: 'no-store' y un parámetro de tiempo para leer al instante cualquier cambio manual en Google Sheets.
   */
  const executeSyncWithSheets = useCallback(
    async (
      targetConnectionUrl: string,
      targetUsersUrl: string,
      targetToken: string,
      targetTabName: string,
      options?: { silent?: boolean; triggerDriveScan?: boolean }
    ) => {
      const cleanUrl = targetConnectionUrl.trim();
      const cleanUsersUrl = targetUsersUrl.trim();

      if (!cleanUrl && !cleanUsersUrl) {
        if (!options?.silent) {
          showToast('Pega la URL de tu Web App de Apps Script o el enlace de tu Google Sheet');
        }
        return;
      }

      setIsSyncing(true);
      try {
        let headers: string[] = [];
        let rows: Record<string, string>[] = [];
        let loadedUsers: AuthorizedSchoolUser[] = [];
        const cacheBuster = `_t=${Date.now()}`;

        const primaryUrl = cleanUrl || cleanUsersUrl;
        const sheetIdMatch = primaryUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);

        if (sheetIdMatch?.[1]) {
          // MODO ENLACE DIRECTO DE GOOGLE SHEETS
          const sheetId = sheetIdMatch[1];
          const gidMatch = primaryUrl.match(/[#&?]gid=(\d+)/);

          // 1. Leer la pestaña del enlace principal
          const primaryCsvUrl = gidMatch?.[1]
            ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gidMatch[1]}&${cacheBuster}`
            : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&${cacheBuster}`;

          const resp = await fetch(primaryCsvUrl, { cache: 'no-store' });
          if (!resp.ok) {
            throw new Error('No se pudo leer el Google Sheet.');
          }
          const csvText = await resp.text();
          const parsedPrimary = parseCsvToRows(csvText);

          if (isUsersSheetHeaders(parsedPrimary.headers)) {
            loadedUsers = parseUsersSheetRows(parsedPrimary.rows, parsedPrimary.headers);
          } else {
            headers = parsedPrimary.headers;
            rows = parsedPrimary.rows;
          }

          // 2. Si aún no tenemos las filas de monografías, buscar en los nombres de pestaña posibles del mismo Sheet
          if (rows.length === 0) {
            const candidateTabs = Array.from(
              new Set([
                targetTabName.trim() || 'Repositorio',
                'Repositorio',
                'Unidades académicas',
                'Unidades Académicas',
                'Monografías',
                'Monografias',
                'Hoja 1',
              ])
            );

            for (const tabName of candidateTabs) {
              try {
                const candidateUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
                  tabName
                )}&${cacheBuster}`;
                const tabResp = await fetch(candidateUrl, { cache: 'no-store' });
                if (tabResp.ok) {
                  const tabCsv = await tabResp.text();
                  const parsedTab = parseCsvToRows(tabCsv);
                  if (
                    parsedTab.headers.length > 0 &&
                    !isUsersSheetHeaders(parsedTab.headers) &&
                    parsedTab.rows.length > 0
                  ) {
                    headers = parsedTab.headers;
                    rows = parsedTab.rows;
                    break;
                  }
                }
              } catch {
                // Intentar siguiente nombre de pestaña
              }
            }
          }

          // 3. Leer siempre la pestaña "usuarios" para traer cualquier cambio manual de usuarios
          const targetUsersSheetId =
            cleanUsersUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] || sheetId;
          const usersGidMatch = cleanUsersUrl.match(/[#&?]gid=(\d+)/);
          const usersCsvEndpoint = usersGidMatch?.[1]
            ? `https://docs.google.com/spreadsheets/d/${targetUsersSheetId}/gviz/tq?tqx=out:csv&gid=${usersGidMatch[1]}&${cacheBuster}`
            : `https://docs.google.com/spreadsheets/d/${targetUsersSheetId}/gviz/tq?tqx=out:csv&sheet=usuarios&${cacheBuster}`;

          try {
            const usersResp = await fetch(usersCsvEndpoint, { cache: 'no-store' });
            if (usersResp.ok) {
              const usersCsv = await usersResp.text();
              const parsedUsersSheet = parseCsvToRows(usersCsv);
              if (
                isUsersSheetHeaders(parsedUsersSheet.headers) ||
                parsedUsersSheet.rows.length > 0
              ) {
                loadedUsers = parseUsersSheetRows(
                  parsedUsersSheet.rows,
                  parsedUsersSheet.headers
                );
              }
            }
          } catch {
            // Mantiene loadedUsers si ya se leyó
          }
        } else {
          // MODO WEB APP DE GOOGLE APPS SCRIPT (/exec) — LECTURA Y ESCRITURA BIDIRECCIONAL
          const separator = primaryUrl.includes('?') ? '&' : '?';
          const actionParam = options?.triggerDriveScan ? '&action=syncDrive' : '';
          const tokenParam = targetToken.trim()
            ? `&token=${encodeURIComponent(targetToken.trim())}`
            : '';
          const requestUrl = `${primaryUrl}${separator}${cacheBuster}${tokenParam}${actionParam}`;

          const resp = await fetch(requestUrl, { cache: 'no-store' });
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
            loadedUsers = parseUsersSheetRows(data.usuariosRows, data.usuariosHeaders);
          }
        }

        const finalUsers =
          loadedUsers.length > 0 ? loadedUsers : authorizedUsers;
        const detectedMapping =
          headers.length > 0 ? autoDetectColumnMapping(headers) : columnMapping;
        const nowStr = new Date().toLocaleString('es-CO');
        const nowTs = Date.now();

        setRawHeaders(headers);
        setRawRows(rows);
        setColumnMapping(detectedMapping);
        setAuthorizedUsers(finalUsers);
        setLastSyncDate(nowStr);
        setLastSyncTimestamp(nowTs);
        setPageIndex(0);

        setCurrentUser((prevUser) => {
          if (!prevUser) return null;
          const refreshed = finalUsers.find(
            (u) => u.correo.toLowerCase() === prevUser.correo.toLowerCase()
          );
          if (refreshed) {
            try {
              localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(refreshed));
            } catch {
              // Ignore
            }
            return refreshed;
          }
          return prevUser;
        });

        localStorage.setItem(
          STORAGE_REPO_CONFIG_KEY,
          JSON.stringify({
            connectionUrl: cleanUrl,
            usersSheetUrl: cleanUsersUrl,
            repoTabName: targetTabName,
            accessToken: targetToken.trim(),
            lastSyncDate: nowStr,
            lastSyncTimestamp: nowTs,
            rawHeaders: headers,
            rawRows: rows,
            columnMapping: detectedMapping,
            authorizedUsers: finalUsers,
          })
        );

        if (!options?.silent) {
          showToast(
            `Sincronizado con Google Sheets: ${rows.length} monografías reales y ${finalUsers.length} usuarios.`
          );
        }
      } catch {
        if (!options?.silent) {
          showToast(
            'No se pudo sincronizar con Google Sheets. Verifica la URL Web App (/exec) o los permisos de lectura de la hoja.'
          );
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [authorizedUsers, columnMapping, showToast]
  );

  // Cargar configuración inicial y ejecutar sincronización automática (al iniciar si han pasado >= 24h o en segundo plano)
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      let loadedUsers = DEFAULT_AUTHORIZED_USERS;
      let savedUrl = '';
      let savedUsersUrl = '';
      let savedToken = 'EKIRAYA-2026';
      let savedTab = 'Repositorio';
      let savedTs = 0;

      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig?.connectionUrl) {
          savedUrl = parsedConfig.connectionUrl;
          setConnectionUrl(savedUrl);
        }
        if (parsedConfig?.usersSheetUrl) {
          savedUsersUrl = parsedConfig.usersSheetUrl;
          setUsersSheetUrl(savedUsersUrl);
        }
        if (parsedConfig?.repoTabName) {
          savedTab = parsedConfig.repoTabName;
          setRepoTabName(savedTab);
        }
        if (parsedConfig?.accessToken) {
          savedToken = parsedConfig.accessToken;
          setAccessToken(savedToken);
        }
        if (parsedConfig?.lastSyncDate) setLastSyncDate(parsedConfig.lastSyncDate);
        if (parsedConfig?.lastSyncTimestamp) {
          savedTs = Number(parsedConfig.lastSyncTimestamp) || 0;
          setLastSyncTimestamp(savedTs);
        }
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

      // Si hay una URL de Google Sheets / Apps Script configurada, sincronizar automáticamente al abrir para reflejar cambios manuales en Sheets
      if (savedUrl || savedUsersUrl) {
        const shouldScanDrive = Date.now() - savedTs >= TWENTY_FOUR_HOURS_MS;
        executeSyncWithSheets(savedUrl, savedUsersUrl, savedToken, savedTab, {
          silent: true,
          triggerDriveScan: shouldScanDrive,
        });
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intervalo automático cada 24 horas mientras la aplicación esté abierta
  useEffect(() => {
    if (!connectionUrl && !usersSheetUrl) return;
    const intervalId = window.setInterval(() => {
      executeSyncWithSheets(connectionUrl, usersSheetUrl, accessToken, repoTabName, {
        silent: true,
        triggerDriveScan: true,
      });
    }, TWENTY_FOUR_HOURS_MS);

    return () => window.clearInterval(intervalId);
  }, [connectionUrl, usersSheetUrl, accessToken, repoTabName, executeSyncWithSheets]);

  // Lista de monografías: ÚNICAMENTE las filas reales sincronizadas de la hoja de Google Sheets
  const monographs: MonographDocument[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return mapSheetRowsToMonographs(rawRows, columnMapping, rawHeaders);
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

  /**
   * Crea un usuario desde Cita Master y lo sincroniza directamente en la pestaña "usuarios" de Google Sheets
   * a través del endpoint Web App de Google Apps Script (action=addUser).
   */
  const handleAddAuthorizedUserAndSyncToSheet = async (e: React.FormEvent) => {
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

    setIsSavingUser(true);
    try {
      const cleanScriptUrl = connectionUrl.trim();
      const isAppsScriptWebApp = cleanScriptUrl.includes('script.google.com');

      if (isAppsScriptWebApp) {
        const separator = cleanScriptUrl.includes('?') ? '&' : '?';
        const query = new URLSearchParams({
          action: 'addUser',
          token: accessToken.trim(),
          curso: newUser.curso,
          seccion: newUser.seccion,
          nombres: newUser.nombres,
          correo: newUser.correo,
          perfil: newUser.perfil,
          _t: String(Date.now()),
        });

        const resp = await fetch(`${cleanScriptUrl}${separator}${query.toString()}`, {
          cache: 'no-store',
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();
        if (Array.isArray(data?.usuariosRows) && Array.isArray(data?.usuariosHeaders)) {
          const syncedUsers = parseUsersSheetRows(data.usuariosRows, data.usuariosHeaders);
          setAuthorizedUsers(syncedUsers);

          const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
          const parsed = savedConfig ? JSON.parse(savedConfig) : {};
          localStorage.setItem(
            STORAGE_REPO_CONFIG_KEY,
            JSON.stringify({
              ...parsed,
              authorizedUsers: syncedUsers,
              lastSyncDate: new Date().toLocaleString('es-CO'),
              lastSyncTimestamp: Date.now(),
            })
          );
        }
        showToast(
          `¡Usuario "${newUser.nombres}" guardado y sincronizado en la hoja "usuarios" de Google Sheets!`
        );
      } else {
        // Si solo puso el enlace de solo lectura de Google Sheets y no la URL /exec de Apps Script
        const updatedUsers = [
          ...authorizedUsers.filter((u) => u.correo.toLowerCase() !== cleanMail),
          newUser,
        ];
        setAuthorizedUsers(updatedUsers);
        const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
        const parsed = savedConfig ? JSON.parse(savedConfig) : {};
        localStorage.setItem(
          STORAGE_REPO_CONFIG_KEY,
          JSON.stringify({
            ...parsed,
            authorizedUsers: updatedUsers,
          })
        );
        showToast(
          'Usuario guardado en Cita Master. Para escribir filas en Google Sheets, conecta la URL Web App (/exec) de Apps Script.'
        );
      }

      setNewUserCourse('');
      setNewUserSection('');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserProfile('Estudiante');
    } catch {
      showToast(
        'No se pudo escribir en la hoja de Google Sheets. Verifica que tu Apps Script esté implementado como Aplicación Web (/exec).'
      );
    } finally {
      setIsSavingUser(false);
    }
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

  // Listas únicas dinámicas extraídas de las monografías reales sincronizadas
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

  // Vista Previa de 3 Monografías Reales por página
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
                Usuarios cargados desde Sheets: <strong>{authorizedUsers.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                {(connectionUrl || usersSheetUrl) && (
                  <button
                    type="button"
                    onClick={() =>
                      executeSyncWithSheets(
                        connectionUrl,
                        usersSheetUrl,
                        accessToken,
                        repoTabName,
                        { triggerDriveScan: false }
                      )
                    }
                    disabled={isSyncing}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Actualizar lista</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Ingresar al Repositorio</span>
                </button>
              </div>
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
              Búsqueda e indexación de los archivos reales del repositorio por{' '}
              <strong>
                nombre del archivo, título de la monografía, autor, año lectivo, asignatura y
                unidad académica
              </strong>
              .
            </p>
          </div>

          {/* CONTROLES DE SINCRONIZACIÓN Y SECCIÓN DE ADMINISTRADOR */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {isAdmin && (
              <>
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

                {(connectionUrl || usersSheetUrl) && (
                  <button
                    type="button"
                    onClick={() =>
                      executeSyncWithSheets(
                        connectionUrl,
                        usersSheetUrl,
                        accessToken,
                        repoTabName,
                        { triggerDriveScan: true }
                      )
                    }
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora con Sheets'}
                    </span>
                  </button>
                )}
              </>
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

          <div className="flex items-center gap-2 text-violet-200">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              Sincronización automática cada 24h activa
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

          {/* 1. CONEXIÓN CON EL ARCHIVO DE GOOGLE SHEETS / WEB APP APPS SCRIPT */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-700" />
              <span>
                1. Conexión con Google Apps Script Web App (/exec) o Google Sheets
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para que los <strong>usuarios que crees desde Cita Master se escriban en tu hoja de Google Sheets</strong> y para que las monografías reales de la carpeta{' '}
              <code>1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC</code> se sincronicen automáticamente cada 24
              horas (respetando tus cambios manuales en la hoja), pega la URL{' '}
              <code>https://script.google.com/macros/s/.../exec</code> de tu Apps Script:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Web App de Apps Script (/exec) o Enlace de Google Sheets
                </label>
                <input
                  type="url"
                  value={connectionUrl}
                  onChange={(e) => setConnectionUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la pestaña de Monografías en tu Sheet
                </label>
                <input
                  type="text"
                  value={repoTabName}
                  onChange={(e) => setRepoTabName(e.target.value)}
                  placeholder="Repositorio"
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
                Respeta ediciones manuales en Google Sheets · Sincroniza cada 24h o manualmente con
                el botón.
              </span>

              <button
                type="button"
                onClick={() =>
                  executeSyncWithSheets(
                    connectionUrl,
                    usersSheetUrl,
                    accessToken,
                    repoTabName,
                    { triggerDriveScan: true }
                  )
                }
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Sincronizando carpeta y hojas...'
                    : 'Sincronizar Ahora (Drive ↔ Sheets ↔ Cita Master)'}
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

          {/* 3. TABLA DE LA HOJA "USUARIOS" CON ESCRITURA DIRECTA EN GOOGLE SHEETS */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-700" />
                <span>
                  3. Hoja &ldquo;usuarios&rdquo; ({authorizedUsers.length} usuarios registrados)
                </span>
              </h3>
              <span className="text-xs text-slate-500">
                Al agregar un usuario aquí, se escribe en la hoja &ldquo;usuarios&rdquo; de Google
                Sheets (requiere URL /exec de Apps Script)
              </span>
            </div>

            <form
              onSubmit={handleAddAuthorizedUserAndSyncToSheet}
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
                disabled={isSavingUser}
                className="px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white font-semibold"
              >
                {isSavingUser ? 'Guardando en Sheet...' : '+ Guardar en Sheets'}
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
                  4. Código Google Apps Script Actualizado (Guarda usuarios creados en Cita Master +
                  Sincroniza cada 24h)
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
            <p className="text-xs text-slate-600 leading-relaxed">
              Importante: Después de pegar este nuevo código en{' '}
              <strong>Extensiones → Apps Script</strong>, haz clic en{' '}
              <strong>Implementar → Gestionar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar</strong>{' '}
              para que quede activo el guardado de usuarios y el trigger de 24 horas:
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
              <strong>{filteredMonographs.length}</strong> monografías reales sincronizadas)
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
          VISTA PREVIA DE 3 MONOGRAFÍAS REALES SINCRONIZADAS DEL REPOSITORIO
         ========================================================================= */}
      {monographs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-4">
          <Database className="w-10 h-10 text-violet-700 mx-auto" />
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Aún no se han cargado las monografías desde tu Google Sheet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Se han eliminado todas las monografías de ejemplo para mostrar{' '}
              <strong>únicamente los documentos reales</strong> de tu carpeta{' '}
              <code>1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC</code> (<em>Unidades académicas</em>).
              {isAdmin
                ? ' Haz clic en el botón inferior para abrir el Panel Administrativo, pegar la URL de tu Apps Script (/exec) o Google Sheet y sincronizar las monografías reales.'
                : ' Solicita al administrador sincronizar el repositorio con Google Sheets.'}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminPanel(true)}
              className="px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Abrir Panel Administrativo y Sincronizar</span>
            </button>
          )}
        </div>
      ) : filteredMonographs.length === 0 ? (
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
            Mostrar todas las monografías ({monographs.length})
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Vista Previa de 3 Monografías del Repositorio ({threePreviewMonographs.length} de{' '}
                {filteredMonographs.length})
              </h2>
              <p className="text-xs text-slate-500">
                Visualización directa de los archivos reales almacenados en la carpeta Unidades
                académicas y sincronizados con Google Sheets.
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
                  {/* VISOR DE VISTA PREVIA DEL ARCHIVO REAL */}
                  <div className="relative h-60 bg-slate-100 border-b border-slate-200 overflow-hidden">
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
                        <div className="my-auto px-3 py-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                            {doc.subject}
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
