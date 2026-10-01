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
  FolderOpen,
  GraduationCap,
  Filter,
  Table2,
  CheckCircle2,
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

const STORAGE_REPO_CONFIG_KEY = 'ekiraya_repo_unidades_academicas_v2';
const STORAGE_INSTITUTIONAL_SESSION_KEY = 'ekiraya_repo_inst_session_v1';

const APPS_SCRIPT_CODE = `/**
 * COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI — CITA MASTER
 * Script de Indexación para la carpeta "Unidades académicas" (1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC)
 * Lee y organiza por títulos de columna: Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura
 */

const ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const SHEET_NAME = 'Repositorio';
const INSTITUTIONAL_TOKEN = 'EKIRAYA-2026';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('🔄 Sincronizar carpeta Unidades Académicas', 'sincronizarUnidadesAcademicas')
    .addToUi();
}

/**
 * Recorre recursivamente la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC ("Unidades académicas")
 * y registra los archivos respetando los títulos de cada columna en Google Sheets.
 */
function sincronizarUnidadesAcademicas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

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

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).trim(); });

  // Detectar columna de ID o Nombre de archivo para no duplicar registros ya existentes
  let idColIdx = headers.findIndex(function(h) { return /id/i.test(h); });
  let urlColIdx = headers.findIndex(function(h) { return /enlace|url|link|drive/i.test(h); });
  let nameColIdx = headers.findIndex(function(h) { return /archivo|file/i.test(h); });

  const existingKeys = new Set();
  for (let i = 1; i < data.length; i++) {
    const rowId = idColIdx >= 0 ? String(data[i][idColIdx]).trim() : '';
    const rowUrl = urlColIdx >= 0 ? String(data[i][urlColIdx]).trim() : '';
    const rowName = nameColIdx >= 0 ? String(data[i][nameColIdx]).trim() : '';
    if (rowId) existingKeys.add(rowId);
    if (rowUrl) existingKeys.add(rowUrl);
    if (rowName) existingKeys.add(rowName);
  }

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  recorrerCarpetas(rootFolder, [], sheet, headers, existingKeys);
}

function recorrerCarpetas(folder, pathParts, sheet, headers, existingKeys) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileName = file.getName();

    if (existingKeys.has(fileId) || existingKeys.has(fileUrl)) continue;

    const cleanTitle = fileName.replace(/\\.(pdf|docx|doc)$/i, '').replace(/[_-]+/g, ' ').trim();
    const unidadAcademica = pathParts.length > 0 ? pathParts[0] : folder.getName();
    const asignatura = pathParts.length > 1 ? pathParts[1] : unidadAcademica;
    const autor = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
    const anioLectivo = String(new Date(file.getDateCreated()).getFullYear());

    // Construir fila según el orden exacto de los títulos de columna de la hoja
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
    recorrerCarpetas(sub, pathParts.concat([sub.getName()]), sheet, headers, existingKeys);
  }
}

/**
 * Endpoint Web App (JSON): Lee dinámicamente la primera fila como títulos de columna
 * y devuelve cada fila asociada exactamente al nombre de su columna.
 */
function doGet(e) {
  const tokenParam = e && e.parameter && e.parameter.token ? e.parameter.token : '';
  if (INSTITUTIONAL_TOKEN && tokenParam && tokenParam !== INSTITUTIONAL_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Token no válido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ headers: [], rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getDisplayValues();
  const rawHeaders = values[0].map(function(h, idx) {
    return String(h || '').trim() || ('Columna_' + (idx + 1));
  });

  // También extraer hipervínculos reales en caso de que la celda tenga texto con enlace insertado
  const richTextValues = sheet.getDataRange().getRichTextValues();
  const rows = [];

  for (let r = 1; r < values.length; r++) {
    const rowValues = values[r];
    const isEmptyRow = rowValues.every(function(cell) { return !String(cell || '').trim(); });
    if (isEmptyRow) continue;

    const rowObj = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const colTitle = rawHeaders[c];
      let cellVal = String(rowValues[c] || '').trim();
      const richLink = richTextValues[r] && richTextValues[r][c] ? richTextValues[r][c].getLinkUrl() : null;
      if (richLink && !cellVal.startsWith('http')) {
        rowObj[colTitle + '_url'] = richLink;
      }
      rowObj[colTitle] = cellVal;
    }
    rows.push(rowObj);
  }

  return ContentService.createTextOutput(JSON.stringify({
    folderId: ROOT_FOLDER_ID,
    sheetName: sheet.getName(),
    headers: rawHeaders,
    rows: rows
  })).setMimeType(ContentService.MimeType.JSON);
}`;

/** Normaliza texto quitando tildes, guiones bajos y pasando a minúsculas para comparar títulos de columna */
function normalizeHeaderKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrae el ID real del documento o archivo de Google Drive desde cualquier formato de enlace o ID */
function extractDriveFileId(input: string): string {
  const clean = (input || '').trim();
  if (!clean) return '';

  // /file/d/{ID} o /document/d/{ID} o /presentation/d/{ID}
  const matchD = clean.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD?.[1]) return matchD[1];

  // ?id={ID} o &id={ID}
  const matchQueryId = clean.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchQueryId?.[1]) return matchQueryId[1];

  // Si ya es directamente un ID de archivo de Drive (sin barras ni espacios)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(clean) && clean !== DRIVE_ROOT_FOLDER_ID) {
    return clean;
  }

  return '';
}

/** Construye la URL de vista previa embebida (/preview) exacta según el tipo de enlace o ID de Drive */
function buildDrivePreviewUrl(driveFileId: string, driveUrl: string): string {
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

  // Si tiene URL directa de /view o /edit, convertirla a /preview
  if (cleanUrl.startsWith('http')) {
    return cleanUrl.replace(/\/(?:view|edit)(?:\?.*)?$/, '/preview');
  }

  return `https://drive.google.com/embeddedfolderview?id=${DRIVE_ROOT_FOLDER_ID}#list`;
}

/** Parsea un texto CSV (por ejemplo, cuando se conecta directamente un Google Sheet compartido) */
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

/** Detecta automáticamente a qué columna de Google Sheets corresponde cada campo requerido */
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
      /curso/,
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
      /carpeta/,
    ]),
    driveIdCol: findCol([/^id del archivo$/, /id.*archivo/, /drive.*id/, /^file.*id$/, /^id$/]),
  };
}

/** Convierte las filas crudas de Google Sheets en documentos indexados usando el mapeo de columnas */
function mapSheetRowsToMonographs(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  headers: string[]
): MonographDocument[] {
  return rawRows
    .map((row, idx) => {
      // Buscar enlace o ID de Drive en las columnas mapeadas o en cualquier celda que contenga un link de Drive
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

      // Si el usuario tiene nombres y apellidos en dos columnas separadas, unirlos si aplica
      let authorVal = (mapping.authorCol && row[mapping.authorCol]) || '';
      const firstNameHeader = headers.find((h) => /^nombres?(?:_estudiante)?$/i.test(normalizeHeaderKey(h)));
      const lastNameHeader = headers.find((h) => /^apellidos?(?:_estudiante)?$/i.test(normalizeHeaderKey(h)));
      if (firstNameHeader && lastNameHeader && (row[firstNameHeader] || row[lastNameHeader])) {
        const f = (row[firstNameHeader] || '').trim();
        const l = (row[lastNameHeader] || '').trim();
        authorVal = [f, l].filter(Boolean).join(' ');
      }

      const fileNameVal =
        (mapping.fileNameCol && row[mapping.fileNameCol]) ||
        (mapping.titleCol && row[mapping.titleCol]) ||
        `Documento_${idx + 1}`;

      const titleVal =
        (mapping.titleCol && row[mapping.titleCol]) ||
        fileNameVal.replace(/\.(pdf|docx|doc)$/i, '').replace(/[_-]+/g, ' ');

      const subjectVal =
        (mapping.subjectCol && row[mapping.subjectCol]) ||
        (mapping.academicUnitCol && row[mapping.academicUnitCol]) ||
        'Sin asignatura especificada';

      const academicUnitVal =
        (mapping.academicUnitCol && row[mapping.academicUnitCol]) ||
        subjectVal;

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
        fileName: fileNameVal,
        title: titleVal,
        author: authorVal || 'Autor por asignar',
        academicYear: academicYearVal,
        subject: subjectVal,
        academicUnit: academicUnitVal,
        format,
        driveUrl: finalDriveUrl,
        rawRow: row,
      };
    })
    .filter((doc) => {
      // Descartar filas vacías
      return Boolean(doc.title.trim() || doc.fileName.trim());
    });
}

function formatAuthorForSecurityMode(authorFull: string, isVerifiedInstitutional: boolean): string {
  const clean = (authorFull || '').trim();
  if (!clean || isVerifiedInstitutional) return clean || 'Autor';

  // Modo visitante (Seguridad Mixta): proteger nombre completo mostrando primer término + iniciales
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return clean;
  const firstPart = parts[0];
  const initials = parts
    .slice(1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');
  return `${firstPart} ${initials}`;
}

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({
  onCiteMonographInGestor,
  showToast,
}) => {
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

  // Filtros de búsqueda enfocados estrictamente en:
  // Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'file'>('title');

  // Seguridad Mixta: sesión institucional (@cem.edu.co / @colegioekiraya.edu.co)
  const [institutionalEmail, setInstitutionalEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingPreviewDoc, setPendingPreviewDoc] = useState<MonographDocument | null>(null);

  // Visor embebido del archivo real de Drive (/preview)
  const [previewDoc, setPreviewDoc] = useState<MonographDocument | null>(null);

  // Configuración de sincronización con Google Sheets / Google Apps Script
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Cargar datos sincronizados guardados en localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_INSTITUTIONAL_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.email) setInstitutionalEmail(parsed.email);
      }

      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig?.connectionUrl) setConnectionUrl(parsedConfig.connectionUrl);
        if (parsedConfig?.accessToken) setAccessToken(parsedConfig.accessToken);
        if (parsedConfig?.lastSyncDate) setLastSyncDate(parsedConfig.lastSyncDate);
        if (Array.isArray(parsedConfig?.rawHeaders)) setRawHeaders(parsedConfig.rawHeaders);
        if (Array.isArray(parsedConfig?.rawRows)) setRawRows(parsedConfig.rawRows);
        if (parsedConfig?.columnMapping) setColumnMapping(parsedConfig.columnMapping);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const monographs: MonographDocument[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return mapSheetRowsToMonographs(rawRows, columnMapping, rawHeaders);
  }, [rawRows, columnMapping, rawHeaders]);

  const isVerifiedInstitutional = Boolean(institutionalEmail);

  const handleVerifyInstitutionalEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean) {
      setAuthError('Ingresa tu correo institucional para continuar.');
      return;
    }
    const isAllowedDomain =
      clean.endsWith('@cem.edu.co') || clean.endsWith('@colegioekiraya.edu.co');

    if (!isAllowedDomain) {
      setAuthError(
        'Acceso denegado: Por seguridad escolar, la visualización de monografías completas está restringida a cuentas institucionales (@cem.edu.co).'
      );
      return;
    }

    setAuthError(null);
    setInstitutionalEmail(clean);
    setEmailInput('');
    try {
      localStorage.setItem(
        STORAGE_INSTITUTIONAL_SESSION_KEY,
        JSON.stringify({ email: clean, verifiedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore storage errors
    }
    setShowAuthModal(false);
    showToast(`Acceso institucional verificado: ${clean}`);

    if (pendingPreviewDoc) {
      setPreviewDoc(pendingPreviewDoc);
      setPendingPreviewDoc(null);
    }
  };

  const handleLogoutInstitutional = () => {
    setInstitutionalEmail('');
    setPreviewDoc(null);
    try {
      localStorage.removeItem(STORAGE_INSTITUTIONAL_SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('Sesión institucional cerrada (Modo Catálogo Protegido activo)');
  };

  const handleRequestOpenDocument = (doc: MonographDocument) => {
    if (!isVerifiedInstitutional) {
      setPendingPreviewDoc(doc);
      setAuthError(null);
      setShowAuthModal(true);
      return;
    }
    setPreviewDoc(doc);
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
      thesisLevel: `Monografía de grado (${doc.subject})`,
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
   * Conecta y lee Google Sheets (ya sea vía enlace directo de Google Sheets o vía Web App de Google Apps Script)
   * organizando los datos estrictamente según los títulos de cada columna en la fila 1.
   */
  const handleSyncFromSheetOrAppsScript = async () => {
    const cleanUrl = connectionUrl.trim();
    if (!cleanUrl) {
      showToast('Pega el enlace de tu Google Sheet o la URL de tu Web App de Apps Script');
      return;
    }

    setIsSyncing(true);
    try {
      let headers: string[] = [];
      let rows: Record<string, string>[] = [];

      // Caso 1: El usuario pegó un enlace directo de Google Sheets (docs.google.com/spreadsheets/d/ID/...)
      const sheetIdMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (sheetIdMatch?.[1]) {
        const sheetId = sheetIdMatch[1];
        const gidMatch = cleanUrl.match(/[#&?]gid=(\d+)/);
        const gidParam = gidMatch?.[1] ? `&gid=${gidMatch[1]}` : '';
        const csvEndpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;

        const resp = await fetch(csvEndpoint);
        if (!resp.ok) {
          throw new Error('No se pudo leer el Google Sheet. Verifica que tenga acceso de lectura.');
        }
        const csvText = await resp.text();
        const parsed = parseCsvToRows(csvText);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        // Caso 2: El usuario pegó la URL de su Web App de Google Apps Script (/exec)
        const separator = cleanUrl.includes('?') ? '&' : '?';
        const requestUrl = accessToken.trim()
          ? `${cleanUrl}${separator}token=${encodeURIComponent(accessToken.trim())}`
          : cleanUrl;

        const resp = await fetch(requestUrl);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();

        if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) {
          // Formato nuevo de Apps Script basado en títulos de columna
          headers = data.headers.map((h: string) => String(h).trim());
          rows = data.rows;
        } else if (Array.isArray(data?.items) || Array.isArray(data)) {
          // Si el Apps Script anterior devolvió un arreglo de objetos, reconstruimos las columnas desde sus llaves reales
          const rawArr = Array.isArray(data?.items) ? data.items : data;
          if (rawArr.length > 0 && typeof rawArr[0] === 'object') {
            headers = Object.keys(rawArr[0]);
            rows = rawArr.map((obj: Record<string, unknown>) => {
              const r: Record<string, string> = {};
              headers.forEach((k) => {
                const v = obj[k];
                r[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
              });
              return r;
            });
          }
        }
      }

      if (headers.length === 0 || rows.length === 0) {
        showToast(
          'Se conectó correctamente, pero la hoja no contiene filas de datos bajo los encabezados.'
        );
        setIsSyncing(false);
        return;
      }

      const detectedMapping = autoDetectColumnMapping(headers);
      const nowStr = new Date().toLocaleString('es-CO');

      setRawHeaders(headers);
      setRawRows(rows);
      setColumnMapping(detectedMapping);
      setLastSyncDate(nowStr);

      localStorage.setItem(
        STORAGE_REPO_CONFIG_KEY,
        JSON.stringify({
          connectionUrl: cleanUrl,
          accessToken: accessToken.trim(),
          lastSyncDate: nowStr,
          rawHeaders: headers,
          rawRows: rows,
          columnMapping: detectedMapping,
        })
      );

      showToast(
        `¡Sincronizado! ${rows.length} documentos leídos según los ${headers.length} títulos de columna de tu Google Sheet.`
      );
      setShowSyncModal(false);
    } catch {
      showToast(
        'No se pudo leer la hoja. Si usas un enlace de Google Sheets, compártelo como "Cualquier persona con el enlace (Lector)" o usa el Web App de Apps Script.'
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

  // Listas dinámicas extraídas únicamente de los archivos sincronizados de la carpeta Unidades Académicas
  const subjects = useMemo(
    () =>
      Array.from(new Set(monographs.map((m) => m.subject).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [monographs]
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

  // Filtrado e indexación teniendo en cuenta exactamente:
  // Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura
  const filteredMonographs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return monographs
      .filter((m) => {
        if (selectedSubject !== 'all' && m.subject !== selectedSubject) return false;
        if (selectedAcademicYear !== 'all' && m.academicYear !== selectedAcademicYear) return false;
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
  }, [monographs, searchQuery, selectedSubject, selectedAcademicYear, selectedAuthor, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedAcademicYear('all');
    setSelectedAuthor('all');
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DEL REPOSITORIO — CARPETA UNIDADES ACADÉMICAS */}
      <div className="bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] rounded-2xl p-6 sm:p-8 text-white border border-violet-800/40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-violet-200" />
              <span>Carpeta Oficial: Unidades Académicas ({DRIVE_ROOT_FOLDER_ID})</span>
              <span aria-hidden="true">·</span>
              <span>Seguridad Mixta</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Repositorio de Monografías — Unidades Académicas
            </h1>
            <p className="text-violet-100/90 text-sm sm:text-base leading-relaxed">
              Consulta e indexación exclusiva de la carpeta{' '}
              <strong>Unidades académicas</strong> de Google Drive por{' '}
              <strong>
                nombre del archivo, título de la monografía, autor, año lectivo y asignatura
              </strong>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-violet-950 hover:bg-violet-50 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Database className="w-4 h-4 text-violet-700" />
              <span>
                {monographs.length > 0
                  ? 'Actualizar / Configurar Google Sheets'
                  : 'Conectar Google Sheets / Apps Script'}
              </span>
            </button>

            {rawHeaders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowColumnMapper(!showColumnMapper)}
                className="px-4 py-2 rounded-xl bg-violet-800/80 hover:bg-violet-800 text-white border border-violet-400/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Table2 className="w-4 h-4 text-violet-200" />
                <span>
                  {showColumnMapper
                    ? 'Ocultar Mapeo de Columnas'
                    : `Revisar Títulos de Columna (${rawHeaders.length})`}
                </span>
              </button>
            )}

            {isVerifiedInstitutional ? (
              <a
                href={DRIVE_ROOT_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir Carpeta Unidades Académicas</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingPreviewDoc(null);
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-violet-900/60 hover:bg-violet-900 text-white border border-violet-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Desbloquear Vista Previa (@cem.edu.co)</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE ESTADO DE SEGURIDAD MIXTA Y SINCRONIZACIÓN */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold border ${
                isVerifiedInstitutional
                  ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-100 border-amber-400/40'
              }`}
            >
              {isVerifiedInstitutional ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    Sesión Institucional: {institutionalEmail} (Nombres completos y visor
                    habilitados)
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    Seguridad Mixta Activa: Catálogo público con autores abreviados · Vista previa
                    protegida (@cem.edu.co)
                  </span>
                </>
              )}
            </span>
            {lastSyncDate && (
              <span className="text-violet-200">
                · Sincronizado con Google Sheets: {lastSyncDate} ({monographs.length} archivos)
              </span>
            )}
          </div>

          <div>
            {isVerifiedInstitutional ? (
              <button
                type="button"
                onClick={handleLogoutInstitutional}
                className="text-violet-200 hover:text-white underline font-medium"
              >
                Cerrar sesión institucional
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingPreviewDoc(null);
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                className="text-amber-200 hover:text-white underline font-semibold"
              >
                Validar cuenta @cem.edu.co →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANEL INTERACTIVO DE MAPEO DE TÍTULOS DE COLUMNA DE GOOGLE SHEETS */}
      {showColumnMapper && rawHeaders.length > 0 && (
        <section className="bg-[#FAF5FF] rounded-2xl border border-violet-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-violet-950 flex items-center gap-2">
                <Table2 className="w-4 h-4 text-violet-700" />
                <span>
                  Lectura Dinámica según los Títulos de Columna de tu Google Sheet
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                El sistema detectó las siguientes columnas en la fila 1 de tu hoja. Si deseas
                asignar otro encabezado de tu hoja a algún campo, selecciónalo aquí:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowColumnMapper(false)}
              className="text-xs font-semibold text-violet-700 hover:underline"
            >
              Cerrar panel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'fileNameCol' as const, label: 'Columna: Nombre del archivo' },
              { key: 'titleCol' as const, label: 'Columna: Título de la monografía' },
              { key: 'authorCol' as const, label: 'Columna: Autor / Estudiante' },
              { key: 'academicYearCol' as const, label: 'Columna: Año lectivo' },
              { key: 'subjectCol' as const, label: 'Columna: Asignatura' },
              { key: 'driveUrlCol' as const, label: 'Columna: Enlace / URL del archivo en Drive' },
            ].map((field) => (
              <div key={field.key} className="bg-white p-3 rounded-xl border border-violet-200">
                <label className="block font-semibold text-slate-800 mb-1">{field.label}</label>
                <select
                  value={columnMapping[field.key]}
                  onChange={(e) => handleUpdateColumnMapping(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-900"
                >
                  <option value="">-- Detectar automáticamente --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORMULARIO DE FILTRO Y BÚSQUEDA (NOMBRE DEL ARCHIVO, TÍTULO DE LA MONOGRAFÍA, AUTOR, AÑO LECTIVO, ASIGNATURA) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Buscador general por los 5 campos */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre del archivo, título de la monografía, autor, año lectivo o asignatura..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 bg-slate-50/60 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de ordenamiento */}
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

        {/* Filtros específicos: Asignatura, Año lectivo y Autor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Asignatura
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
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
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
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
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los autores ({authors.length})</option>
              {authors.map((auth) => (
                <option key={auth} value={auth}>
                  {formatAuthorForSecurityMode(auth, isVerifiedInstitutional)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados y botón limpiar filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-violet-700" />
            <span>
              Mostrando <strong>{filteredMonographs.length}</strong> de{' '}
              <strong>{monographs.length}</strong> documentos de la carpeta{' '}
              <em>Unidades académicas</em>
            </span>
          </div>

          {(searchQuery ||
            selectedSubject !== 'all' ||
            selectedAcademicYear !== 'all' ||
            selectedAuthor !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-violet-700 hover:text-violet-950 font-semibold underline"
            >
              Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      </section>

      {/* CONTENIDO DEL REPOSITORIO: SOLO ARCHIVOS REALES SINCRONIZADOS + EXPLORADOR REAL DE LA CARPETA 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC */}
      {monographs.length === 0 ? (
        <div className="space-y-6">
          {/* Estado cuando aún no se ha sincronizado la hoja de Google Sheets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-violet-700 uppercase">
                  Contenido Real del Repositorio ({DRIVE_ROOT_FOLDER_ID})
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Carpeta de Google Drive: Unidades académicas
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Se han eliminado los datos de ejemplo para mostrar únicamente los archivos reales
                  almacenados en tu repositorio. Conecta tu Google Sheet o Web App de Apps Script
                  para habilitar las tarjetas indexadas, o explora directamente el contenido real de
                  la carpeta abajo:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
              >
                <Database className="w-4 h-4" />
                <span>Conectar Google Sheet Ahora</span>
              </button>
            </div>

            {/* Vista embebida real de la carpeta 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-violet-700" />
                  Archivos reales en Google Drive — Carpeta Unidades académicas (
                  {DRIVE_ROOT_FOLDER_ID})
                </span>
                <a
                  href={DRIVE_ROOT_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Abrir en pestaña nueva</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                title="Carpeta Unidades Académicas Google Drive"
                src={`https://drive.google.com/embeddedfolderview?id=${DRIVE_ROOT_FOLDER_ID}#list`}
                className="w-full h-[460px] border-0 bg-white"
              />
            </div>
          </div>
        </div>
      ) : filteredMonographs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron archivos con esos criterios de búsqueda
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Prueba buscando otro nombre de archivo, título de monografía, autor, año lectivo o
            asignatura.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 transition-colors"
          >
            Mostrar todos los documentos ({monographs.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMonographs.map((doc) => {
            const displayAuthor = formatAuthorForSecurityMode(
              doc.author,
              isVerifiedInstitutional
            );

            return (
              <article
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xs transition-all"
              >
                <div className="space-y-3">
                  {/* Encabezado: Asignatura y Año lectivo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-violet-900 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
                      Asignatura: {doc.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      Año lectivo: {doc.academicYear}
                    </span>
                  </div>

                  {/* Título de la monografía */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">
                      Título de la monografía
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-0.5">
                      {doc.title}
                    </h3>
                  </div>

                  {/* Ficha con Nombre del archivo y Autor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Autor:</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                        <span>{displayAuthor}</span>
                        {!isVerifiedInstitutional && (
                          <span className="text-[10px] font-normal text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            Protegido
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Nombre del archivo:</span>
                      <span className="font-mono text-[11px] text-slate-800 flex items-center gap-1 break-all">
                        <FileText className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                        <span>{doc.fileName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones: Previsualizar archivo real de Drive y Citar en 1 clic */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestOpenDocument(doc)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isVerifiedInstitutional
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-slate-100 hover:bg-violet-50 text-slate-800 hover:text-violet-950 border border-slate-300'
                    }`}
                  >
                    {isVerifiedInstitutional ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Previsualizar Archivo Real</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ver Archivo (@cem.edu.co)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCiteMonograph(doc)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Citar en el Gestor (APA 7.ª)</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: VERIFICACIÓN DE CUENTA INSTITUCIONAL (@cem.edu.co)
         ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verificación Institucional Ekirayá
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seguridad Mixta · Acceso al Documento Real en Google Drive
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingPreviewDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingPreviewDoc && (
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-950">
                <strong>Archivo solicitado:</strong> {pendingPreviewDoc.fileName}
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ingresa tu correo institucional del colegio (<code>@cem.edu.co</code>) para
              previsualizar el documento real almacenado en la carpeta{' '}
              <strong>Unidades académicas</strong>:
            </p>

            <form onSubmit={handleVerifyInstitutionalEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Institucional (@cem.edu.co)
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="usuario@cem.edu.co"
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPendingPreviewDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors"
                >
                  Verificar y Abrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VISOR DEL ARCHIVO REAL DE GOOGLE DRIVE (/PREVIEW)
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#4C1D95] text-white flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-violet-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>
                    Archivo Real del Repositorio Unidades Académicas · {previewDoc.fileName}
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
                <strong>Autor:</strong> {previewDoc.author} · <strong>Asignatura:</strong>{' '}
                {previewDoc.subject} · <strong>Año lectivo:</strong> {previewDoc.academicYear}
              </div>
              <span className="font-mono text-[11px] text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                {previewDoc.fileName}
              </span>
            </div>

            <div className="flex-1 bg-slate-50 relative">
              <iframe
                title={`Vista previa de ${previewDoc.fileName}`}
                src={buildDrivePreviewUrl(previewDoc.driveFileId, previewDoc.driveUrl)}
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CONECTOR DE GOOGLE SHEETS / APPS SCRIPT POR TÍTULOS DE COLUMNA
         ========================================================================= */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#4C1D95] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-violet-200 shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Conectar Google Sheets o Apps Script (Carpeta Unidades Académicas)
                  </h3>
                  <p className="text-xs text-violet-200">
                    Lectura dinámica por títulos de columna · Carpeta ID: {DRIVE_ROOT_FOLDER_ID}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 rounded-lg bg-violet-900/50 hover:bg-violet-900 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700">
              <div className="p-4 sm:p-5 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-3">
                <h4 className="text-sm sm:text-base font-bold text-violet-950 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-violet-700" />
                  <span>
                    Pega el Enlace de tu Google Sheet o la URL del Web App de Apps Script
                  </span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Puedes pegar directamente el enlace de tu archivo de{' '}
                  <strong>Google Sheets</strong> (compartido en modo lector) o la URL{' '}
                  <code>/exec</code> de tu <strong>Google Apps Script</strong>. El sistema lee la{' '}
                  <strong>fila 1 como títulos de columna</strong> (
                  <em>
                    Nombre del archivo, Título de la monografía, Autor, Año lectivo, Asignatura,
                    Enlace Drive
                  </em>
                  ) y asigna cada dato a su campo exacto.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enlace de Google Sheets o URL Web App (/exec)
                    </label>
                    <input
                      type="url"
                      value={connectionUrl}
                      onChange={(e) => setConnectionUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/... o https://script.google.com/macros/s/.../exec"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token Institucional (Opcional)
                    </label>
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EKIRAYA-2026"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Detecta automáticamente tus encabezados y vincula cada archivo real de Drive.
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncFromSheetOrAppsScript}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Leyendo columnas...' : 'Cargar Datos de Sheets'}</span>
                  </button>
                </div>
              </div>

              {/* Código Google Apps Script actualizado con lectura por títulos de columna */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Code2 className="w-4 h-4 text-violet-700" />
                    <span>
                      Código Google Apps Script (Lee y escribe según los títulos de cada columna)
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
                        <span>Copiar código actualizado</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72">
                  {APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
