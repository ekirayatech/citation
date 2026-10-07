/**
 * ============================================================================
 * COLEGIO EKIRAYÁ · CITA MASTER — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * Backend de integración para Google Sheets y Google Drive del Repositorio de
 * Monografías (Proyecto de Vida) del Colegio Ekirayá.
 * 
 * Jerarquía en Google Drive:
 *   REPOSITORIO PV (ID: 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii)
 *     └── Unidades Académicas
 *           ├── [Unidad Académica] (ej: Ciencias, Música, Psicología, Aviación...)
 *           │     └── [Año] (ej: 2025, 2026, 2027)
 *           │           └── [archivo_monografia.pdf]
 *
 * Hojas en Google Sheets:
 *   1. "repositorio" (17 columnas dinámicas):
 *      documento_id, titulo, autor, grado, año, Unidad Académica,
 *      Linea de investigación, tipo, palabras_clave, resumen, Asesor(es),
 *      drive_file_id, url_documento, visibilidad, estado, fecha_registro,
 *      fecha_actualizacion
 *
 *   2. "usuarios" (5 columnas dinámicas):
 *      Nombres, Curso, Correo, Sección, Perfil (Administrador | Docente | Estudiante)
 * ============================================================================
 */

const CONFIG = {
  ROOT_FOLDER_ID: '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii', // Carpeta raíz REPOSITORIO PV
  ROOT_FOLDER_NAME: 'REPOSITORIO PV',
  SUBFOLDER_NIVEL_1: 'Unidades Académicas',
  SPREADSHEET_ID: '1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs', // ID de la hoja de cálculo
  SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
  REPO_SHEET_NAME: 'repositorio',
  USERS_SHEET_NAME: 'usuarios',
  INSTITUTIONAL_TOKEN: 'EKIRAYA-2026',
  DOMINIOS_AUTORIZADOS: ['@cem.edu.co', '@est.cem.edu.co', '@ekiraya.edu.co'],
  VERCEL_ORIGIN: 'https://cotationeki.vercel.app'
};

/**
 * Resuelve y abre la hoja de cálculo activa o remota (funciona tanto para proyectos
 * vinculados a la hoja como para scripts independientes en script.google.com).
 */
function obtenerSpreadsheet(ssParam, params) {
  if (ssParam) return ssParam;
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  const p = params || {};
  const candidateId = p.spreadsheetId || p.sheetId || CONFIG.SPREADSHEET_ID;
  if (candidateId) {
    try {
      const ss = SpreadsheetApp.openById(String(candidateId).trim());
      if (ss) return ss;
    } catch (e) {}
  }

  const candidateUrl = p.connectionUrl || p.sheetUrl || CONFIG.SPREADSHEET_URL;
  if (candidateUrl) {
    try {
      const ss = SpreadsheetApp.openByUrl(String(candidateUrl).trim());
      if (ss) return ss;
    } catch (e) {}
  }

  return null;
}

const ENCABEZADOS_REPOSITORIO_ESPERADOS = [
  'documento_id',
  'titulo',
  'autor',
  'grado',
  'año',
  'Unidad Académica',
  'Linea de investigación',
  'tipo',
  'palabras_clave',
  'resumen',
  'Asesor(es)',
  'drive_file_id',
  'url_documento',
  'visibilidad',
  'estado',
  'fecha_registro',
  'fecha_actualizacion'
];

const ENCABEZADOS_USUARIOS_ESPERADOS = [
  'Nombres',
  'Curso',
  'Correo',
  'Sección',
  'Perfil'
];

/**
 * Menú contextual al abrir la hoja de cálculo
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('👥 Verificar hojas repositorio y usuarios', 'verificarEstructuraHojas')
    .addToUi();
}

/**
 * Normaliza nombres de encabezados para mapeo insensible a mayúsculas, tildes y símbolos
 */
function normalizarClave(texto) {
  if (!texto) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitiza valores de texto para evitar vulnerabilidades XSS en el cliente
 */
function sanitizarTexto(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor !== 'string') return String(valor);
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * TAREA 1: Mapeo Dinámico de Columnas en Google Sheets
 * Lee la Fila 1 de cualquier hoja y genera un mapa de columna por nombre normalizado
 * @param {Sheet} hoja - Hoja de Google Sheets
 * @returns {Object} Mapa de nombres normalizados a índices basados en 1 (columna 1 = A)
 */
function obtenerMapaColumnas(hoja) {
  if (!hoja) return { mapa: {}, headers: [], totalColumnas: 0 };
  const lastCol = Math.max(1, hoja.getLastColumn());
  const headers = hoja.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const mapa = {};

  headers.forEach(function(h, idx) {
    const raw = String(h || '').trim();
    if (!raw) return;
    const colNum = idx + 1; // 1-based index
    const norm = normalizarClave(raw);
    mapa[norm] = colNum;
    mapa[raw] = colNum;

    // Alias semánticos
    if (/^correo/.test(norm) || /email|mail|cuenta/.test(norm)) mapa['correo_alias'] = colNum;
    if (/^nombre/.test(norm) || /usuario|estudiante/.test(norm)) mapa['nombre_alias'] = colNum;
    if (/^perfil|rol|cargo|estamento/.test(norm)) mapa['perfil_alias'] = colNum;
    if (/^curso|grado|nivel/.test(norm)) mapa['curso_alias'] = colNum;
    if (/^seccion|area|dependencia/.test(norm)) mapa['seccion_alias'] = colNum;
    if (/^url document|enlace document|link document|drive url/.test(norm)) mapa['url_alias'] = colNum;
    if (/^drive file id|file id|id drive/.test(norm)) mapa['drive_id_alias'] = colNum;
  });

  return { mapa: mapa, headers: headers, totalColumnas: lastCol };
}

/**
 * Helper para obtener el índice de columna según una lista de nombres candidatos
 */
function resolverColumna(mapa, candidatos) {
  for (let i = 0; i < candidatos.length; i++) {
    const norm = normalizarClave(candidatos[i]);
    if (mapa[norm] !== undefined) return mapa[norm];
    if (mapa[candidatos[i]] !== undefined) return mapa[candidatos[i]];
  }
  return null;
}

/**
 * Obtiene o crea la hoja "repositorio" asegurando los 17 encabezados esperados
 */
function obtenerOCrearHojaRepositorio(ssParam, params) {
  const ss = obtenerSpreadsheet(ssParam, params);
  if (!ss) return null;
  let hoja = ss.getSheetByName(CONFIG.REPO_SHEET_NAME);
  if (!hoja) {
    const all = ss.getSheets();
    for (let i = 0; i < all.length; i++) {
      if (all[i].getName().trim().toLowerCase() === 'repositorio') {
        hoja = all[i];
        break;
      }
    }
  }

  if (!hoja) {
    hoja = ss.insertSheet(CONFIG.REPO_SHEET_NAME, 0);
    hoja.appendRow(ENCABEZADOS_REPOSITORIO_ESPERADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS_REPOSITORIO_ESPERADOS.length)
      .setFontWeight('bold')
      .setBackground('#664d88')
      .setFontColor('#ffffff');
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS_REPOSITORIO_ESPERADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS_REPOSITORIO_ESPERADOS.length)
      .setFontWeight('bold')
      .setBackground('#664d88')
      .setFontColor('#ffffff');
  }

  return hoja;
}

/**
 * Obtiene o crea la hoja "usuarios" asegurando los 5 encabezados esperados
 */
function obtenerOCrearHojaUsuarios(ssParam, params) {
  const ss = obtenerSpreadsheet(ssParam, params);
  if (!ss) return null;
  let hoja = ss.getSheetByName(CONFIG.USERS_SHEET_NAME);
  if (!hoja) {
    const all = ss.getSheets();
    for (let i = 0; i < all.length; i++) {
      const name = all[i].getName().trim().toLowerCase();
      if (name === 'usuarios' || name === 'usuario') {
        hoja = all[i];
        break;
      }
    }
  }

  if (!hoja) {
    hoja = ss.insertSheet(CONFIG.USERS_SHEET_NAME);
    hoja.appendRow(ENCABEZADOS_USUARIOS_ESPERADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS_USUARIOS_ESPERADOS.length)
      .setFontWeight('bold')
      .setBackground('#44345c')
      .setFontColor('#ffffff');
    poblarUsuariosIniciales(hoja);
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS_USUARIOS_ESPERADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS_USUARIOS_ESPERADOS.length)
      .setFontWeight('bold')
      .setBackground('#44345c')
      .setFontColor('#ffffff');
    poblarUsuariosIniciales(hoja);
  }

  return hoja;
}

function poblarUsuariosIniciales(userSheet) {
  const initialUsers = [
    ['Esteban Bolaños R', 'Docente', 'mebolanos@cem.edu.co', 'Academia', 'Administrador'],
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
    ['Biblioteca y Centro de Recursos', 'No clases', 'biblioteca@cem.edu.co', 'Biblioteca', 'Docente'],
    ['Secretaría Académica Ekirayá', 'No clases', 'secretaria@cem.edu.co', 'Administración', 'Docente']
  ];
  userSheet.getRange(2, 1, initialUsers.length, 5).setValues(initialUsers);
}

function verificarEstructuraHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  obtenerOCrearHojaRepositorio(ss);
  obtenerOCrearHojaUsuarios(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Estructura verificada: Hojas "repositorio" y "usuarios" configuradas correctamente.');
}

/**
 * TAREA 1: Escaneo Recursivo de Google Drive según jerarquía:
 * REPOSITORIO PV / Unidades Académicas / [Unidad Académica] / [Año] / [Archivo.pdf]
 */
function sincronizarRepositorioDrive(ssParam, params) {
  const hoja = obtenerOCrearHojaRepositorio(ssParam, params);
  if (!hoja) throw new Error('No se pudo abrir la hoja "repositorio"');

  const { mapa, headers, totalColumnas } = obtenerMapaColumnas(hoja);

  // Obtener índices exactos para deduplicación
  const colDriveId = resolverColumna(mapa, ['drive_file_id', 'drive_id_alias']);
  const colUrlDoc = resolverColumna(mapa, ['url_documento', 'url_alias']);
  const colTitulo = resolverColumna(mapa, ['titulo']);
  const colAno = resolverColumna(mapa, ['año', 'ano']);
  const colUnidad = resolverColumna(mapa, ['Unidad Académica', 'unidad academica', 'unidad']);
  const colDocId = resolverColumna(mapa, ['documento_id', 'id']);
  const colEstado = resolverColumna(mapa, ['estado']);
  const colVisibilidad = resolverColumna(mapa, ['visibilidad']);
  const colFechaReg = resolverColumna(mapa, ['fecha_registro']);
  const colFechaAct = resolverColumna(mapa, ['fecha_actualizacion']);

  // Construir set de monografías existentes para evitar duplicados
  const existingKeys = new Set();
  const lastRow = hoja.getLastRow();
  if (lastRow > 1) {
    const dataRange = hoja.getRange(2, 1, lastRow - 1, totalColumnas).getValues();
    dataRange.forEach(function(row) {
      if (colDriveId && row[colDriveId - 1]) existingKeys.add(String(row[colDriveId - 1]).trim());
      if (colUrlDoc && row[colUrlDoc - 1]) existingKeys.add(String(row[colUrlDoc - 1]).trim());
      if (colTitulo && row[colTitulo - 1]) {
        const u = colUnidad && row[colUnidad - 1] ? String(row[colUnidad - 1]).trim() : '';
        const a = colAno && row[colAno - 1] ? String(row[colAno - 1]).trim() : '';
        existingKeys.add((String(row[colTitulo - 1]).trim() + '|' + u + '|' + a).toLowerCase());
      }
    });
  }

  // 1. Ubicar la carpeta raíz REPOSITORIO PV
  let rootFolder = null;
  try {
    rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  } catch (e) {
    const foldersByName = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (foldersByName.hasNext()) rootFolder = foldersByName.next();
  }

  if (!rootFolder) {
    throw new Error('Carpeta raíz "' + CONFIG.ROOT_FOLDER_NAME + '" no encontrada (ID: ' + CONFIG.ROOT_FOLDER_ID + ')');
  }

  // 2. Ubicar la subcarpeta fija Nivel 1: "Unidades Académicas"
  let unidadesFolder = null;
  const subNivel1 = rootFolder.getFolders();
  while (subNivel1.hasNext()) {
    const f = subNivel1.next();
    if (normalizarClave(f.getName()) === normalizarClave(CONFIG.SUBFOLDER_NIVEL_1)) {
      unidadesFolder = f;
      break;
    }
  }

  // Si no se encuentra "Unidades Académicas" explícita, se usa rootFolder
  const folderToScan = unidadesFolder || rootFolder;

  const nuevasFilas = [];
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd');

  // 3. Recorrer Nivel 2: Cada Unidad Académica (Ciencias, Música, Psicología, etc.)
  const unidadFolders = folderToScan.getFolders();
  while (unidadFolders.hasNext()) {
    const unidadFolder = unidadFolders.next();
    const nombreUnidad = unidadFolder.getName().trim();

    // 4. Recorrer Nivel 3: Subcarpetas por Año (2025, 2026, 2027)
    const anoFolders = unidadFolder.getFolders();
    let hayCarpetasAno = false;

    while (anoFolders.hasNext()) {
      hayCarpetasAno = true;
      const anoFolder = anoFolders.next();
      const nombreAno = anoFolder.getName().trim();

      // 5. Nivel 4: Leer archivos PDF dentro de la carpeta del año
      procesarArchivosPDFEnCarpeta(
        anoFolder,
        nombreUnidad,
        nombreAno,
        headers,
        mapa,
        existingKeys,
        nuevasFilas,
        fechaHoy
      );
    }

    // Si la unidad académica contiene PDFs directamente (sin subcarpeta de año)
    if (!hayCarpetasAno) {
      procesarArchivosPDFEnCarpeta(
        unidadFolder,
        nombreUnidad,
        '2026',
        headers,
        mapa,
        existingKeys,
        nuevasFilas,
        fechaHoy
      );
    }
  }

  // Insertar nuevas filas en lote para máxima velocidad
  if (nuevasFilas.length > 0) {
    hoja.getRange(hoja.getLastRow() + 1, 1, nuevasFilas.length, headers.length).setValues(nuevasFilas);
    SpreadsheetApp.flush();
  }

  return {
    status: 'success',
    agregadas: nuevasFilas.length,
    total: hoja.getLastRow() - 1,
    timestamp: new Date().toISOString()
  };
}

function procesarArchivosPDFEnCarpeta(folder, unidad, ano, headers, mapa, existingKeys, nuevasFilas, fechaHoy) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const mime = file.getMimeType();

    // Solo archivos PDF o con extensión .pdf
    const isPdf = mime === MimeType.PDF || /\.pdf$/i.test(fileName);
    if (!isPdf) continue;

    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileKey = (fileName.replace(/\.pdf$/i, '').trim() + '|' + unidad + '|' + ano).toLowerCase();

    // Control de duplicados
    if (existingKeys.has(fileId) || existingKeys.has(fileUrl) || existingKeys.has(fileKey)) {
      continue;
    }

    const docId = String(Math.floor(1000 + Math.random() * 9000));
    const tituloLimpio = fileName.replace(/\.[^/.]+$/, '').trim();

    // Construir fila alineada con el mapa dinámico de columnas de la hoja
    const nuevaFila = new Array(headers.length).fill('');

    headers.forEach(function(h, idx) {
      const norm = normalizarClave(h);
      if (/^documento id|^id$/.test(norm)) nuevaFila[idx] = docId;
      else if (/^titulo/.test(norm)) nuevaFila[idx] = tituloLimpio;
      else if (/^ano|^año/.test(norm)) nuevaFila[idx] = ano;
      else if (/^unidad academica|^unidad/.test(norm)) nuevaFila[idx] = unidad;
      else if (/^drive file id|^file id/.test(norm)) nuevaFila[idx] = fileId;
      else if (/^url documento|^url/.test(norm)) nuevaFila[idx] = fileUrl;
      else if (/^estado/.test(norm)) nuevaFila[idx] = 'Finalizado';
      else if (/^visibilidad/.test(norm)) nuevaFila[idx] = 'Digital';
      else if (/^tipo/.test(norm)) nuevaFila[idx] = 'Investigación';
      else if (/^fecha registro/.test(norm)) nuevaFila[idx] = fechaHoy;
      else if (/^fecha actualizacion/.test(norm)) nuevaFila[idx] = fechaHoy;
      else if (/^grado/.test(norm)) nuevaFila[idx] = '11';
    });

    existingKeys.add(fileId);
    existingKeys.add(fileUrl);
    existingKeys.add(fileKey);
    nuevasFilas.push(nuevaFila);
  }
}

/**
 * TAREA 1: Time-driven Trigger automático cada 24 horas
 */
function instalarTriggerSincronizacion() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sincronizarRepositorioDrive') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('sincronizarRepositorioDrive')
    .timeBased()
    .everyDays(1)
    .atHour(2) // 2:00 AM hora local
    .create();

  if (SpreadsheetApp.getActiveSpreadsheet()) {
    SpreadsheetApp.getUi().alert('⏰ Activador programado: Escaneo automático de Drive configurado cada 24 horas.');
  }
}

/**
 * TAREA 2: Leer todas las monografías mapeando dinámicamente las 17 columnas
 */
function apiGetMonografias(ssParam) {
  const hoja = obtenerOCrearHojaRepositorio(ssParam);
  if (!hoja || hoja.getLastRow() <= 1) {
    return { status: 'success', total: 0, headers: ENCABEZADOS_REPOSITORIO_ESPERADOS, data: [] };
  }

  const { headers } = obtenerMapaColumnas(hoja);
  const rawValues = hoja.getDataRange().getDisplayValues();
  const rows = [];

  for (let r = 1; r < rawValues.length; r++) {
    const rowValues = rawValues[r];
    const isEmpty = rowValues.every(function(cell) { return !String(cell || '').trim(); });
    if (isEmpty) continue;

    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      const colTitle = headers[c];
      rowObj[colTitle] = sanitizarTexto(rowValues[c] || '');
    }
    rows.push(rowObj);
  }

  return {
    status: 'success',
    total: rows.length,
    headers: headers,
    data: rows,
    timestamp: new Date().toISOString()
  };
}

/**
 * TAREA 2: Verificar el rol y membresía institucional de un usuario
 */
function apiCheckUserRole(email, ssParam) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { status: 'error', authorized: false, message: 'Correo institucional no especificado' };
  }

  // Validación de dominio institucional
  const esDominioValido = CONFIG.DOMINIOS_AUTORIZADOS.some(function(dom) {
    return cleanEmail.endsWith(dom);
  });

  if (!esDominioValido) {
    return {
      status: 'error',
      authorized: false,
      message: 'Dominio no permitido. Solo se aceptan correos @cem.edu.co o @ekiraya.edu.co',
      email: cleanEmail
    };
  }

  const hoja = obtenerOCrearHojaUsuarios(ssParam);
  if (!hoja || hoja.getLastRow() <= 1) {
    return { status: 'error', authorized: false, message: 'Hoja de usuarios no contiene registros', email: cleanEmail };
  }

  const { mapa, headers } = obtenerMapaColumnas(hoja);
  const colCorreo = resolverColumna(mapa, ['Correo', 'correo_alias']);
  const colPerfil = resolverColumna(mapa, ['Perfil', 'perfil_alias']);
  const colNombre = resolverColumna(mapa, ['Nombres', 'nombre_alias']);
  const colCurso = resolverColumna(mapa, ['Curso', 'curso_alias']);
  const colSeccion = resolverColumna(mapa, ['Sección', 'seccion_alias']);

  const values = hoja.getDataRange().getDisplayValues();
  let foundUser = null;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowMail = colCorreo ? String(row[colCorreo - 1] || '').trim().toLowerCase() : '';
    if (rowMail === cleanEmail) {
      const perfilRaw = colPerfil ? String(row[colPerfil - 1] || '').trim() : 'Estudiante';
      const nombresRaw = colNombre ? String(row[colNombre - 1] || '').trim() : cleanEmail.split('@')[0];
      const cursoRaw = colCurso ? String(row[colCurso - 1] || '').trim() : 'General';
      const seccionRaw = colSeccion ? String(row[colSeccion - 1] || '').trim() : 'General';

      foundUser = {
        nombres: sanitizarTexto(nombresRaw),
        correo: cleanEmail,
        curso: sanitizarTexto(cursoRaw),
        seccion: sanitizarTexto(seccionRaw),
        perfil: sanitizarTexto(perfilRaw),
        isAdmin: cleanEmail === 'mebolanos@cem.edu.co' || /admin|administrador|coordinador|directivo/i.test(perfilRaw)
      };
      break;
    }
  }

  if (!foundUser) {
    const isStudentDomain = cleanEmail.endsWith('@est.cem.edu.co');
    const isAdmin = cleanEmail === 'mebolanos@cem.edu.co';
    const usernamePart = cleanEmail.split('@')[0];
    const formattedName = usernamePart
      .split(/[._-]/)
      .map(function(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); })
      .join(' ');

    const inferredPerfil = isAdmin ? 'Administrador' : (isStudentDomain ? 'Estudiante' : 'Docente');

    foundUser = {
      nombres: isAdmin ? 'Esteban Bolaños R' : (formattedName || cleanEmail),
      correo: cleanEmail,
      curso: isStudentDomain ? '11°' : 'Docente',
      seccion: isStudentDomain ? 'Bachillerato' : 'Academia',
      perfil: inferredPerfil,
      isAdmin: isAdmin || /admin|administrador/i.test(inferredPerfil)
    };

    if (isAdmin) {
      hoja.appendRow([foundUser.nombres, foundUser.curso, foundUser.correo, foundUser.seccion, foundUser.perfil]);
      SpreadsheetApp.flush();
    }
  }

  return {
    status: 'success',
    authorized: true,
    email: cleanEmail,
    perfil: foundUser.perfil,
    isAdmin: foundUser.isAdmin,
    user: foundUser
  };
}

/**
 * TAREA 2: Gestión de usuarios (Crear, Editar, Eliminar)
 */
function apiManageUser(params, ssParam) {
  const p = params || {};
  const hoja = obtenerOCrearHojaUsuarios(ssParam, p);
  if (!hoja) {
    return {
      status: 'error',
      success: false,
      message: 'No se pudo abrir la hoja de usuarios en Google Sheets. Verifica que el ID de la hoja sea correcto.'
    };
  }

  const subAction = String(p.subAction || p.manageAction || p.action || 'add').toLowerCase();
  const { mapa, headers } = obtenerMapaColumnas(hoja);

  // Resolver columnas con fallbacks robustos
  let colCorreo = resolverColumna(mapa, ['Correo', 'correo', 'email', 'correo_alias', 'correo institucional', 'cuenta']);
  if (!colCorreo) {
    for (let c = 0; c < headers.length; c++) {
      if (/correo|email|mail/i.test(headers[c])) { colCorreo = c + 1; break; }
    }
  }
  if (!colCorreo) colCorreo = 3;

  let colNombre = resolverColumna(mapa, ['Nombres', 'nombre', 'nombres', 'nombre_alias', 'estudiante', 'usuario']);
  if (!colNombre) {
    for (let c = 0; c < headers.length; c++) {
      if (/nombre|estudiante|usuario/i.test(headers[c])) { colNombre = c + 1; break; }
    }
  }
  if (!colNombre) colNombre = 1;

  let colCurso = resolverColumna(mapa, ['Curso', 'curso', 'grado', 'curso_alias']);
  if (!colCurso) {
    for (let c = 0; c < headers.length; c++) {
      if (/curso|grado/i.test(headers[c])) { colCurso = c + 1; break; }
    }
  }
  if (!colCurso) colCurso = 2;

  let colSeccion = resolverColumna(mapa, ['Sección', 'seccion', 'area', 'seccion_alias']);
  if (!colSeccion) {
    for (let c = 0; c < headers.length; c++) {
      if (/secci[oó]n|area/i.test(headers[c])) { colSeccion = c + 1; break; }
    }
  }
  if (!colSeccion) colSeccion = 4;

  let colPerfil = resolverColumna(mapa, ['Perfil', 'perfil', 'rol', 'perfil_alias', 'cargo']);
  if (!colPerfil) {
    for (let c = 0; c < headers.length; c++) {
      if (/perfil|rol|cargo|admin/i.test(headers[c])) { colPerfil = c + 1; break; }
    }
  }
  if (!colPerfil) colPerfil = 5;

  const targetEmail = String(p.originalEmail || p.originalCorreo || p.correo || p.email || '').trim().toLowerCase();
  const newEmail = String(p.correo || p.email || targetEmail).trim().toLowerCase();
  const nombre = String(p.nombres || p.nombre || '').trim();
  const curso = String(p.curso || 'General').trim();
  const seccion = String(p.seccion || 'General').trim();
  const perfil = String(p.perfil || p.rol || 'Estudiante').trim();

  const values = hoja.getDataRange().getDisplayValues();
  let foundRowIdx = -1;

  for (let r = 1; r < values.length; r++) {
    const rowMail = colCorreo ? String(values[r][colCorreo - 1] || '').trim().toLowerCase() : '';
    const rowName = colNombre ? String(values[r][colNombre - 1] || '').trim().toLowerCase() : '';

    if (targetEmail && rowMail === targetEmail) {
      foundRowIdx = r + 1;
      break;
    }
    if (newEmail && rowMail === newEmail) {
      foundRowIdx = r + 1;
      break;
    }
    // Si no coincidió por correo, verificar coincidencia exacta por nombre
    if (!targetEmail && nombre && rowName === nombre.toLowerCase()) {
      foundRowIdx = r + 1;
      break;
    }
  }

  if (subAction === 'delete' || subAction === 'deleteuser') {
    if (foundRowIdx > 1) {
      hoja.deleteRow(foundRowIdx);
      SpreadsheetApp.flush();
      return { status: 'success', success: true, message: 'Usuario ' + targetEmail + ' eliminado exitosamente de Google Sheets' };
    }
    return { status: 'error', success: false, message: 'Usuario ' + targetEmail + ' no encontrado para eliminar' };
  }

  if (foundRowIdx > 1) {
    // Actualizar directamente en las celdas de la fila encontrada
    if (nombre) hoja.getRange(foundRowIdx, colNombre).setValue(nombre);
    if (curso) hoja.getRange(foundRowIdx, colCurso).setValue(curso);
    if (newEmail) hoja.getRange(foundRowIdx, colCorreo).setValue(newEmail);
    if (seccion) hoja.getRange(foundRowIdx, colSeccion).setValue(seccion);
    if (perfil) hoja.getRange(foundRowIdx, colPerfil).setValue(perfil);
  } else {
    // Si es un usuario nuevo, construir y anexar la fila
    const totalCols = Math.max(headers.length, 5);
    const nuevaFila = new Array(totalCols).fill('');

    headers.forEach(function(h, idx) {
      const norm = normalizarClave(h);
      if (/correo|email|mail|cuenta/.test(norm)) nuevaFila[idx] = newEmail;
      else if (/nombre|estudiante|usuario/.test(norm)) nuevaFila[idx] = nombre;
      else if (/curso|grado|nivel/.test(norm)) nuevaFila[idx] = curso;
      else if (/seccion|dependencia|area/.test(norm)) nuevaFila[idx] = seccion;
      else if (/perfil|rol|admin|cargo/.test(norm)) nuevaFila[idx] = perfil;
      else if (p[h] !== undefined) nuevaFila[idx] = String(p[h]).trim();
    });

    if (colNombre && !nuevaFila[colNombre - 1]) nuevaFila[colNombre - 1] = nombre;
    if (colCurso && !nuevaFila[colCurso - 1]) nuevaFila[colCurso - 1] = curso;
    if (colCorreo && !nuevaFila[colCorreo - 1]) nuevaFila[colCorreo - 1] = newEmail;
    if (colSeccion && !nuevaFila[colSeccion - 1]) nuevaFila[colSeccion - 1] = seccion;
    if (colPerfil && !nuevaFila[colPerfil - 1]) nuevaFila[colPerfil - 1] = perfil;

    hoja.appendRow(nuevaFila);
  }

  SpreadsheetApp.flush();

  return {
    status: 'success',
    success: true,
    message: 'Usuario ' + (foundRowIdx > 1 ? 'actualizado' : 'creado') + ' exitosamente en Google Sheets',
    user: { nombres: nombre, correo: newEmail, curso: curso, seccion: seccion, perfil: perfil }
  };
}

/**
 * TAREA 5: Construye respuestas estandarizadas JSON o JSONP
 */
function crearSalida(obj, callback) {
  const payload = JSON.stringify(obj);
  if (callback && String(callback).trim() !== '') {
    const cb = String(callback).replace(/[^a-zA-Z0-9_$.]/g, '');
    return ContentService.createTextOutput(cb + '(' + payload + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper para recopilar el estado completo de monografías y usuarios
 */
function obtenerEstadoCompleto(ssParam, params) {
  const monoRes = apiGetMonografias(ssParam, params);
  const userSheet = obtenerOCrearHojaUsuarios(ssParam, params);
  let uHeaders = ENCABEZADOS_USUARIOS_ESPERADOS;
  let uRows = [];

  if (userSheet) {
    const uMap = obtenerMapaColumnas(userSheet);
    uHeaders = uMap.headers;
    const uData = userSheet.getDataRange().getDisplayValues();
    for (let r = 1; r < uData.length; r++) {
      const rowObj = {};
      for (let c = 0; c < uHeaders.length; c++) {
        rowObj[uHeaders[c]] = uData[r][c] || '';
      }
      uRows.push(rowObj);
    }
  }

  return {
    headers: monoRes.headers,
    rows: monoRes.data,
    totalMonographs: monoRes.total,
    usuariosHeaders: uHeaders,
    usuariosRows: uRows,
    totalUsers: uRows.length
  };
}

/**
 * ENDPOINT GET (Web App)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = String(params.action || 'syncRepo').trim();
    const callback = params.callback || null;

    if (action === 'ping' || action === 'test') {
      return crearSalida({
        status: 'success',
        success: true,
        message: 'Apps Script de Cita Master conectado exitosamente',
        action: 'ping',
        folderId: CONFIG.ROOT_FOLDER_ID,
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      }, callback);
    }

    if (action === 'getMonografias') {
      return crearSalida(apiGetMonografias(null, params), callback);
    }

    if (action === 'checkUserRole') {
      const email = params.email || params.correo || '';
      return crearSalida(apiCheckUserRole(email, null, params), callback);
    }

    if (action === 'manageUser' || action === 'updateUser' || action === 'addUser') {
      if (action === 'updateUser') params.subAction = 'update';
      if (action === 'addUser') params.subAction = 'add';
      const res = apiManageUser(params, null);
      const estado = obtenerEstadoCompleto(null, params);
      return crearSalida(Object.assign({
        status: res.status,
        success: res.status === 'success',
        message: res.message
      }, estado), callback);
    }

    if (action === 'deleteUser') {
      params.subAction = 'delete';
      const res = apiManageUser(params, null);
      const estado = obtenerEstadoCompleto(null, params);
      return crearSalida(Object.assign({
        status: res.status,
        success: res.status === 'success',
        message: res.message
      }, estado), callback);
    }

    if (action === 'syncDrive') {
      const syncRes = sincronizarRepositorioDrive(null, params);
      const estado = obtenerEstadoCompleto(null, params);
      return crearSalida(Object.assign({
        status: 'success',
        success: true,
        syncResult: syncRes
      }, estado), callback);
    }

    // Default: syncRepo (compatibilidad completa)
    const estadoCompleto = obtenerEstadoCompleto(null, params);
    return crearSalida(Object.assign({
      status: 'success',
      success: true,
      action: 'syncRepo',
      folderId: CONFIG.ROOT_FOLDER_ID,
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      syncedAt: new Date().toISOString()
    }, estadoCompleto), callback);

  } catch (error) {
    return crearSalida({
      status: 'error',
      success: false,
      message: error.message || 'Error en ejecución de doGet'
    }, e && e.parameter ? e.parameter.callback : null);
  }
}

/**
 * ENDPOINT POST (Web App)
 */
function doPost(e) {
  try {
    let params = (e && e.parameter) ? Object.assign({}, e.parameter) : {};
    if (e && e.postData && e.postData.contents) {
      try {
        const bodyObj = JSON.parse(e.postData.contents);
        params = Object.assign(params, bodyObj);
      } catch (ex) {
        // Ignora si no es JSON
      }
    }

    const action = String(params.action || '').trim();

    if (action === 'syncDrive') {
      const adminEmail = String(params.email || params.correo || '').trim().toLowerCase();
      if (adminEmail) {
        const roleCheck = apiCheckUserRole(adminEmail, null, params);
        if (roleCheck.perfil !== 'Administrador' && adminEmail !== 'mebolanos@cem.edu.co') {
          return crearSalida({
            status: 'error',
            success: false,
            message: 'Acceso no autorizado: Solo el Administrador puede sincronizar Drive'
          });
        }
      }
      const syncRes = sincronizarRepositorioDrive(null, params);
      const estado = obtenerEstadoCompleto(null, params);
      return crearSalida(Object.assign({
        status: 'success',
        success: true,
        message: 'Sincronización de Drive completada exitosamente',
        data: syncRes
      }, estado));
    }

    if (action === 'manageUser' || action === 'updateUser' || action === 'addUser' || action === 'deleteUser') {
      const res = apiManageUser(params, null);
      const estado = obtenerEstadoCompleto(null, params);
      return crearSalida(Object.assign({
        status: res.status,
        success: res.status === 'success',
        message: res.message
      }, estado));
    }

    return doGet(e);

  } catch (error) {
    return crearSalida({
      status: 'error',
      success: false,
      message: error.message || 'Error en ejecución de doPost'
    });
  }
}
