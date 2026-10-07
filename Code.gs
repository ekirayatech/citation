/**
 * ============================================================================
 * COLEGIO EKIRAYÁ · CITA MASTER — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * Backend de lectura y sincronización de Google Sheets del Repositorio de
 * Monografías (Proyecto de Vida) del Colegio Ekirayá.
 * 
 * Acceso directo: Lectura de monografías desde la hoja "repositorio" (17 columnas).
 * ============================================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs',
  SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
  REPO_SHEET_NAME: 'repositorio',
  INSTITUTIONAL_TOKEN: 'EKIRAYA-2026',
  DOMINIOS_AUTORIZADOS: ['@cem.edu.co', '@est.cem.edu.co', '@ekiraya.edu.co']
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
 * Menú contextual en Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('📋 Verificar encabezados de Monografías', 'verificarEstructuraHojas')
    .addToUi();
}

/**
 * Normaliza nombres de encabezados para mapeo flexible
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
 * Sanitiza texto para salida JSON segura
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
 * Lee la Fila 1 y extrae los encabezados existentes
 */
function obtenerMapaColumnas(hoja) {
  if (!hoja) return { mapa: {}, headers: [], totalColumnas: 0 };
  const lastCol = Math.max(1, hoja.getLastColumn());
  const headers = hoja.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const mapa = {};

  headers.forEach(function(h, idx) {
    const raw = String(h || '').trim();
    if (!raw) return;
    const colNum = idx + 1;
    const norm = normalizarClave(raw);
    mapa[norm] = colNum;
    mapa[raw] = colNum;
  });

  return { mapa: mapa, headers: headers, totalColumnas: lastCol };
}

/**
 * Obtiene la hoja de monografías buscando "repositorio", "monografias" o la primera hoja
 */
function obtenerOCrearHojaRepositorio(ssParam, params) {
  const ss = obtenerSpreadsheet(ssParam, params);
  if (!ss) return null;

  // 1. Buscar por nombre exacto o case-insensitive
  const targetName = (params && params.sheetName) ? String(params.sheetName).trim().toLowerCase() : CONFIG.REPO_SHEET_NAME;
  let hoja = ss.getSheetByName(CONFIG.REPO_SHEET_NAME);
  
  if (!hoja) {
    const all = ss.getSheets();
    for (let i = 0; i < all.length; i++) {
      const n = all[i].getName().trim().toLowerCase();
      if (n === targetName || n === 'repositorio' || n === 'monografias' || n === 'monografías') {
        hoja = all[i];
        break;
      }
    }
    // Si no se encuentra con ese nombre y hay hojas existentes, tomar la primera
    if (!hoja && all.length > 0) {
      hoja = all[0];
    }
  }

  // Si no existe ninguna hoja, crearla
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
 * Valida la hoja repositorio
 */
function verificarEstructuraHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = obtenerOCrearHojaRepositorio(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Hoja de Monografías ("' + (hoja ? hoja.getName() : 'repositorio') + '") configurada y lista.');
}

/**
 * Lee todas las monografías de la hoja de cálculo
 */
function apiGetMonografias(ssParam, params) {
  const hoja = obtenerOCrearHojaRepositorio(ssParam, params);
  if (!hoja || hoja.getLastRow() <= 1) {
    return {
      status: 'success',
      total: 0,
      headers: ENCABEZADOS_REPOSITORIO_ESPERADOS,
      data: [],
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    };
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
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    sheetName: hoja.getName(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera respuesta JSON o JSONP
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
 * Endpoint GET (Web App)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = String(params.action || 'getMonografias').trim();
    const callback = params.callback || null;

    if (action === 'ping' || action === 'test') {
      return crearSalida({
        status: 'success',
        success: true,
        message: 'Apps Script de Cita Master conectado exitosamente',
        action: 'ping',
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      }, callback);
    }

    const monoRes = apiGetMonografias(null, params);
    return crearSalida(Object.assign({
      status: 'success',
      success: true,
      action: action,
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      syncedAt: new Date().toISOString()
    }, monoRes), callback);

  } catch (error) {
    return crearSalida({
      status: 'error',
      success: false,
      message: error.message || 'Error en ejecución de doGet'
    }, e && e.parameter ? e.parameter.callback : null);
  }
}

/**
 * Endpoint POST (Web App)
 */
function doPost(e) {
  return doGet(e);
}
