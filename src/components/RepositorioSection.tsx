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
  Upload,
  Download,
} from 'lucide-react';
import { CitationFormData } from '../types/citation';
import {
  AuthorizedSchoolUser,
  DEFAULT_AUTHORIZED_USERS,
  DEFAULT_REPO_HEADERS,
  DEFAULT_REPO_ROWS,
  DEFAULT_USUARIOS_HEADERS,
} from '../data/repositorioDefaultData';

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
}

const DRIVE_ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
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

export const APPS_SCRIPT_CODE = `/**
 * COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI — CITA MASTER
 * Script Bidireccional (Google Drive <-> Google Sheets <-> Cita Master)
 * Carpeta "Unidades académicas": 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC
 *
 * Funcionalidades:
 * 1) Sincroniza la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC en la pestaña "Repositorio"
 *    respetando cualquier cambio manual que hagas en Google Sheets.
 * 2) Programa un activador (Trigger) automático cada 24 horas.
 * 3) Recibe usuarios creados desde Cita Master (vía GET o POST) y los escribe en la pestaña "usuarios"
 *    (compatible con Curso | Sección | Nombre y Apellido | Correo institucional | Perfil
 *     y con Nombres | Curso | Correo | Sección).
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

function obtenerOCrearHojaUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const all = ss.getSheets();
  let userSheet = null;

  for (let i = 0; i < all.length; i++) {
    const cleanName = all[i].getName().trim().toLowerCase();
    if (cleanName === 'usuarios' || cleanName === 'usuario') {
      userSheet = all[i];
      break;
    }
  }

  if (!userSheet) {
    for (let i = 0; i < all.length; i++) {
      if (all[i].getLastRow() > 0) {
        const row1 = all[i]
          .getRange(1, 1, 1, Math.max(1, all[i].getLastColumn()))
          .getDisplayValues()[0]
          .join(' ')
          .toLowerCase();
        if (
          row1.includes('correo') ||
          row1.includes('email') ||
          (row1.includes('curso') && row1.includes('sección')) ||
          (row1.includes('curso') && row1.includes('seccion'))
        ) {
          userSheet = all[i];
          break;
        }
      }
    }
  }

  const expectedUserHeaders = [
    'Nombres',
    'Curso',
    'Correo',
    'Sección',
    'Perfil'
  ];

  if (!userSheet) {
    userSheet = ss.insertSheet(USERS_SHEET_NAME);
    userSheet.appendRow(expectedUserHeaders);
    userSheet.getRange(1, 1, 1, expectedUserHeaders.length).setFontWeight('bold');
    poblarUsuariosInicialesEnHoja(userSheet);
  } else if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(expectedUserHeaders);
    userSheet.getRange(1, 1, 1, expectedUserHeaders.length).setFontWeight('bold');
    poblarUsuariosInicialesEnHoja(userSheet);
  }

  return userSheet;
}

function poblarUsuariosInicialesEnHoja(userSheet) {
  const initialUsers = [
    ['Coordinación Repositorio Ekirayá', 'Administrativo', 'mebolanos@cem.edu.co', 'Dirección Académica', 'Administrador'],
    ['Diego Nicolás Mancera', 'Docente', 'dmancera@cem.edu.co', 'Ciencias', 'Docente'],
    ['Camilo Almario Zea', 'Docente', 'calmario@cem.edu.co', 'Psicología y Ciencias Sociales', 'Docente'],
    ['Mauricio Lora Aguirre', 'Docente', 'mlora@cem.edu.co', 'Ciencias Sociales y Música', 'Docente'],
    ['Valentina Sarria Suárez', 'Docente', 'vsarria@cem.edu.co', 'Psicología', 'Docente'],
    ['Giovanna Rebolledo', 'Docente', 'grebolledo@cem.edu.co', 'Ciencias de la Salud', 'Docente'],
    ['Luis Fernando Huertas', 'Docente', 'lhuertas@cem.edu.co', 'Ciencias y Aviación', 'Docente'],
    ['Yenifer Hernández León', 'Docente', 'yhernandez@cem.edu.co', 'Salud Ocupacional', 'Docente'],
    ['Juliana León', 'Docente', 'jleon@cem.edu.co', 'Artes', 'Docente'],
    ['Pablo Forero', 'Docente', 'pforero@cem.edu.co', 'Arquitectura y Psicología', 'Docente'],
    ['John Alexander Aponte Peña', 'Docente', 'japonte@cem.edu.co', 'Ingeniería de Sistemas', 'Docente'],
    ['Jorge Mario Bernal', 'Docente', 'jbernal@cem.edu.co', 'Ciencias Económicas y Administrativas', 'Docente'],
    ['Cristina Crane', 'Docente', 'ccrane@cem.edu.co', 'Música', 'Docente'],
    ['Ricardo Umaña', 'Docente', 'rumana@cem.edu.co', 'Ciencias Sociales', 'Docente'],
    ['Maria Paula Ramos', 'Docente', 'mpramos@cem.edu.co', 'Administración', 'Docente'],
    ['Agudelo Gil Emilia', '11', 'eagudelo@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Camacho Tobón Mariana', '11', 'mcamacho@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Chica Navarro Mateo', '11', 'mchica@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Correa González Juan Andrés', '11', 'jcorrea@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Díaz García Isabela', '11', 'idiaz@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Donado Abella Salomé', '11', 'sdonado@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Duplat Rebolledo Camila', '11', 'cduplat@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Durán Sterling Santiago', '11', 'sduran@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Figueredo Zapata Lucas', '11', 'lfigueredo@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['González Pérez Lorenzo', '11', 'lgonzalez@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Jáuregui Cubillos Samuel', '11', 'sjauregui@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Maldonado Delgado Alejandra', '11', 'amaldonado@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Mejía De Valdenebro Úrsula', '11', 'umejia@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Perdigón Mejía Jacobo', '11', 'jperdigon@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Roldán Acosta Valentina', '11', 'vroldan@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Ruiz Bohórquez Mariana', '11', 'mruiz@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Torres Prada Catalina', '11', 'ctorres@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Tubi Medders Luka', '11', 'ltubi@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Vásquez Velásquez Nicolás', '11', 'nvasquez@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Vidal Herrera Violeta', '11', 'vvidal@cem.edu.co', 'Bachillerato', 'Estudiante'],
    ['Biblioteca y Centro de Recursos', 'No clases', 'biblioteca@cem.edu.co', 'Biblioteca', 'Personal no clases'],
    ['Secretaría Académica Ekirayá', 'No clases', 'secretaria@cem.edu.co', 'Administración', 'Personal no clases']
  ];
  userSheet.getRange(2, 1, initialUsers.length, 5).setValues(initialUsers);
}

function inicializarHojaUsuarios() {
  const sh = obtenerOCrearHojaUsuarios();
  if (sh.getLastRow() <= 2) {
    sh.clear();
    const headers = ['Nombres', 'Curso', 'Correo', 'Sección', 'Perfil'];
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    poblarUsuariosInicialesEnHoja(sh);
  }
}

function agregarUsuarioEnSheet(params) {
  const userSheet = obtenerOCrearHojaUsuarios();
  const data = userSheet.getDataRange().getDisplayValues();
  const headers = data[0].map(function(h) { return String(h).trim(); });

  let rawRowMap = {};
  if (params.rawRowJson) {
    try {
      rawRowMap = JSON.parse(params.rawRowJson);
    } catch (e) {}
  } else if (params.rawRow && typeof params.rawRow === 'object') {
    rawRowMap = params.rawRow;
  }

  const correoNuevo = String(
    params.correo || params.email || rawRowMap['Correo'] || rawRowMap['Correo institucional'] || ''
  ).trim().toLowerCase();
  if (!correoNuevo) return;

  let correoColIdx = headers.findIndex(function(h) { return /correo|email|mail|cuenta/i.test(h); });
  if (correoColIdx < 0) correoColIdx = 2;

  const nuevaFila = headers.map(function(h) {
    if (rawRowMap[h] !== undefined && String(rawRowMap[h]).trim() !== '') {
      return String(rawRowMap[h]).trim();
    }
    if (params[h] !== undefined && String(params[h]).trim() !== '') {
      return String(params[h]).trim();
    }
    const k = h.toLowerCase();
    if (k.includes('correo') || k.includes('email') || k.includes('mail')) return correoNuevo;
    if (k.includes('nombre') || k.includes('estudiante') || k.includes('usuario')) return params.nombres || params.nombre || '';
    if (k.includes('curso') || k.includes('grado') || k.includes('nivel')) return params.curso || 'General';
    if (k.includes('sección') || k.includes('seccion') || k.includes('dependencia') || k.includes('área')) return params.seccion || 'General';
    if (k.includes('perfil') || k.includes('rol') || k.includes('admin') || k.includes('cargo')) return params.perfil || 'Estudiante';
    return '';
  });

  for (let r = 1; r < data.length; r++) {
    const correoExistente = String(data[r][correoColIdx] || '').trim().toLowerCase();
    if (correoExistente === correoNuevo) {
      userSheet.getRange(r + 1, 1, 1, nuevaFila.length).setValues([nuevaFila]);
      SpreadsheetApp.flush();
      return;
    }
  }

  userSheet.appendRow(nuevaFila);
  SpreadsheetApp.flush();
}

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
  SpreadsheetApp.flush();
}

function recorrerCarpetasDrive(folder, pathParts, sheet, headers, existingKeys) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileName = file.getName();

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

function procesarSolicitud(params) {
  const tokenParam = params.token || '';
  if (INSTITUTIONAL_TOKEN && tokenParam && tokenParam !== INSTITUTIONAL_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Token no válido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.action === 'addUser') {
    agregarUsuarioEnSheet(params);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let usersSheet = obtenerOCrearHojaUsuarios();
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

  const payload = JSON.stringify({
    folderId: ROOT_FOLDER_ID,
    syncedAt: new Date().toISOString(),
    headers: repoData.headers,
    rows: repoData.rows,
    usuariosHeaders: usersData.headers,
    usuariosRows: usersData.rows
  });

  if (params.callback) {
    return ContentService.createTextOutput(params.callback + '(' + payload + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  return procesarSolicitud(params);
}

function doPost(e) {
  let params = (e && e.parameter) ? e.parameter : {};
  try {
    if (e && e.postData && e.postData.contents) {
      const bodyParams = JSON.parse(e.postData.contents);
      params = Object.assign({}, params, bodyParams);
    }
  } catch (err) {
    // Usar params de query
  }
  return procesarSolicitud(params);
}`;

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

        // Si gviz no puso las etiquetas en cols.label, tomar la primera fila como encabezados
        if (headers.every((h) => !h) && rawTableRows.length > 0) {
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

  if (rows.length > 0) {
    const firstRowStr = Object.values(rows[0] || {}).join(' ');
    if (firstRowStr.includes('@') && !firstRowStr.includes('drive.google.com')) {
      return true;
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
    if (!correo) {
      const emailCell = Object.values(row).find((v) => String(v || '').includes('@'));
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

/** Une la lista de usuarios leída de Google Sheets con la comunidad base de Ekirayá y usuarios creados en Cita Master */
function mergeUsersLists(
  sheetUsers: AuthorizedSchoolUser[],
  existingAppUsers: AuthorizedSchoolUser[]
): AuthorizedSchoolUser[] {
  const map = new Map<string, AuthorizedSchoolUser>();

  for (const defUser of DEFAULT_AUTHORIZED_USERS) {
    map.set(defUser.correo.toLowerCase(), defUser);
  }

  for (const u of existingAppUsers || []) {
    if (u && u.correo) {
      map.set(u.correo.trim().toLowerCase(), u);
    }
  }
  for (const u of sheetUsers || []) {
    if (u && u.correo) {
      const key = u.correo.trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        ...u,
        correo: key,
        isAdmin: Boolean(u.isAdmin || existing?.isAdmin || key === 'mebolanos@cem.edu.co'),
        createdInApp: false,
        syncedToSheet: true,
        rawRow: u.rawRow ? { ...u.rawRow } : existing?.rawRow,
      });
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

  // Filtros reorganizados según las columnas de la nueva BD:
  // Búsqueda general + Área + Línea de investigación + Asesor(es) + Autor + Año/Grado
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicUnit, setSelectedAcademicUnit] = useState<string>('all');
  const [selectedResearchLine, setSelectedResearchLine] = useState<string>('all');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'id'>('id');
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
  const [repoTabName, setRepoTabName] = useState<string>('Repositorio');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [sheetAccessWarning, setSheetAccessWarning] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

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
      options?: { silent?: boolean; triggerDriveScan?: boolean }
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
          for (const sheetCandidate of ['usuarios', 'Usuarios', 'USUARIOS']) {
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
                'Repositorio',
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
            action: options?.triggerDriveScan ? 'syncDriveAndSheets' : 'readAll',
          });
          if (jsonpExec && !jsonpExec.error) {
            const uHeaders: string[] = Array.isArray(jsonpExec.usersHeaders)
              ? jsonpExec.usersHeaders.map(String)
              : [];
            const uRows: Record<string, string>[] = Array.isArray(jsonpExec.usersRows)
              ? jsonpExec.usersRows
              : Array.isArray(jsonpExec.users)
                ? jsonpExec.users
                : [];
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
              if (data.sheetAccessWarning && clientUsuariosHeaders.length === 0) {
                showToast(data.sheetAccessWarning);
              } else if (finalRows.length > 0) {
                showToast(
                  `Sincronización exitosa: ${mergedUsers.length} usuarios (${incomingUsuariosHeaders.join(' · ')}) y ${finalRows.length} monografías.`
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

  // Recuperar y sanear toda la configuración previa desde todas las versiones de localStorage + estado del servidor
  useEffect(() => {
    let accumulatedUsers: AuthorizedSchoolUser[] = [...DEFAULT_AUTHORIZED_USERS];
    let savedScriptUrl = '';
    let savedSheetUrl = '';
    let savedToken = 'EKIRAYA-2026';
    let savedTab = 'Repositorio';
    let savedHeaders: string[] = [];
    let savedRows: Record<string, string>[] = [];
    let savedUsuariosHeaders: string[] = DEFAULT_USUARIOS_HEADERS;
    let savedLastSync: string | null = null;

    try {
      // Recorrer TODAS las claves anteriores para rescatar usuarios y URLs sin perder ninguno
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

          // Si en una versión previa la hoja "usuarios" quedó guardada por error dentro de rawRows, rescatar esos usuarios y sus columnas
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

    // Sincronizar con el estado persistido en el servidor y con Google Sheets
    executeSyncWithSheets(
      savedScriptUrl,
      savedSheetUrl,
      savedToken,
      savedTab,
      accumulatedUsers,
      { silent: true, triggerDriveScan: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronización automática cada 24 horas
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      executeSyncWithSheets(
        appsScriptExecUrl,
        connectionUrl,
        accessToken,
        repoTabName,
        authorizedUsers,
        { silent: true, triggerDriveScan: true }
      );
    }, TWENTY_FOUR_HOURS_MS);

    return () => window.clearInterval(intervalId);
  }, [
    appsScriptExecUrl,
    connectionUrl,
    accessToken,
    repoTabName,
    authorizedUsers,
    executeSyncWithSheets,
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

  // Validación contra la hoja "usuarios"
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
      }
    } catch {
      showToast(`Usuario "${newUser.nombres}" guardado y habilitado en Cita Master.`);
    } finally {
      setIsSavingUser(false);
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
      setShowQuickPasteModal(false);
      setQuickPasteText('');
      showToast(`¡${parsed.rows.length} monografías importadas al repositorio!`);
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

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          monographs
            .filter(
              (m) =>
                selectedAcademicUnit === 'all' ||
                m.areaList?.includes(selectedAcademicUnit) ||
                m.academicUnit === selectedAcademicUnit
            )
            .map((m) => m.subject)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [monographs, selectedAcademicUnit]
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

  // Búsqueda e indexación multicriterio con todas las columnas de la nueva BD
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
        if (selectedSubject !== 'all' && m.subject !== selectedSubject) return false;
        if (selectedAdvisor !== 'all' && !(m.advisors || []).includes(selectedAdvisor))
          return false;
        if (selectedAcademicYear !== 'all' && m.academicYear !== selectedAcademicYear)
          return false;
        if (selectedAuthor !== 'all' && m.author !== selectedAuthor) return false;

        if (!q) return true;

        const searchableFields = [
          m.documentCode,
          m.fileName,
          m.title,
          m.author,
          m.grade,
          m.academicYear,
          m.subject,
          m.docType,
          m.keywordsRaw,
          m.abstractText,
          m.advisorsRaw,
          m.academicUnit,
          m.researchLine,
        ]
          .join(' ')
          .toLowerCase();

        return searchableFields.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'id') return a.documentCode.localeCompare(b.documentCode, 'es');
        if (sortBy === 'author') return a.author.localeCompare(b.author, 'es');
        if (sortBy === 'year') return b.academicYear.localeCompare(a.academicYear, 'es');
        return a.title.localeCompare(b.title, 'es');
      });
  }, [
    monographs,
    searchQuery,
    selectedAcademicUnit,
    selectedResearchLine,
    selectedSubject,
    selectedAdvisor,
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
    setSelectedResearchLine('all');
    setSelectedSubject('all');
    setSelectedAdvisor('all');
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
              <em>{usuariosHeaders.join(', ')}</em>).
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

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Accesos de prueba rápidos:</span>
                <button
                  type="button"
                  onClick={() => setLoginEmailInput('mebolanos@cem.edu.co')}
                  className="px-2 py-0.5 rounded bg-violet-100 text-violet-900 hover:bg-violet-200 font-semibold"
                >
                  Admin (Mauricio Bolaños)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginEmailInput('nlondono@cem.edu.co')}
                  className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 hover:bg-blue-200 font-medium"
                >
                  Docente (Nicolás Londoño)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginEmailInput('smendoza@cem.edu.co')}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-medium"
                >
                  Estudiante Taller 4 (Sofía Mendoza)
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                Usuarios autorizados activos: <strong>{authorizedUsers.length}</strong> (Admin
                inicial: <code>mebolanos@cem.edu.co</code>)
              </span>
              <div className="flex items-center gap-2">
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
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar usuarios</span>
                </button>
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
              Búsqueda e indexación por{' '}
              <strong>
                nombre del archivo, título de la monografía, autor, año lectivo, asignatura y
                unidad académica
              </strong>
              .
            </p>
          </div>

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

                <button
                  type="button"
                  onClick={() =>
                    executeSyncWithSheets(
                      appsScriptExecUrl,
                      connectionUrl,
                      accessToken,
                      repoTabName,
                      authorizedUsers,
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
              <span>Nombres: {currentUser.nombres}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Curso:</strong> {currentUser.curso}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100 font-mono">
              <strong>Correo:</strong> {currentUser.correo}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Sección:</strong> {currentUser.seccion}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-violet-100">
              <strong>Perfil:</strong> {currentUser.perfil}
            </span>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-2 text-violet-200">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                Sincronización automática cada 24h activa
                {lastSyncDate ? ` · Última: ${lastSyncDate}` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-violet-200">
              <BookOpen className="w-3.5 h-3.5 text-violet-300" />
              <span>Colegio Ekirayá · Catálogo Académico de Investigaciones</span>
            </div>
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
                  A. URL de la Aplicación Web de Google Apps Script (/exec) — Escribe usuarios en
                  Sheets y escanea Drive
                </label>
                <input
                  type="url"
                  value={appsScriptExecUrl}
                  onChange={(e) => setAppsScriptExecUrl(e.target.value)}
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
                  placeholder="Repositorio"
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Sincronización automática cada 24h y manual respetando las columnas exactas de tu Google Sheets.
              </span>

              <button
                type="button"
                onClick={() =>
                  executeSyncWithSheets(
                    appsScriptExecUrl,
                    connectionUrl,
                    accessToken,
                    repoTabName,
                    authorizedUsers,
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

          {/* 3. TABLA DE LA HOJA "USUARIOS" ADAPTADA EXACTAMENTE A LAS COLUMNAS DE GOOGLE SHEETS */}
          <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-700" />
                  <span>
                    3. Hoja &ldquo;usuarios&rdquo; ({authorizedUsers.length} usuarios registrados)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Columnas sincronizadas con tu Google Sheet:{' '}
                  <strong className="text-violet-900">{usuariosHeaders.join(' · ')}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyUsuariosHeaders(['Nombres', 'Curso', 'Correo', 'Sección'])
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    usuariosHeaders.join('|').toLowerCase() === 'nombres|curso|correo|sección'
                      ? 'bg-violet-700 text-white border-violet-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  4 cols: Nombres · Curso · Correo · Sección
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyUsuariosHeaders([
                      'Nombres',
                      'Curso',
                      'Correo',
                      'Sección',
                      'Perfil',
                    ])
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    usuariosHeaders.join('|').toLowerCase() ===
                    'nombres|curso|correo|sección|perfil'
                      ? 'bg-violet-700 text-white border-violet-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  5 cols (+ Perfil)
                </button>

                <button
                  type="button"
                  onClick={() => setShowEditColumns(!showEditColumns)}
                  className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-[11px] font-semibold"
                >
                  {showEditColumns ? 'Cerrar editor de columnas' : 'Personalizar títulos de columna'}
                </button>

                <button
                  type="button"
                  onClick={handleInitializeUsersSheetInGoogleSheets}
                  disabled={isInitializingUsersSheet}
                  className="px-2.5 py-1 rounded-lg bg-violet-700 hover:bg-violet-800 text-white border border-violet-800 text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isInitializingUsersSheet ? 'animate-spin' : ''}`} />
                  <span>
                    {isInitializingUsersSheet
                      ? 'Poblando en Google Sheets...'
                      : 'Crear / Poblar Hoja "usuarios" en Sheets (37 usuarios)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadUsersCsv}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar CSV ({authorizedUsers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyUsersTableForSheets}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar tabla para Sheets</span>
                </button>
              </div>
            </div>

            {showEditColumns && (
              <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <span className="font-semibold text-violet-950 shrink-0">
                  Títulos exactos de columna en tu hoja &ldquo;usuarios&rdquo; (separados por coma):
                </span>
                <input
                  type="text"
                  value={editingColumnsText}
                  onChange={(e) => setEditingColumnsText(e.target.value)}
                  placeholder="Nombres, Curso, Correo, Sección"
                  className="flex-1 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleApplyUsuariosHeaders(
                      editingColumnsText.split(',').map((s) => s.trim())
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-semibold shrink-0"
                >
                  Aplicar columnas
                </button>
              </div>
            )}

            {/* FORMULARIO DINÁMICO QUE SOLICITA EXACTAMENTE LAS COLUMNAS DE LA HOJA "USUARIOS" */}
            <form
              onSubmit={handleAddAuthorizedUserAndSyncToSheet}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {usuariosHeaders.map((colHeader) => {
                  const norm = normalizeHeaderKey(colHeader);
                  const isEmailField = /correo|email|e mail|mail|cuenta/.test(norm);
                  const isProfileField = /perfil|rol|cargo|tipo|estamento/.test(norm);

                  return (
                    <div key={colHeader} className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-700 text-[11px]">
                        {colHeader}
                      </label>
                      {isProfileField ? (
                        <select
                          value={newUserFieldValues[colHeader] || ''}
                          onChange={(e) =>
                            setNewUserFieldValues((prev) => ({
                              ...prev,
                              [colHeader]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900"
                        >
                          <option value="">Seleccionar {colHeader}...</option>
                          <option value="Estudiante">Estudiante</option>
                          <option value="Docente">Docente</option>
                          <option value="Personal no clases">Personal no clases</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      ) : (
                        <input
                          type={isEmailField ? 'email' : 'text'}
                          value={newUserFieldValues[colHeader] || ''}
                          onChange={(e) =>
                            setNewUserFieldValues((prev) => ({
                              ...prev,
                              [colHeader]: e.target.value,
                            }))
                          }
                          placeholder={
                            isEmailField
                              ? `${colHeader} (ej. usuario@cem.edu.co)`
                              : /curso|grado/.test(norm)
                                ? `${colHeader} (ej. 11°, Docente, No clases)`
                                : /seccion|area/.test(norm)
                                  ? `${colHeader} (ej. Bachillerato, Administrativa)`
                                  : colHeader
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newUserIsAdminFlag}
                    onChange={(e) => setNewUserIsAdminFlag(e.target.checked)}
                    className="rounded border-slate-300 text-violet-700 focus:ring-violet-600"
                  />
                  <span>
                    Otorgar permisos de <strong>Administrador</strong> a este usuario
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white font-semibold transition-colors"
                >
                  {isSavingUser
                    ? 'Escribiendo en Google Sheets...'
                    : '+ Crear Usuario y Escribir en Hoja "usuarios"'}
                </button>
              </div>
            </form>

            {/* TABLA QUE MUESTRA EXACTAMENTE LAS MISMAS COLUMNAS DE LA HOJA "USUARIOS" EN SHEETS */}
            <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    {usuariosHeaders.map((colHeader) => (
                      <th key={colHeader} className="py-2.5 px-3 font-semibold">
                        {colHeader}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-semibold text-right">Acceso / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {authorizedUsers.map((u) => (
                    <tr key={u.correo} className="hover:bg-slate-50">
                      {usuariosHeaders.map((colHeader) => {
                        const cellVal = getUserCellValue(u, colHeader);
                        const isEmailCol = /correo|email|e mail|mail|cuenta/.test(
                          normalizeHeaderKey(colHeader)
                        );
                        const isNameCol = /nombre|apellido|estudiante/.test(
                          normalizeHeaderKey(colHeader)
                        );
                        return (
                          <td
                            key={colHeader}
                            className={`py-2 px-3 ${
                              isEmailCol
                                ? 'font-mono text-slate-700'
                                : isNameCol
                                  ? 'font-medium text-slate-900'
                                  : 'text-slate-600'
                            }`}
                          >
                            {cellVal || '—'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {u.isAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-900 font-semibold">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {u.perfil}
                            </span>
                          )}
                          {u.syncedToSheet ? (
                            <span
                              title="Sincronizado con Google Sheets"
                              className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold"
                            >
                              En Sheets
                            </span>
                          ) : (
                            <span
                              title="Creado en app · Conecta URL /exec o copia tabla a Sheets"
                              className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold"
                            >
                              Local
                            </span>
                          )}
                        </div>
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
                  4. Código Google Apps Script Actualizado (Respeta tus columnas de &ldquo;usuarios&rdquo; + Lectura/Escritura JSONP/POST + Trigger 24h)
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
          FORMULARIO DE FILTRO Y BÚSQUEDA REORGANIZADO SEGÚN LA NUEVA BD ORGANIZADA
         ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        {/* Chips de acceso rápido por Área */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filtrar por Área Académica (Base de Datos):
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedAcademicUnit('all');
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

        {/* Buscador general multicriterio */}
        <div className="flex flex-col lg:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Buscar por ID (MONO-2025-001), título, autor, palabras clave, asesor, área o resumen..."
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
                setSortBy(e.target.value as 'title' | 'author' | 'year' | 'id')
              }
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="id">ID de Documento (MONO-2025-...)</option>
              <option value="title">Título de la monografía (A - Z)</option>
              <option value="author">Autor (A - Z)</option>
              <option value="year">Año lectivo (Más reciente)</option>
            </select>
          </div>
        </div>

        {/* 6 Selectores organizados: Área, Línea de investigación, Asignatura, Asesor(es), Autor y Año */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              1. Área (Ärea)
            </label>
            <select
              value={selectedAcademicUnit}
              onChange={(e) => {
                setSelectedAcademicUnit(e.target.value);
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
              2. Línea Investig.
            </label>
            <select
              value={selectedResearchLine}
              onChange={(e) => {
                setSelectedResearchLine(e.target.value);
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
              3. Asignatura
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas ({subjects.length})</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
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
              6. Año / Grado
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos ({academicYears.length})</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
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
              <strong>{filteredMonographs.length}</strong> monografías de la BD organizada)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {syncedMonographs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setForceShowSamples(!forceShowSamples);
                  setPageIndex(0);
                }}
                className="text-violet-700 hover:text-violet-950 font-semibold underline"
              >
                {forceShowSamples
                  ? `Ver monografías sincronizadas (${syncedMonographs.length})`
                  : 'Ver las 3 monografías de muestra'}
              </button>
            )}

            {(searchQuery ||
              selectedAcademicUnit !== 'all' ||
              selectedResearchLine !== 'all' ||
              selectedSubject !== 'all' ||
              selectedAdvisor !== 'all' ||
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
        </div>
      </section>

      {/* =========================================================================
          VISTA PREVIA DE 3 MONOGRAFÍAS (MUESTRA O SINCRONIZADAS DE SHEETS)
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
            Mostrar todas las monografías ({monographs.length})
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Vista Previa de 3 Monografías ({threePreviewMonographs.length} de{' '}
                  {filteredMonographs.length})
                </h2>
                {isShowingSamples ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    3 Monografías de Muestra Activas
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Sincronizadas desde Google Sheets
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualización simultánea de 3 monografías con su unidad académica, asignatura,
                autor y año lectivo.
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
                  <div className="relative h-64 bg-slate-100 border-b border-slate-200 overflow-hidden">
                    {singlePreviewUrl ? (
                      <iframe
                        title={`Vista previa de ${doc.title}`}
                        src={singlePreviewUrl}
                        className="w-full h-full border-0 bg-white"
                      />
                    ) : (
                      <div className="w-full h-full p-4 bg-gradient-to-b from-slate-100 to-slate-200/70 flex flex-col justify-between">
                        {/* Hoja simulada de vista previa académica */}
                        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-3.5 h-full flex flex-col justify-between overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800">
                              Colegio Ekirayá · Grado 11°
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-900">
                              {doc.format}
                            </span>
                          </div>

                          <div className="space-y-1.5 my-auto py-1">
                            <div className="text-[10px] font-semibold text-emerald-800">
                              {doc.academicUnit} · {doc.subject}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                              {doc.abstractText ||
                                `Trabajo monográfico de investigación desarrollado en la asignatura ${doc.subject} (${doc.academicUnit}) durante el año lectivo ${doc.academicYear}.`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700 truncate">
                              {doc.author}
                            </span>
                            <span className="font-mono shrink-0">{doc.academicYear}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* METADATOS DE LA MONOGRAFÍA */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-violet-900 bg-violet-100/90 px-2 py-0.5 rounded-md border border-violet-200">
                            {doc.documentCode || 'MONO'}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                            <Building2 className="w-3 h-3 text-violet-700" />
                            <span>{doc.academicUnit}</span>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {doc.grade || 'Taller 4'} · {doc.academicYear}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          {doc.researchLine ? `Línea: ${doc.researchLine}` : 'Título de la monografía'}
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
                            <div className="flex flex-wrap items-center gap-1">
                              {doc.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px]"
                                >
                                  {kw}
                                </span>
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
                  <strong>Grado/Año:</strong> {previewDoc.grade || 'Taller 4'} · {previewDoc.academicYear}
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
