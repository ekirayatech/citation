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
} from 'lucide-react';
import { CitationFormData } from '../types/citation';

export interface MonographDocument {
  id: string;
  driveFileId: string;
  fileName: string;
  title: string;
  studentFirstName: string;
  studentLastName: string;
  academicUnit: string;
  subject: string;
  documentType: 'Monografía de Grado' | 'Proyecto de Investigación' | 'Ensayo Académico' | 'Informe Experimental';
  grade: string;
  year: string;
  advisor: string;
  keywords: string[];
  abstract: string;
  format: 'PDF' | 'Google Doc' | 'DOCX';
  driveUrl: string;
  updatedAt: string;
  featured?: boolean;
}

interface RepositorioSectionProps {
  onCiteMonographInGestor: (formData: Partial<CitationFormData>, title: string) => void;
  showToast: (msg: string) => void;
}

const DRIVE_ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const DRIVE_ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_ROOT_FOLDER_ID}`;

const STORAGE_REPO_CONFIG_KEY = 'ekiraya_repo_sync_config_v1';
const STORAGE_INSTITUTIONAL_SESSION_KEY = 'ekiraya_repo_inst_session_v1';

const INITIAL_MONOGRAPHS: MonographDocument[] = [
  {
    id: 'mono-01',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Bioindicadores_Humedales_Sabana_2026.pdf',
    title:
      'Evaluación de macroinvertebrados bentónicos como bioindicadores de calidad del agua en humedales altoandinos de la Sabana de Bogotá',
    studentFirstName: 'Sofía Valentina',
    studentLastName: 'Mendoza Restrepo',
    academicUnit: 'Ciencias Naturales y Educación Ambiental',
    subject: 'Biología y Ecología',
    documentType: 'Monografía de Grado',
    grade: 'Grado 11°',
    year: '2026',
    advisor: 'Biol. Carlos Andrés Pineda',
    keywords: ['Bioindicadores', 'Humedales altoandinos', 'Calidad del agua', 'Ecología acuática'],
    abstract:
      'Investigación de campo y laboratorio desarrollada por estudiantes de Grado 11° que analiza la diversidad de familias de macroinvertebrados para determinar el índice BMWP/Col en cuerpos de agua locales, proponiendo estrategias de restauración ecológica participativa desde el enfoque Montessori.',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2026-09-15',
    featured: true,
  },
  {
    id: 'mono-02',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Memoria_Historica_Literatura_Colombiana_2026.pdf',
    title:
      'Narrativas de la memoria y reconstrucción del tejido social en la novela colombiana contemporánea: un análisis crítico desde el aula',
    studentFirstName: 'Mateo Alejandro',
    studentLastName: 'Castellanos Uribe',
    academicUnit: 'Humanidades, Lengua Castellana y Literatura',
    subject: 'Literatura y Análisis del Discurso',
    documentType: 'Monografía de Grado',
    grade: 'Grado 11°',
    year: '2026',
    advisor: 'Mag. Laura Sofía Giraldo',
    keywords: ['Memoria histórica', 'Literatura colombiana', 'Tejido social', 'Análisis literario'],
    abstract:
      'Estudio hermenéutico comparativo de tres obras literarias colombianas del siglo XXI para comprender cómo la ficción testimonial permite elaborar duelos colectivos y fomentar la empatía histórica en jóvenes de educación media.',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2026-09-12',
    featured: true,
  },
  {
    id: 'mono-03',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Modelado_Matematico_Energia_Solar_Escolar_2026.pdf',
    title:
      'Modelado matemático de la eficiencia energética de paneles fotovoltaicos en entornos escolares de montaña mediante regresiones no lineales',
    studentFirstName: 'Samuel Esteban',
    studentLastName: 'Quintero Lozano',
    academicUnit: 'Matemáticas, Física y Tecnología',
    subject: 'Física y Matemáticas Aplicadas',
    documentType: 'Proyecto de Investigación',
    grade: 'Grado 11°',
    year: '2026',
    advisor: 'Ing. Diego Fernando Rojas',
    keywords: ['Energía solar', 'Modelado matemático', 'Sostenibilidad escolar', 'Fotovoltaica'],
    abstract:
      'Desarrollo de un modelo predictivo de generación eléctrica solar considerando variables de radiación, nubosidad y temperatura en la Sabana Norte, validado con mediciones experimentales para optimizar el consumo energético escolar.',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2026-09-10',
  },
  {
    id: 'mono-04',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Etica_Algoritmica_Redes_Sociales_Adolescentes_2025.pdf',
    title:
      'Ética algorítmica y formación del criterio autónomo: impacto de las cámaras de eco digitales en la deliberación ciudadana de estudiantes de Grado 11°',
    studentFirstName: 'Mariana',
    studentLastName: 'Villamizar Gómez',
    academicUnit: 'Ciencias Sociales, Historia y Filosofía',
    subject: 'Filosofía y Ciencias Políticas',
    documentType: 'Monografía de Grado',
    grade: 'Grado 11°',
    year: '2025',
    advisor: 'Fil. Camilo Ernesto Vargas',
    keywords: ['Ética algorítmica', 'Pensamiento crítico', 'Ciudadanía digital', 'Filosofía política'],
    abstract:
      'Indagación mixta sobre cómo los sistemas de recomendación algorítmica inciden en la polarización de opiniones entre adolescentes y qué prácticas pedagógicas Montessori fortalecen la autonomía intelectual y la verificación de fuentes.',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2025-11-20',
  },
  {
    id: 'mono-05',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Bioplasticos_Almidon_Yuca_Laboratorio_2025.pdf',
    title:
      'Síntesis y caracterización mecánica de biopolímeros biodegradables a partir de almidón residual de tubérculos andinos',
    studentFirstName: 'Gabriela',
    studentLastName: 'Sánchez Peñaloza',
    academicUnit: 'Ciencias Naturales y Educación Ambiental',
    subject: 'Química Orgánica',
    documentType: 'Informe Experimental',
    grade: 'Grado 11°',
    year: '2025',
    advisor: 'Quím. Diana Marcela Pardo',
    keywords: ['Biopolímeros', 'Química verde', 'Biodegradabilidad', 'Economía circular'],
    abstract:
      'Diseño experimental factorial para evaluar la resistencia a la tracción, flexibilidad y tiempo de degradación en compostaje de películas bioplásticas formuladas con diferentes proporciones de glicerina y almidón natural.',
    format: 'PDF',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2025-11-18',
  },
  {
    id: 'mono-06',
    driveFileId: '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC',
    fileName: 'Monografia_Paisaje_Sonoro_Aprendizaje_Montessori_2026.pdf',
    title:
      'El paisaje sonoro natural y acústico como mediador de la concentración profunda en ambientes preparados Montessori',
    studentFirstName: 'Tomás Felipe',
    studentLastName: 'Arboleda Cano',
    academicUnit: 'Artes, Música y Expresión Cultural',
    subject: 'Música y Estética',
    documentType: 'Ensayo Académico',
    grade: 'Grado 11°',
    year: '2026',
    advisor: 'Mtro. Julián David Ospina',
    keywords: ['Paisaje sonoro', 'Educación Montessori', 'Concentración', 'Acústica escolar'],
    abstract:
      'Cartografía sonora de los espacios interiores y exteriores del Colegio Ekirayá, analizando la relación entre los niveles de presión sonora, los sonidos biofónicos del entorno y los periodos de trabajo autónomo.',
    format: 'Google Doc',
    driveUrl: DRIVE_ROOT_FOLDER_URL,
    updatedAt: '2026-09-05',
  },
];

const APPS_SCRIPT_CODE = `/**
 * COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI — CITA MASTER
 * Script de Indexación Automática: Google Drive -> Google Sheets -> API JSON Segura
 * Carpeta Raíz de Monografías Grado 11: 1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC
 */

const ROOT_FOLDER_ID = '1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC';
const SHEET_NAME = 'Index_Monografias';
const INSTITUTIONAL_TOKEN = 'EKIRAYA-2026'; // Token opcional de Capa 3

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('🔄 Sincronizar carpetas de Google Drive', 'sincronizarRepositorioDrive')
    .addToUi();
}

/**
 * Recorre la estructura: Carpeta Raíz -> Unidad Académica -> Estudiante -> Documento
 * Respeta los metadatos enriquecidos manualmente (Título formal, Resumen, Palabras clave, Estado).
 */
function sincronizarRepositorioDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const headers = [
    'ID_Archivo',
    'Nombre_Archivo',
    'Titulo_Monografia',
    'Nombres_Estudiante',
    'Apellidos_Estudiante',
    'Unidad_Academica',
    'Asignatura',
    'Tipo_Documento',
    'Grado',
    'Año',
    'Asesor',
    'Palabras_Clave',
    'Resumen',
    'Formato',
    'URL_Drive',
    'Fecha_Actualizacion',
    'Estado'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  // Mapa de archivos ya registrados para no sobrescribir curaduría docente
  const existingData = sheet.getDataRange().getValues();
  const existingIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    existingIds.add(String(existingData[i][0]).trim());
  }

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const unitFolders = rootFolder.getFolders();

  while (unitFolders.hasNext()) {
    const unitFolder = unitFolders.next();
    const unitName = unitFolder.getName();

    // Revisar archivos directos en la Unidad Académica
    procesarArchivosDeCarpeta(unitFolder, unitName, 'Estudiante Grado 11', sheet, existingIds);

    // Revisar subcarpetas de cada Estudiante dentro de la Unidad Académica
    const studentFolders = unitFolder.getFolders();
    while (studentFolders.hasNext()) {
      const studentFolder = studentFolders.next();
      const studentFolderName = studentFolder.getName();
      procesarArchivosDeCarpeta(studentFolder, unitName, studentFolderName, sheet, existingIds);
    }
  }
}

function procesarArchivosDeCarpeta(folder, unitName, studentFolderName, sheet, existingIds) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    if (existingIds.has(fileId)) continue;

    const mime = file.getMimeType();
    let format = 'PDF';
    if (mime.includes('document')) format = 'Google Doc';
    else if (mime.includes('word')) format = 'DOCX';

    const cleanTitle = file.getName().replace(/\\.(pdf|docx|doc)$/i, '').replace(/_/g, ' ');
    const parts = studentFolderName.trim().split(' ');
    const firstName = parts.slice(0, Math.ceil(parts.length / 2)).join(' ') || studentFolderName;
    const lastName = parts.slice(Math.ceil(parts.length / 2)).join(' ') || '';

    sheet.appendRow([
      fileId,
      file.getName(),
      cleanTitle,
      firstName,
      lastName,
      unitName,
      unitName,
      'Monografía de Grado',
      'Grado 11°',
      new Date(file.getDateCreated()).getFullYear().toString(),
      'Docente Asesor',
      'Monografía, Grado 11, Investigación',
      'Trabajo de investigación monográfica desarrollado en Grado 11° del Colegio Ekirayá.',
      format,
      file.getUrl(),
      Utilities.formatDate(file.getLastUpdated(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      'Publicado'
    ]);
    existingIds.add(fileId);
  }
}

/**
 * Endpoint Web App (JSON) consumido por la pestaña Repositorio de Cita Master.
 * Solo devuelve filas con Estado = "Publicado".
 */
function doGet(e) {
  const tokenParam = e && e.parameter && e.parameter.token ? e.parameter.token : '';
  if (INSTITUTIONAL_TOKEN && tokenParam && tokenParam !== INSTITUTIONAL_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Token no válido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ items: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const rows = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const estado = String(r[16] || 'Publicado').trim().toLowerCase();
    if (estado !== 'publicado') continue;

    items.push({
      id: 'drive-' + r[0],
      driveFileId: String(r[0] || ''),
      fileName: String(r[1] || ''),
      title: String(r[2] || r[1] || ''),
      studentFirstName: String(r[3] || ''),
      studentLastName: String(r[4] || ''),
      academicUnit: String(r[5] || 'General'),
      subject: String(r[6] || ''),
      documentType: String(r[7] || 'Monografía de Grado'),
      grade: String(r[8] || 'Grado 11°'),
      year: String(r[9] || '2026'),
      advisor: String(r[10] || ''),
      keywords: String(r[11] || '').split(',').map(function(k) { return k.trim(); }).filter(Boolean),
      abstract: String(r[12] || ''),
      format: String(r[13] || 'PDF'),
      driveUrl: String(r[14] || ''),
      updatedAt: String(r[15] || '')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

function formatProtectedStudentName(
  firstName: string,
  lastName: string,
  isVerifiedInstitutional: boolean
): string {
  const f = firstName.trim();
  const l = lastName.trim();
  if (isVerifiedInstitutional) {
    return `${l ? `${l}, ` : ''}${f}`;
  }
  // En modo visitante (Seguridad Mixta - Capa 4): solo muestra iniciales del nombre para proteger datos de menores
  const initials = f
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');
  const firstLastName = l.split(/\s+/)[0] || l;
  return `${firstLastName}${initials ? `, ${initials}` : ''}`;
}

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({
  onCiteMonographInGestor,
  showToast,
}) => {
  const [monographs, setMonographs] = useState<MonographDocument[]>(INITIAL_MONOGRAPHS);

  // Filtros de búsqueda e indexación multicriterio
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author'>('recent');

  // Seguridad Mixta: sesión institucional (@cem.edu.co / @colegioekiraya.edu.co)
  const [institutionalEmail, setInstitutionalEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingPreviewDoc, setPendingPreviewDoc] = useState<MonographDocument | null>(null);

  // Visor embebido de solo lectura (/preview)
  const [previewDoc, setPreviewDoc] = useState<MonographDocument | null>(null);

  // Configuración de sincronización con Google Sheets / Google Apps Script
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('EKIRAYA-2026');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Cargar sesión institucional y configuración de sincronización guardadas
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_INSTITUTIONAL_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.email) {
          setInstitutionalEmail(parsed.email);
        }
      }
      const savedConfig = localStorage.getItem(STORAGE_REPO_CONFIG_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig?.appsScriptUrl) setAppsScriptUrl(parsedConfig.appsScriptUrl);
        if (parsedConfig?.accessToken) setAccessToken(parsedConfig.accessToken);
        if (parsedConfig?.lastSyncDate) setLastSyncDate(parsedConfig.lastSyncDate);
        if (Array.isArray(parsedConfig?.cachedItems) && parsedConfig.cachedItems.length > 0) {
          setMonographs(parsedConfig.cachedItems);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

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
        'Acceso denegado: Por seguridad y protección de datos escolares, la lectura de documentos completos está restringida exclusivamente a cuentas institucionales (@cem.edu.co).'
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
    const presetForm: Partial<CitationFormData> = {
      sourceType: 'thesis',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      thesisSubtype: 'online_archive',
      thesisLevel: `${doc.documentType} (${doc.grade})`,
      authors: [
        {
          firstName: doc.studentFirstName,
          lastName: doc.studentLastName,
        },
      ],
      title: doc.title,
      year: doc.year,
      publisher: 'Colegio Ekirayá Educación Montessori',
      url: doc.driveUrl || DRIVE_ROOT_FOLDER_URL,
    };
    onCiteMonographInGestor(presetForm, doc.title);
  };

  const handleSyncFromAppsScript = async () => {
    const cleanUrl = appsScriptUrl.trim();
    if (!cleanUrl) {
      showToast('Pega la URL de tu Web App de Google Apps Script para sincronizar');
      return;
    }
    setIsSyncing(true);
    try {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      const requestUrl = accessToken.trim()
        ? `${cleanUrl}${separator}token=${encodeURIComponent(accessToken.trim())}`
        : cleanUrl;

      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const rawItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

      if (rawItems.length === 0) {
        showToast('Conexión exitosa, pero no se encontraron filas con Estado = Publicado');
        setIsSyncing(false);
        return;
      }

      const normalized: MonographDocument[] = rawItems.map(
        (item: Partial<MonographDocument>, idx: number) => ({
          id: item.id || `sync-${idx}-${Date.now()}`,
          driveFileId: item.driveFileId || DRIVE_ROOT_FOLDER_ID,
          fileName: item.fileName || `Monografia_${idx + 1}.pdf`,
          title: item.title || item.fileName || 'Monografía sin título',
          studentFirstName: item.studentFirstName || 'Estudiante',
          studentLastName: item.studentLastName || 'Grado 11',
          academicUnit: item.academicUnit || 'Unidad Académica General',
          subject: item.subject || 'Investigación Escolar',
          documentType: item.documentType || 'Monografía de Grado',
          grade: item.grade || 'Grado 11°',
          year: String(item.year || '2026'),
          advisor: item.advisor || 'Docente Asesor',
          keywords: Array.isArray(item.keywords) ? item.keywords : ['Monografía', 'Grado 11'],
          abstract:
            item.abstract ||
            'Trabajo monográfico indexado desde el repositorio institucional de Google Drive.',
          format: item.format || 'PDF',
          driveUrl: item.driveUrl || DRIVE_ROOT_FOLDER_URL,
          updatedAt: item.updatedAt || new Date().toISOString().slice(0, 10),
        })
      );

      const nowStr = new Date().toLocaleString('es-CO');
      setMonographs(normalized);
      setLastSyncDate(nowStr);
      localStorage.setItem(
        STORAGE_REPO_CONFIG_KEY,
        JSON.stringify({
          appsScriptUrl: cleanUrl,
          accessToken: accessToken.trim(),
          lastSyncDate: nowStr,
          cachedItems: normalized,
        })
      );
      showToast(`Repositorio sincronizado: ${normalized.length} monografías cargadas`);
      setShowSyncModal(false);
    } catch {
      showToast(
        'No se pudo conectar con la URL indicada. Verifica que el Web App esté desplegado con acceso "Cualquier persona".'
      );
    } finally {
      setIsSyncing(false);
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

  // Listas únicas dinámicas para los filtros
  const academicUnits = useMemo(
    () => Array.from(new Set(monographs.map((m) => m.academicUnit))).sort(),
    [monographs]
  );

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          monographs
            .filter((m) => selectedUnit === 'all' || m.academicUnit === selectedUnit)
            .map((m) => m.subject)
        )
      ).sort(),
    [monographs, selectedUnit]
  );

  const years = useMemo(
    () => Array.from(new Set(monographs.map((m) => m.year))).sort((a, b) => b.localeCompare(a)),
    [monographs]
  );

  // Filtrado e indexación multicriterio en tiempo real
  const filteredMonographs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return monographs
      .filter((m) => {
        if (selectedUnit !== 'all' && m.academicUnit !== selectedUnit) return false;
        if (selectedSubject !== 'all' && m.subject !== selectedSubject) return false;
        if (selectedDocType !== 'all' && m.documentType !== selectedDocType) return false;
        if (selectedYear !== 'all' && m.year !== selectedYear) return false;

        if (!q) return true;

        const searchableText = [
          m.title,
          m.fileName,
          m.studentFirstName,
          m.studentLastName,
          m.academicUnit,
          m.subject,
          m.documentType,
          m.grade,
          m.year,
          m.advisor,
          m.abstract,
          ...m.keywords,
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'es');
        if (sortBy === 'author')
          return a.studentLastName.localeCompare(b.studentLastName, 'es');
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [monographs, searchQuery, selectedUnit, selectedSubject, selectedDocType, selectedYear, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUnit('all');
    setSelectedSubject('all');
    setSelectedDocType('all');
    setSelectedYear('all');
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DEL REPOSITORIO INSTITUCIONAL GRADO 11 */}
      <div className="bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] rounded-2xl p-6 sm:p-8 text-white border border-violet-800/40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-violet-200" />
              <span>Repositorio Institucional · Monografías Grado 11°</span>
              <span aria-hidden="true">·</span>
              <span>Arquitectura Seguridad Mixta (4 Capas)</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Repositorio Académico de Monografías — Colegio Ekirayá
            </h1>
            <p className="text-violet-100/90 text-sm sm:text-base leading-relaxed">
              Explora, filtra y cita en 1 clic los trabajos de investigación monográfica de los
              estudiantes de <strong>Grado 11°</strong> organizados por{' '}
              <strong>Unidades Académicas</strong>. El catálogo de metadatos es público con
              protección de identidad, y el acceso a los documentos completos está protegido para
              cuentas institucionales (<code>@cem.edu.co</code>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-violet-950 hover:bg-violet-50 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Database className="w-4 h-4 text-violet-700" />
              <span>Conectar Drive + Sheets (Apps Script)</span>
            </button>

            {isVerifiedInstitutional ? (
              <a
                href={DRIVE_ROOT_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir Carpeta Raíz en Google Drive</span>
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
                className="px-4 py-2.5 rounded-xl bg-violet-800/70 hover:bg-violet-800 text-white border border-violet-500/40 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Desbloquear Documentos (@cem.edu.co)</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE ESTADO DE SEGURIDAD MIXTA (4 CAPAS ACTIVAS) */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                    Acceso Institucional Activo: {institutionalEmail} (Lectura completa habilitada)
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    Modo Visitante (Seguridad Mixta): Catálogo abierto · Autores abreviados ·
                    Documentos completos protegidos
                  </span>
                </>
              )}
            </span>
            {lastSyncDate && (
              <span className="text-violet-200">
                · Última sincronización Sheets: {lastSyncDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
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
                Soy estudiante o docente (@cem.edu.co) →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANEL DE BÚSQUEDA INDEXADA Y FILTROS MULTICRITERIO */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Buscador instantáneo */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor, asignatura, unidad académica, asesor, palabra clave o archivo..."
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

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-violet-700 shrink-0" />
            <label htmlFor="repoSortSelect" className="text-xs font-semibold text-slate-600">
              Ordenar:
            </label>
            <select
              id="repoSortSelect"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'author')}
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="recent">Más recientes primero</option>
              <option value="title">Título (A - Z)</option>
              <option value="author">Apellido del autor (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Filtros por Unidad Académica, Asignatura, Tipo y Año */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Unidad Académica
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setSelectedSubject('all');
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas las Unidades ({academicUnits.length})</option>
              {academicUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Asignatura / Área
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todas las Asignaturas ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Tipo de Documento
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los Tipos</option>
              <option value="Monografía de Grado">Monografía de Grado</option>
              <option value="Proyecto de Investigación">Proyecto de Investigación</option>
              <option value="Ensayo Académico">Ensayo Académico</option>
              <option value="Informe Experimental">Informe Experimental</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Año / Promoción (Grado 11°)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="all">Todos los Años</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Promoción {y} (Grado 11°)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de resultados y filtros activos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-violet-700" />
            <span>
              Mostrando <strong>{filteredMonographs.length}</strong> de{' '}
              <strong>{monographs.length}</strong> trabajos indexados en el repositorio
            </span>
          </div>

          {(searchQuery ||
            selectedUnit !== 'all' ||
            selectedSubject !== 'all' ||
            selectedDocType !== 'all' ||
            selectedYear !== 'all') && (
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

      {/* LISTADO DE TARJETAS DE MONOGRAFÍAS INDEXADAS */}
      {filteredMonographs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron monografías con esos criterios de búsqueda
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Intenta buscar con otros términos o restablece los filtros de unidad académica y
            asignatura.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 transition-colors"
          >
            Ver todas las monografías
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMonographs.map((doc) => {
            const displayAuthor = formatProtectedStudentName(
              doc.studentFirstName,
              doc.studentLastName,
              isVerifiedInstitutional
            );

            return (
              <article
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xs transition-all"
              >
                <div className="space-y-3">
                  {/* Encabezado de la tarjeta: Unidad Académica + Tipo + Año */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-violet-900 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
                      {doc.academicUnit}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {doc.documentType}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        {doc.grade} · {doc.year}
                      </span>
                    </div>
                  </div>

                  {/* Título de la Monografía */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  {/* Metadatos del Estudiante, Asignatura y Asesor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-500 block">Autor(a) Estudiante:</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                        <span>{displayAuthor}</span>
                        {!isVerifiedInstitutional && (
                          <span
                            className="text-[10px] font-normal text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded"
                            title="Nombre abreviado por protección de datos escolares"
                          >
                            Protegido
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Asignatura y Asesor:</span>
                      <span className="font-medium text-slate-800">
                        {doc.subject} · {doc.advisor}
                      </span>
                    </div>
                  </div>

                  {/* Resumen / Abstract */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {doc.abstract}
                  </p>

                  {/* Palabras clave */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {doc.keywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setSearchQuery(kw)}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-900 transition-colors"
                      >
                        #{kw}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pie de Tarjeta: Acciones de Seguridad Mixta + Citar en 1 Clic */}
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
                        <span>Abrir Vista Previa ({doc.format})</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ver Documento (@cem.edu.co)</span>
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

      {/* RESUMEN DE LAS 4 CAPAS DE SEGURIDAD APLICADAS */}
      <section className="bg-[#FAF5FF] rounded-2xl border border-violet-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-700 shrink-0" />
            <h3 className="text-base font-bold text-violet-950">
              Arquitectura de Seguridad Mixta Activa en el Repositorio
            </h3>
          </div>
          <span className="text-xs font-semibold text-violet-800 bg-white px-3 py-1 rounded-lg border border-violet-200">
            Protección de Menores y Propiedad Intelectual Escolar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-4 rounded-xl border border-violet-100 space-y-1">
            <div className="font-bold text-violet-950">Capa 1 · Verificación @cem.edu.co</div>
            <p className="text-slate-600 leading-relaxed">
              Los visitantes externos pueden consultar temas y resúmenes, pero la apertura de
              documentos exige validar un correo institucional del colegio.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-violet-100 space-y-1">
            <div className="font-bold text-violet-950">Capa 2 · Permisos de Dominio en Drive</div>
            <p className="text-slate-600 leading-relaxed">
              La carpeta raíz de Google Drive se configura como <em>Lector exclusivo para Colegio Ekirayá</em>, impidiendo que enlaces filtrados abran fuera del dominio.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-violet-100 space-y-1">
            <div className="font-bold text-violet-950">Capa 3 · Filtro en Apps Script</div>
            <p className="text-slate-600 leading-relaxed">
              El Web App JSON solo publica filas con estado <code>Publicado</code> y valida el token
              institucional, sin exponer notas ni correos personales.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-violet-100 space-y-1">
            <div className="font-bold text-violet-950">Capa 4 · Iniciales + Visor /preview</div>
            <p className="text-slate-600 leading-relaxed">
              En vista pública se abrevian los nombres a iniciales académicas (
              <code>Apellido, N.</code>) y los textos se leen en visor embebido sin descarga directa.
            </p>
          </div>
        </div>
      </section>

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
                    Capa 1 de Seguridad Mixta · Acceso a Monografías Completas
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
                <strong>Documento solicitado:</strong> {pendingPreviewDoc.title}
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Para proteger los derechos de autor y la privacidad de los estudiantes de{' '}
              <strong>Grado 11°</strong>, ingresa tu correo institucional del colegio (
              <code>@cem.edu.co</code>) para desbloquear la lectura completa de documentos y el
              acceso a Google Drive:
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
                  placeholder="ejemplo@cem.edu.co"
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
                  Verificar y Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VISOR DE DOCUMENTOS PROTEGIDO (MODO SOLO LECTURA /PREVIEW)
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Barra superior del visor */}
            <div className="p-4 bg-[#4C1D95] text-white flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-violet-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>
                    Visor Académico de Solo Lectura · Propiedad Intelectual Colegio Ekirayá (
                    {institutionalEmail})
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
                  href={previewDoc.driveUrl || DRIVE_ROOT_FOLDER_URL}
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

            {/* Ficha técnica + Iframe de Google Drive */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <div>
                <strong>Autor(a):</strong> {previewDoc.studentLastName},{' '}
                {previewDoc.studentFirstName} · <strong>Unidad:</strong> {previewDoc.academicUnit} ·{' '}
                <strong>Asesor:</strong> {previewDoc.advisor}
              </div>
              <span className="font-mono text-[11px] text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                Archivo: {previewDoc.fileName}
              </span>
            </div>

            <div className="flex-1 bg-slate-50 relative">
              <iframe
                title={`Vista previa de ${previewDoc.title}`}
                src={
                  previewDoc.driveFileId && previewDoc.driveFileId !== DRIVE_ROOT_FOLDER_ID
                    ? `https://drive.google.com/file/d/${previewDoc.driveFileId}/preview`
                    : `https://drive.google.com/embeddedfolderview?id=${DRIVE_ROOT_FOLDER_ID}#list`
                }
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ASISTENTE DE CONEXIÓN GOOGLE DRIVE + SHEETS + APPS SCRIPT
         ========================================================================= */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#4C1D95] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-violet-200 shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Configuración del Flujo: Google Drive → Google Sheets → Apps Script → Cita
                    Master
                  </h3>
                  <p className="text-xs text-violet-200">
                    Carpeta Raíz Configurada: {DRIVE_ROOT_FOLDER_ID}
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
              {/* Conector en Vivo */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-3">
                <h4 className="text-sm sm:text-base font-bold text-violet-950 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-violet-700" />
                  <span>Conectar URL de tu Web App de Google Apps Script</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Una vez publiques el script en tu hoja de cálculo de Google Sheets, pega aquí la
                  URL del Web App (terminada en <code>/exec</code>) para sincronizar las
                  monografías en vivo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL de la Aplicación Web (Google Apps Script)
                    </label>
                    <input
                      type="url"
                      value={appsScriptUrl}
                      onChange={(e) => setAppsScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token Institucional (Capa 3)
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
                  <span className="text-[11px] text-slate-500">
                    La configuración queda guardada en el navegador y solo muestra filas con{' '}
                    <code>Estado = Publicado</code>.
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncFromAppsScript}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                  </button>
                </div>
              </div>

              {/* Guía rápida en 3 pasos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-violet-950">
                    Paso 1 · Permisos en Google Drive
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    En la carpeta <code>1Tnh99KMMX06tFfNQQt_zumwOcvhOxvXC</code>, configura el
                    acceso general como{' '}
                    <strong>“Colegio Ekirayá (cem.edu.co) → Lector”</strong>. Así ningún externo
                    podrá abrir los PDFs aunque obtenga el enlace.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-violet-950">
                    Paso 2 · Hoja de Google Sheets
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Crea una hoja de cálculo en blanco, abre{' '}
                    <strong>Extensiones → Apps Script</strong>, pega el código inferior y ejecuta{' '}
                    <code>sincronizarRepositorioDrive</code>. Se llenarán todas las carpetas por
                    Unidad Académica y Estudiante.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-violet-950">
                    Paso 3 · Publicar como Aplicación Web
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    En Apps Script haz clic en{' '}
                    <strong>Implementar → Nueva implementación → Aplicación web</strong> (Ejecutar
                    como: <em>Yo</em>, Acceso: <em>Cualquier persona</em>) y pega la URL arriba.
                  </p>
                </div>
              </div>

              {/* Código Google Apps Script preconfigurado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Code2 className="w-4 h-4 text-violet-700" />
                    <span>
                      Código Google Apps Script (Preconfigurado con tu carpeta{' '}
                      {DRIVE_ROOT_FOLDER_ID})
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
