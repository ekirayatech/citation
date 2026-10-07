/**
 * Código fuente para Google Apps Script (Code.gs)
 * Backend de lectura y sincronización de Google Sheets del Repositorio de Monografías (Proyecto de Vida)
 * Colegio Ekirayá - Educación Montessori
 */

export const APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * COLEGIO EKIRAYÁ · CITA MASTER — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * Jerarquía en Google Drive:
 *   REPOSITORIO PV (ID: 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii)
 *   └── Unidades Académicas
 *       ├── [Unidad Académica] (Ciencias, Música, Psicología, Aviación...)
 *       │   └── [Año] (2025, 2026, 2027)
 *       │       └── [archivo_monografia.pdf]
 *
 * Hojas en Google Sheets:
 * 1. "repositorio" (17 columnas dinámicas):
 *    documento_id, titulo, autor, grado, año, Unidad Académica,
 *    Linea de investigación, tipo, palabras_clave, resumen, Asesor(es),
 *    drive_file_id, url_documento, visibilidad, estado, fecha_registro,
 *    fecha_actualizacion
 *
 * 2. "usuarios" (Administrador y comunidad educativa):
 *    nombres, correo, perfil, estado
 * ============================================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1_JgI8DRjnvql9sruq54rFbwVBFelokqpIv2NkQKgZi0',
  SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1_JgI8DRjnvql9sruq54rFbwVBFelokqpIv2NkQKgZi0/edit',
  DRIVE_FOLDER_ID: '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii',
  REPO_SHEET_NAME: 'repositorio',
  USUARIOS_SHEET_NAME: 'usuarios',
  ADMIN_EMAIL: 'mebolanos@cem.edu.co',
  INSTITUTIONAL_TOKEN: 'EKIRAYA-2026',
  DOMINIOS_AUTORIZADOS: ['@cem.edu.co', '@est.cem.edu.co']
};

/**
 * Resuelve y abre la hoja de cálculo activa o remota.
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

/**
 * Manejador principal para peticiones GET (Lectura de monografías, JSONP y estado)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = (params.action || 'syncRepo').toLowerCase();
    const callback = params.callback || params.jsonp;

    const ss = obtenerSpreadsheet(null, params);
    if (!ss) {
      return jsonResponse({
        success: false,
        error: 'No se pudo abrir la hoja de cálculo. Verifica el ID: ' + CONFIG.SPREADSHEET_ID,
        headers: ENCABEZADOS_REPOSITORIO_ESPERADOS,
        rows: []
      }, callback);
    }

    // Acción 1: Escanear carpeta de Drive y sincronizar con la hoja Repositorio
    if (action === 'syncdrive' || action === 'syncdriveandsheets') {
      const scanResult = sincronizarDriveConRepositorio(ss, params.folderId || CONFIG.DRIVE_FOLDER_ID);
      return jsonResponse(scanResult, callback);
    }

    // Acción 2: Lectura estándar de la hoja Repositorio
    const sheetName = params.sheet || params.repoTabName || CONFIG.REPO_SHEET_NAME;
    let sheet = ss.getSheetByName(sheetName) || ss.getSheetByName('Repositorio') || ss.getSheetByName('REPOSITORIO');
    
    if (!sheet) {
      const sheets = ss.getSheets();
      sheet = sheets.length > 0 ? sheets[0] : null;
    }

    if (!sheet) {
      return jsonResponse({
        success: false,
        error: 'No se encontró la pestaña "' + sheetName + '"',
        headers: ENCABEZADOS_REPOSITORIO_ESPERADOS,
        rows: []
      }, callback);
    }

    const data = sheet.getDataRange().getValues();
    if (!data || data.length === 0) {
      return jsonResponse({
        success: true,
        headers: ENCABEZADOS_REPOSITORIO_ESPERADOS,
        rows: [],
        count: 0
      }, callback);
    }

    const rawHeaders = data[0].map(h => String(h || '').trim());
    const rows = [];

    for (let r = 1; r < data.length; r++) {
      const rowArr = data[r];
      const hasContent = rowArr.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasContent) continue;

      const rowObj = {};
      rawHeaders.forEach((header, colIdx) => {
        if (!header) return;
        const val = rowArr[colIdx];
        if (val instanceof Date) {
          rowObj[header] = Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd');
        } else {
          rowObj[header] = val !== null && val !== undefined ? String(val).trim() : '';
        }
      });
      rows.push(rowObj);
    }

    return jsonResponse({
      success: true,
      headers: rawHeaders,
      rows: rows,
      count: rows.length,
      sheetName: sheet.getName(),
      lastSync: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm:ss')
    }, callback);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: 'Excepción en doGet: ' + err.toString()
    });
  }
}

/**
 * Manejador para peticiones POST (Sincronización forzada y Webhook)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = (e && e.parameter) ? e.parameter : {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    return doGet({ parameter: payload });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Error en doPost: ' + err.toString() });
  }
}

/**
 * Escanea recursivamente la carpeta de Google Drive "REPOSITORIO PV"
 * Jerarquía: Unidades Académicas / [Área] / [Año] / [Archivo.pdf]
 */
function sincronizarDriveConRepositorio(ss, folderId) {
  try {
    const targetFolderId = folderId || CONFIG.DRIVE_FOLDER_ID;
    const rootFolder = DriveApp.getFolderById(targetFolderId);
    if (!rootFolder) {
      return { success: false, error: 'No se pudo acceder a la carpeta de Google Drive ID: ' + targetFolderId };
    }

    const sheetName = CONFIG.REPO_SHEET_NAME;
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(ENCABEZADOS_REPOSITORIO_ESPERADOS);
    }

    const driveFiles = [];
    recorrerCarpetaDrive(rootFolder, '', '', driveFiles);

    return {
      success: true,
      message: 'Drive escaneado exitosamente',
      archivosEncontrados: driveFiles.length,
      archivos: driveFiles
    };
  } catch (e) {
    return { success: false, error: 'Error al escanear Drive: ' + e.toString() };
  }
}

function recorrerCarpetaDrive(folder, parentUnit, parentYear, fileList) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.toLowerCase().endsWith('.pdf') || name.toLowerCase().endsWith('.docx') || name.toLowerCase().endsWith('.doc')) {
      fileList.push({
        id: file.getId(),
        name: name,
        url: file.getUrl(),
        unidadAcademica: parentUnit || 'General',
        ano: parentYear || '2026',
        size: file.getSize(),
        lastUpdated: file.getLastUpdated()
      });
    }
  }

  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    const subName = sub.getName();
    let nextUnit = parentUnit;
    let nextYear = parentYear;

    if (/^\\d{4}$/.test(subName)) {
      nextYear = subName;
    } else if (!parentUnit) {
      nextUnit = subName;
    }

    recorrerCarpetaDrive(sub, nextUnit, nextYear, fileList);
  }
}

function jsonResponse(data, callback) {
  const jsonString = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + jsonString + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
`;
