/**
 * Código fuente para Google Apps Script (Code.gs)
 * Backend de integración para Google Sheets y Google Drive del Repositorio de Monografías (Proyecto de Vida)
 * Colegio Ekirayá - Educación Montessori
 */

export const APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * COLEGIO EKIRAYÁ · CITA MASTER — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * Jerarquía en Google Drive:
 *   REPOSITORIO PV (ID: 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii)
 *     └── Unidades Académicas
 *           ├── [Unidad Académica] (Ciencias, Música, Psicología, Aviación...)
 *           │     └── [Año] (2025, 2026, 2027)
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
  ROOT_FOLDER_ID: '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii',
  ROOT_FOLDER_NAME: 'REPOSITORIO PV',
  SUBFOLDER_NIVEL_1: 'Unidades Académicas',
  SPREADSHEET_ID: '1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs',
  SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1CGZ_yTz7WApWBWYJ7N1VnlLxkqLa34wPXqx89ZAoNIs/edit',
  REPO_SHEET_NAME: 'repositorio',
  USERS_SHEET_NAME: 'usuarios',
  INSTITUTIONAL_TOKEN: 'EKIRAYA-2026',
  DOMINIOS_AUTORIZADOS: ['@cem.edu.co', '@est.cem.edu.co', '@ekiraya.edu.co'],
  VERCEL_ORIGIN: 'https://cotationeki.vercel.app'
};

const ENCABEZADOS_REPOSITORIO_ESPERADOS = [
  'documento_id', 'titulo', 'autor', 'grado', 'año', 'Unidad Académica',
  'Linea de investigación', 'tipo', 'palabras_clave', 'resumen', 'Asesor(es)',
  'drive_file_id', 'url_documento', 'visibilidad', 'estado', 'fecha_registro',
  'fecha_actualizacion'
];

const ENCABEZADOS_USUARIOS_ESPERADOS = [
  'Nombres', 'Curso', 'Correo', 'Sección', 'Perfil'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Repositorio Ekirayá')
    .addItem('🔄 Sincronizar Drive (Unidades Académicas)', 'sincronizarRepositorioDrive')
    .addItem('⏰ Programar trigger automático cada 24h', 'instalarTriggerSincronizacion')
    .addItem('👥 Verificar hojas repositorio y usuarios', 'verificarEstructuraHojas')
    .addToUi();
}

function normalizarClave(texto) {
  if (!texto) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

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

function resolverColumna(mapa, candidatos) {
  for (let i = 0; i < candidatos.length; i++) {
    const norm = normalizarClave(candidatos[i]);
    if (mapa[norm] !== undefined) return mapa[norm];
    if (mapa[candidatos[i]] !== undefined) return mapa[candidatos[i]];
  }
  return null;
}

function obtenerOCrearHojaRepositorio(ssParam) {
  const ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
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

function obtenerOCrearHojaUsuarios(ssParam) {
  const ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
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
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS_USUARIOS_ESPERADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS_USUARIOS_ESPERADOS.length)
      .setFontWeight('bold')
      .setBackground('#44345c')
      .setFontColor('#ffffff');
  }

  return hoja;
}

function sincronizarRepositorioDrive(ssParam) {
  const hoja = obtenerOCrearHojaRepositorio(ssParam);
  if (!hoja) throw new Error('No se pudo abrir la hoja "repositorio"');

  const { mapa, headers, totalColumnas } = obtenerMapaColumnas(hoja);

  const colDriveId = resolverColumna(mapa, ['drive_file_id', 'drive_id_alias']);
  const colUrlDoc = resolverColumna(mapa, ['url_documento', 'url_alias']);
  const colTitulo = resolverColumna(mapa, ['titulo']);
  const colAno = resolverColumna(mapa, ['año', 'ano']);
  const colUnidad = resolverColumna(mapa, ['Unidad Académica', 'unidad academica', 'unidad']);

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

  let unidadesFolder = null;
  const subNivel1 = rootFolder.getFolders();
  while (subNivel1.hasNext()) {
    const f = subNivel1.next();
    if (normalizarClave(f.getName()) === normalizarClave(CONFIG.SUBFOLDER_NIVEL_1)) {
      unidadesFolder = f;
      break;
    }
  }

  const folderToScan = unidadesFolder || rootFolder;
  const nuevasFilas = [];
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd');

  const unidadFolders = folderToScan.getFolders();
  while (unidadFolders.hasNext()) {
    const unidadFolder = unidadFolders.next();
    const nombreUnidad = unidadFolder.getName().trim();

    const anoFolders = unidadFolder.getFolders();
    let hayCarpetasAno = false;

    while (anoFolders.hasNext()) {
      hayCarpetasAno = true;
      const anoFolder = anoFolders.next();
      const nombreAno = anoFolder.getName().trim();

      procesarArchivosPDF(anoFolder, nombreUnidad, nombreAno, headers, mapa, existingKeys, nuevasFilas, fechaHoy);
    }

    if (!hayCarpetasAno) {
      procesarArchivosPDF(unidadFolder, nombreUnidad, '2026', headers, mapa, existingKeys, nuevasFilas, fechaHoy);
    }
  }

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

function procesarArchivosPDF(folder, unidad, ano, headers, mapa, existingKeys, nuevasFilas, fechaHoy) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const mime = file.getMimeType();

    const isPdf = mime === MimeType.PDF || /\\.pdf$/i.test(fileName);
    if (!isPdf) continue;

    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const fileKey = (fileName.replace(/\\.pdf$/i, '').trim() + '|' + unidad + '|' + ano).toLowerCase();

    if (existingKeys.has(fileId) || existingKeys.has(fileUrl) || existingKeys.has(fileKey)) {
      continue;
    }

    const docId = String(Math.floor(1000 + Math.random() * 9000));
    const tituloLimpio = fileName.replace(/\\.[^/.]+$/, '').trim();

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
    .atHour(2)
    .create();
}

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
      rowObj[headers[c]] = sanitizarTexto(rowValues[c] || '');
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

function apiCheckUserRole(email, ssParam) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { status: 'error', authorized: false, message: 'Correo requerido' };
  }

  const esValido = CONFIG.DOMINIOS_AUTORIZADOS.some(function(dom) {
    return cleanEmail.endsWith(dom);
  });
  if (!esValido) {
    return {
      status: 'error',
      authorized: false,
      message: 'Dominio no permitido. Solo se aceptan cuentas @cem.edu.co o @ekiraya.edu.co',
      email: cleanEmail
    };
  }

  const hoja = obtenerOCrearHojaUsuarios(ssParam);
  if (!hoja || hoja.getLastRow() <= 1) {
    return { status: 'error', authorized: false, message: 'Hoja de usuarios vacía', email: cleanEmail };
  }

  const { mapa } = obtenerMapaColumnas(hoja);
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
    if (cleanEmail === 'mebolanos@cem.edu.co') {
      foundUser = {
        nombres: 'Esteban Bolaños R',
        correo: cleanEmail,
        curso: 'Docente',
        seccion: 'Academia',
        perfil: 'Administrador',
        isAdmin: true
      };
      hoja.appendRow([foundUser.nombres, foundUser.curso, foundUser.correo, foundUser.seccion, foundUser.perfil]);
      SpreadsheetApp.flush();
    } else {
      return {
        status: 'error',
        authorized: false,
        message: 'Tu correo institucional (' + cleanEmail + ') no se encuentra en la hoja "usuarios".',
        email: cleanEmail
      };
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

function apiManageUser(params, ssParam) {
  const hoja = obtenerOCrearHojaUsuarios(ssParam);
  if (!hoja) return { status: 'error', message: 'No se pudo abrir hoja de usuarios' };

  const subAction = String(params.subAction || params.action || 'add').toLowerCase();
  const { mapa, headers } = obtenerMapaColumnas(hoja);
  const colCorreo = resolverColumna(mapa, ['Correo', 'correo_alias']);
  const values = hoja.getDataRange().getDisplayValues();

  const targetEmail = String(params.originalEmail || params.originalCorreo || params.correo || params.email || '').trim().toLowerCase();
  const newEmail = String(params.correo || params.email || targetEmail).trim().toLowerCase();
  const nombre = String(params.nombres || params.nombre || '').trim();
  const curso = String(params.curso || 'General').trim();
  const seccion = String(params.seccion || 'General').trim();
  const perfil = String(params.perfil || params.rol || 'Estudiante').trim();

  let foundRowIdx = -1;
  for (let r = 1; r < values.length; r++) {
    const rowMail = colCorreo ? String(values[r][colCorreo - 1] || '').trim().toLowerCase() : '';
    if (rowMail === targetEmail || (newEmail && rowMail === newEmail)) {
      foundRowIdx = r + 1;
      break;
    }
  }

  if (subAction === 'delete' || subAction === 'deleteuser') {
    if (foundRowIdx > 1) {
      hoja.deleteRow(foundRowIdx);
      SpreadsheetApp.flush();
      return { status: 'success', message: 'Usuario ' + targetEmail + ' eliminado' };
    }
    return { status: 'error', message: 'Usuario ' + targetEmail + ' no encontrado' };
  }

  const nuevaFila = headers.map(function(h) {
    const norm = normalizarClave(h);
    if (/correo|email|mail|cuenta/.test(norm)) return newEmail;
    if (/nombre|estudiante|usuario/.test(norm)) return nombre;
    if (/curso|grado|nivel/.test(norm)) return curso;
    if (/seccion|dependencia|area/.test(norm)) return seccion;
    if (/perfil|rol|admin|cargo/.test(norm)) return perfil;
    if (params[h] !== undefined) return String(params[h]).trim();
    return '';
  });

  if (foundRowIdx > 1) {
    hoja.getRange(foundRowIdx, 1, 1, nuevaFila.length).setValues([nuevaFila]);
  } else {
    hoja.appendRow(nuevaFila);
  }
  SpreadsheetApp.flush();

  return {
    status: 'success',
    message: 'Usuario ' + (foundRowIdx > 1 ? 'actualizado' : 'creado') + ' exitosamente',
    user: { nombres: nombre, correo: newEmail, curso: curso, seccion: seccion, perfil: perfil }
  };
}

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
        timestamp: new Date().toISOString()
      }, callback);
    }

    if (action === 'getMonografias') {
      return crearSalida(apiGetMonografias(), callback);
    }

    if (action === 'checkUserRole') {
      const email = params.email || params.correo || '';
      return crearSalida(apiCheckUserRole(email), callback);
    }

    if (action === 'updateUser' || action === 'addUser') {
      params.subAction = action === 'updateUser' ? 'update' : 'add';
      const res = apiManageUser(params);
      const monoRes = apiGetMonografias();
      const userSheet = obtenerOCrearHojaUsuarios();
      const uMap = obtenerMapaColumnas(userSheet);
      const uData = userSheet.getDataRange().getDisplayValues();
      const uRows = [];
      for (let r = 1; r < uData.length; r++) {
        const rowObj = {};
        for (let c = 0; c < uMap.headers.length; c++) {
          rowObj[uMap.headers[c]] = uData[r][c] || '';
        }
        uRows.push(rowObj);
      }
      return crearSalida({
        status: res.status,
        success: res.status === 'success',
        message: res.message,
        usuariosHeaders: uMap.headers,
        usuariosRows: uRows,
        headers: monoRes.headers,
        rows: monoRes.data
      }, callback);
    }

    if (action === 'deleteUser') {
      params.subAction = 'delete';
      const res = apiManageUser(params);
      return crearSalida(res, callback);
    }

    if (action === 'syncDrive') {
      const syncRes = sincronizarRepositorioDrive();
      const monoRes = apiGetMonografias();
      return crearSalida({
        status: 'success',
        success: true,
        syncResult: syncRes,
        headers: monoRes.headers,
        rows: monoRes.data,
        totalMonographs: monoRes.total
      }, callback);
    }

    // Default: syncRepo
    const monoData = apiGetMonografias();
    const userSheet = obtenerOCrearHojaUsuarios();
    const uMap = obtenerMapaColumnas(userSheet);
    const uData = userSheet.getDataRange().getDisplayValues();
    const uRows = [];
    for (let r = 1; r < uData.length; r++) {
      const rowObj = {};
      for (let c = 0; c < uMap.headers.length; c++) {
        rowObj[uMap.headers[c]] = uData[r][c] || '';
      }
      uRows.push(rowObj);
    }

    return crearSalida({
      status: 'success',
      success: true,
      action: 'syncRepo',
      folderId: CONFIG.ROOT_FOLDER_ID,
      syncedAt: new Date().toISOString(),
      headers: monoData.headers,
      rows: monoData.data,
      usuariosHeaders: uMap.headers,
      usuariosRows: uRows,
      totalMonographs: monoData.total,
      totalUsers: uRows.length
    }, callback);

  } catch (error) {
    return crearSalida({
      status: 'error',
      success: false,
      message: error.message || 'Error en ejecución de doGet'
    }, e && e.parameter ? e.parameter.callback : null);
  }
}

function doPost(e) {
  try {
    let params = (e && e.parameter) ? Object.assign({}, e.parameter) : {};
    if (e && e.postData && e.postData.contents) {
      try {
        const bodyObj = JSON.parse(e.postData.contents);
        params = Object.assign(params, bodyObj);
      } catch (ex) {}
    }

    const action = String(params.action || '').trim();

    if (action === 'syncDrive') {
      const adminEmail = String(params.email || params.correo || '').trim().toLowerCase();
      if (adminEmail) {
        const roleCheck = apiCheckUserRole(adminEmail);
        if (roleCheck.perfil !== 'Administrador' && adminEmail !== 'mebolanos@cem.edu.co') {
          return crearSalida({ status: 'error', message: 'Acceso no autorizado: Solo Administrador' });
        }
      }
      const syncRes = sincronizarRepositorioDrive();
      const monoRes = apiGetMonografias();
      return crearSalida({
        status: 'success',
        message: 'Sincronización de Drive completada exitosamente',
        data: syncRes,
        totalMonografias: monoRes.total
      });
    }

    if (action === 'manageUser' || action === 'updateUser' || action === 'addUser' || action === 'deleteUser') {
      const res = apiManageUser(params);
      return crearSalida(res);
    }

    return doGet(e);

  } catch (error) {
    return crearSalida({
      status: 'error',
      message: error.message || 'Error en ejecución de doPost'
    });
  }
}
`;
