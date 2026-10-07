/**
 * =========================================================================
 * COLEGIO EKIRAYÁ - SISTEMA DE REPOSITORIO DE MONOGRAFÍAS (BACKEND GAS)
 * =========================================================================
 * 
 * Google Apps Script: Code.gs
 * Hoja de Cálculo ID: 1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow
 * Carpeta Raíz Drive (REPOSITORIO PV) ID: 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii
 * 
 * Jerarquía en Google Drive:
 * REPOSITORIO PV
 *  └── Unidades Académicas
 *       └── [Nombre de Unidad Académica] (ej. Ciencias, Música, Psicología, etc.)
 *            └── [Año] (ej. 2025, 2026, 2027)
 *                 └── [archivo_monografia.pdf]
 * 
 * Estructura de Hojas en Google Sheets:
 * 1. "Repositorio" (17 columnas dinámicas):
 *    documento_id | titulo | autor | grado | año | Unidad Académica | Linea de investigación |
 *    tipo | palabras_clave | resumen | Asesor(es) | drive_file_id | url_documento |
 *    visibilidad | estado | fecha_registro | fecha_actualizacion
 * 
 * 2. "Usuarios" (5 columnas dinámicas):
 *    Nombres | Curso | Correo | Sección | Perfil
 */

// =========================================================================
// CONSTANTES GLOBALES DE CONFIGURACIÓN
// =========================================================================
const SPREADSHEET_ID = '1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow';
const ROOT_FOLDER_ID = '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii'; // REPOSITORIO PV
const NOMBRE_SUB_CARPETA_UNIDADES = 'Unidades Académicas';
const HOJA_REPOSITORIO = 'Repositorio';
const HOJA_USUARIOS = 'Usuarios';

/**
 * 17 Encabezados canónicos de la hoja "Repositorio"
 */
const HEADERS_REPOSITORIO = [
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
 * 5 Encabezados canónicos de la hoja "Usuarios"
 */
const HEADERS_USUARIOS = [
  'Nombres',
  'Curso',
  'Correo',
  'Sección',
  'Perfil'
];

// =========================================================================
// 1. MAPEO DINÁMICO DE COLUMNAS
// =========================================================================

/**
 * Lee dinámicamente los encabezados de la Fila 1 de una hoja y mapea
 * cada nombre de columna a su índice correspondiente (0-indexado).
 * Permite que el código siga funcionando aunque se reordenen columnas
 * o se agreguen nuevas en el Google Sheet.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} hoja - Hoja de cálculo activa.
 * @return {Object.<string, number>} Diccionario { "nombre_columna": indice_0_based }
 */
function obtenerMapaColumnas(hoja) {
  if (!hoja) {
    throw new Error('obtenerMapaColumnas: No se proporcionó una hoja válida.');
  }

  const lastCol = hoja.getLastColumn();
  if (lastCol === 0) {
    return {};
  }

  const encabezados = hoja.getRange(1, 1, 1, lastCol).getValues()[0];
  const mapa = {};

  encabezados.forEach((nombre, idx) => {
    if (nombre !== null && nombre !== undefined) {
      const limpio = String(nombre).trim();
      if (limpio.length > 0) {
        // Mapeo exacto
        mapa[limpio] = idx;
        // Mapeo normalizado (minúsculas y sin acentos) para máxima tolerancia
        const normalizado = limpio
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        mapa[normalizado] = idx;
        mapa[limpio.toLowerCase()] = idx;
      }
    }
  });

  return mapa;
}

// =========================================================================
// 2. ESCANEO RECURSIVO DE DRIVE E INSERCIÓN EN SHEETS
// =========================================================================

/**
 * Recorre la jerarquía exacta en Google Drive:
 * REPOSITORIO PV -> Unidades Académicas -> [Unidad] -> [Año] -> [PDF]
 * y sincroniza las monografías en la hoja 'Repositorio' evitando duplicados.
 * 
 * @return {Object} Estadísticas de la sincronización.
 */
function sincronizarRepositorioDrive() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hojaRepo = ss.getSheetByName(HOJA_REPOSITORIO);

  // Si la hoja Repositorio no existe, se crea con sus 17 columnas
  if (!hojaRepo) {
    hojaRepo = ss.insertSheet(HOJA_REPOSITORIO);
    hojaRepo.appendRow(HEADERS_REPOSITORIO);
    hojaRepo.setFrozenRows(1);
  }

  // 1. Obtener mapa dinámico de columnas de la hoja Repositorio
  const mapaCols = obtenerMapaColumnas(hojaRepo);

  // 2. Cargar IDs de archivos y URLs existentes para control estricto de duplicados
  const lastRow = hojaRepo.getLastRow();
  const existingDriveIds = new Set();
  const existingDocUrls = new Set();

  if (lastRow > 1) {
    const dataRange = hojaRepo.getRange(2, 1, lastRow - 1, hojaRepo.getLastColumn()).getValues();
    const driveIdIdx = mapaCols['drive_file_id'];
    const urlDocIdx = mapaCols['url_documento'];

    dataRange.forEach(row => {
      if (driveIdIdx !== undefined && row[driveIdIdx]) {
        existingDriveIds.add(String(row[driveIdIdx]).trim());
      }
      if (urlDocIdx !== undefined && row[urlDocIdx]) {
        existingDocUrls.add(String(row[urlDocIdx]).trim());
      }
    });
  }

  // 3. Abrir la Carpeta Raíz: 'REPOSITORIO PV'
  let carpetaRaiz;
  try {
    carpetaRaiz = DriveApp.getFolderById(ROOT_FOLDER_ID);
  } catch (e) {
    throw new Error('No se pudo abrir la carpeta raíz REPOSITORIO PV (' + ROOT_FOLDER_ID + '): ' + e.message);
  }

  // 4. Ubicar la Subcarpeta Nivel 1: 'Unidades Académicas'
  let carpetaUnidades = null;
  const subCarpetasN1 = carpetaRaiz.getFoldersByName(NOMBRE_SUB_CARPETA_UNIDADES);

  if (subCarpetasN1.hasNext()) {
    carpetaUnidades = subCarpetasN1.next();
  } else {
    // Búsqueda tolerante a mayúsculas/minúsculas o tildes
    const iteradorCarpetas = carpetaRaiz.getFolders();
    while (iteradorCarpetas.hasNext()) {
      const f = iteradorCarpetas.next();
      const n = f.getName().trim().toLowerCase();
      if (n.includes('unidades') && n.includes('academicas')) {
        carpetaUnidades = f;
        break;
      }
    }
  }

  if (!carpetaUnidades) {
    // Si no existe la subcarpeta específica, se escanea desde la raíz como fallback
    carpetaUnidades = carpetaRaiz;
  }

  let totalArchivosEncontrados = 0;
  let nuevosInsertados = 0;
  let duplicadosOmitidos = 0;
  const nuevasFilas = [];
  const timeZone = Session.getScriptTimeZone() || 'America/Bogota';
  const fechaHoy = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');

  // 5. Nivel 2: Recorrer subcarpetas de cada Unidad Académica (Ciencias, Música, etc.)
  const iteradorUnidades = carpetaUnidades.getFolders();

  while (iteradorUnidades.hasNext()) {
    const carpetaUnidad = iteradorUnidades.next();
    const nombreUnidad = carpetaUnidad.getName().trim();

    // 6. Nivel 3: Recorrer subcarpetas por Año (2025, 2026, 2027, etc.)
    const iteradorAnios = carpetaUnidad.getFolders();

    while (iteradorAnios.hasNext()) {
      const carpetaAnio = iteradorAnios.next();
      const anioStr = carpetaAnio.getName().trim();

      // 7. Nivel 4: Leer los archivos PDF de monografías
      const iteradorArchivos = carpetaAnio.getFiles();

      while (iteradorArchivos.hasNext()) {
        const archivo = iteradorArchivos.next();
        const nombreArchivo = archivo.getName();
        const mimeType = archivo.getMimeType();

        // Filtrar archivos PDF o documentos que terminen en .pdf
        if (mimeType === 'application/pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
          totalArchivosEncontrados++;

          const fileId = archivo.getId();
          const fileUrl = archivo.getUrl();

          // Control de duplicados por ID de Drive o URL
          if (existingDriveIds.has(fileId) || existingDocUrls.has(fileUrl)) {
            duplicadosOmitidos++;
            continue;
          }

          // Generar ID único de documento: año + sufijo aleatorio
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const documentoId = anioStr + '_' + randomSuffix;

          // Título limpio (nombre del PDF sin extensión ni guiones bajos)
          const tituloLimpio = nombreArchivo
            .replace(/\.pdf$/i, '')
            .replace(/_/g, ' ')
            .trim();

          // Construir la nueva fila respetando el ancho actual de columnas
          const numCols = Math.max(hojaRepo.getLastColumn(), HEADERS_REPOSITORIO.length);
          const fila = new Array(numCols).fill('');

          const asignarValor = (nombreCol, valor) => {
            const idx = mapaCols[nombreCol] !== undefined
              ? mapaCols[nombreCol]
              : mapaCols[nombreCol.toLowerCase()];
            if (idx !== undefined && idx < numCols) {
              fila[idx] = valor;
            }
          };

          // Asignación de los 17 campos canónicos
          asignarValor('documento_id', documentoId);
          asignarValor('titulo', tituloLimpio);
          asignarValor('autor', ''); // Campo pedagógico editable en Sheets
          asignarValor('grado', '11');
          asignarValor('año', anioStr);
          asignarValor('Unidad Académica', nombreUnidad);
          asignarValor('Linea de investigación', '');
          asignarValor('tipo', 'Monografía');
          asignarValor('palabras_clave', '');
          asignarValor('resumen', '');
          asignarValor('Asesor(es)', '');
          asignarValor('drive_file_id', fileId);
          asignarValor('url_documento', fileUrl);
          asignarValor('visibilidad', 'Público Institucional');
          asignarValor('estado', 'Finalizado');
          asignarValor('fecha_registro', fechaHoy);
          asignarValor('fecha_actualizacion', fechaHoy);

          nuevasFilas.push(fila);
          existingDriveIds.add(fileId);
          existingDocUrls.add(fileUrl);
          nuevosInsertados++;
        }
      }
    }
  }

  // 8. Inserción en lote (Batch) de todas las filas nuevas para máximo rendimiento
  if (nuevasFilas.length > 0) {
    const filaInicio = hojaRepo.getLastRow() + 1;
    hojaRepo.getRange(filaInicio, 1, nuevasFilas.length, nuevasFilas[0].length).setValues(nuevasFilas);
  }

  const resultado = {
    totalArchivosEncontrados: totalArchivosEncontrados,
    nuevosInsertados: nuevosInsertados,
    duplicadosOmitidos: duplicadosOmitidos,
    fechaSincronizacion: fechaHoy,
    status: 'success',
    message: 'Sincronización con Google Drive completada: ' + nuevosInsertados + ' documentos nuevos indexados.'
  };

  Logger.log(JSON.stringify(resultado));
  return resultado;
}

// =========================================================================
// 3. DISPARADOR AUTOMÁTICO (TIME-DRIVEN TRIGGER - CADA 24 HORAS)
// =========================================================================

/**
 * Crea o renueva un disparador temporizado diario (cada 24 horas a las 2:00 AM)
 * para sincronizar automáticamente el repositorio de Drive con Sheets.
 */
function crearTriggerDiario() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sincronizarRepositorioDrive') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('sincronizarRepositorioDrive')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();

  Logger.log('Trigger diario programado exitosamente para sincronizarRepositorioDrive a las 2:00 AM.');
}

// =========================================================================
// 4. ENDPOINTS API WEB APP (doGet & doPost)
// =========================================================================

/**
 * Maneja solicitudes GET de la Web App
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getMonografias';

    if (action === 'getMonografias') {
      return responderMonografias();
    }

    if (action === 'checkUserRole') {
      const email = (e && e.parameter && e.parameter.email) ? e.parameter.email : '';
      return responderVerificarRol(email);
    }

    if (action === 'getUsers') {
      return responderListaUsuarios();
    }

    if (action === 'syncDrive') {
      const stats = sincronizarRepositorioDrive();
      return crearSalidaJson({ status: 'success', message: 'Sincronización completada', data: stats });
    }

    return crearSalidaJson({ status: 'error', message: 'Acción GET desconocida: ' + action }, 400);
  } catch (err) {
    return crearSalidaJson({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * Maneja solicitudes POST de la Web App
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else {
      payload = (e && e.parameter) ? e.parameter : {};
    }

    const action = payload.action || (e && e.parameter && e.parameter.action);
    const userEmail = payload.userEmail || payload.email || payload.adminEmail || '';

    // Sincronización Manual de Drive (solo Administrador)
    if (action === 'syncDrive') {
      const rol = verificarRol(userEmail);
      if (!rol.isAdmin && userEmail.toLowerCase() !== 'mebolanos@cem.edu.co') {
        return crearSalidaJson({
          status: 'error',
          message: 'Acceso denegado: Solo el Administrador puede solicitar sincronización de Drive.'
        }, 403);
      }

      const stats = sincronizarRepositorioDrive();
      return crearSalidaJson({
        status: 'success',
        message: 'Sincronización con Drive completada con éxito.',
        data: stats
      });
    }

    // Gestión de Usuarios en la hoja Usuarios
    if (action === 'manageUser') {
      return procesarGestionUsuario(payload);
    }

    return crearSalidaJson({ status: 'error', message: 'Acción POST no reconocida: ' + action }, 400);
  } catch (err) {
    return crearSalidaJson({ status: 'error', message: err.toString() }, 500);
  }
}

// =========================================================================
// 5. FUNCIONES AUXILIARES DE ENDPOINTS Y SANITIZACIÓN
// =========================================================================

function responderMonografias() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_REPOSITORIO);

  if (!hoja || hoja.getLastRow() <= 1) {
    return crearSalidaJson({ status: 'success', message: 'No hay monografías registradas', data: [], count: 0 });
  }

  const mapa = obtenerMapaColumnas(hoja);
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();

  const data = rows.map(r => {
    const item = {};
    headers.forEach((h, idx) => {
      if (h) {
        item[String(h).trim()] = sanitizar(r[idx]);
      }
    });
    // Garantizar campos canónicos
    HEADERS_REPOSITORIO.forEach(h => {
      if (item[h] === undefined) {
        const colIdx = mapa[h] !== undefined ? mapa[h] : mapa[h.toLowerCase()];
        item[h] = (colIdx !== undefined && r[colIdx] !== undefined) ? sanitizar(r[colIdx]) : '';
      }
    });
    return item;
  });

  return crearSalidaJson({ status: 'success', data: data, count: data.length });
}

function responderVerificarRol(email) {
  const res = verificarRol(email);
  return crearSalidaJson({ status: 'success', data: res });
}

function verificarRol(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) {
    return { registered: false, perfil: 'Estudiante', isAdmin: false };
  }

  if (clean === 'mebolanos@cem.edu.co') {
    return { registered: true, perfil: 'Administrador', isAdmin: true, nombres: 'Esteban Bolaños R' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_USUARIOS);

  if (!hoja || hoja.getLastRow() <= 1) {
    const isDoc = clean.endsWith('@cem.edu.co');
    return {
      registered: isDoc || clean.endsWith('@est.cem.edu.co'),
      perfil: isDoc ? 'Docente' : 'Estudiante',
      isAdmin: false
    };
  }

  const mapa = obtenerMapaColumnas(hoja);
  const cCorreo = mapa['correo'];
  const cPerfil = mapa['perfil'];
  const cNombres = mapa['nombres'];
  const rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();

  for (let i = 0; i < rows.length; i++) {
    const rMail = cCorreo !== undefined ? String(rows[i][cCorreo]).trim().toLowerCase() : '';
    if (rMail === clean) {
      const perfil = cPerfil !== undefined ? String(rows[i][cPerfil]).trim() : 'Estudiante';
      const nombres = cNombres !== undefined ? String(rows[i][cNombres]).trim() : '';
      const isAdmin = /admin|administrador|coordinador/i.test(perfil);
      return { registered: true, perfil, isAdmin, nombres };
    }
  }

  const isDoc = clean.endsWith('@cem.edu.co');
  return {
    registered: isDoc || clean.endsWith('@est.cem.edu.co'),
    perfil: isDoc ? 'Docente' : 'Estudiante',
    isAdmin: false
  };
}

function responderListaUsuarios() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_USUARIOS);

  if (!hoja || hoja.getLastRow() <= 1) {
    return crearSalidaJson({ status: 'success', data: [] });
  }

  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();

  const users = rows.map(r => {
    const u = {};
    headers.forEach((h, idx) => {
      if (h) u[String(h).trim()] = sanitizar(r[idx]);
    });
    return u;
  });

  return crearSalidaJson({ status: 'success', data: users });
}

function procesarGestionUsuario(payload) {
  const adminEmail = payload.adminEmail || payload.userEmail || '';
  const rol = verificarRol(adminEmail);

  if (!rol.isAdmin && adminEmail.toLowerCase() !== 'mebolanos@cem.edu.co') {
    return crearSalidaJson({ status: 'error', message: 'Acceso denegado: Se requiere perfil Administrador.' }, 403);
  }

  const subAction = payload.subAction || 'add';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = ss.getSheetByName(HOJA_USUARIOS);

  if (!hoja) {
    hoja = ss.insertSheet(HOJA_USUARIOS);
    hoja.appendRow(HEADERS_USUARIOS);
  }

  const mapa = obtenerMapaColumnas(hoja);

  if (subAction === 'add') {
    const correo = String(payload.Correo || payload.correo || '').trim().toLowerCase();
    if (!correo) return crearSalidaJson({ status: 'error', message: 'El correo es obligatorio.' }, 400);

    const numCols = Math.max(hoja.getLastColumn(), HEADERS_USUARIOS.length);
    const fila = new Array(numCols).fill('');

    const setVal = (h, val) => {
      const idx = mapa[h] !== undefined ? mapa[h] : mapa[h.toLowerCase()];
      if (idx !== undefined && idx < numCols) fila[idx] = val;
    };

    setVal('Nombres', payload.Nombres || payload.nombres || '');
    setVal('Curso', payload.Curso || payload.curso || '11');
    setVal('Correo', correo);
    setVal('Sección', payload.Sección || payload.seccion || 'Bachillerato');
    setVal('Perfil', payload.Perfil || payload.perfil || 'Estudiante');

    hoja.appendRow(fila);
    return crearSalidaJson({ status: 'success', message: 'Usuario registrado exitosamente.' });
  }

  if (subAction === 'delete') {
    const target = String(payload.Correo || payload.correo || '').trim().toLowerCase();
    const lastRow = hoja.getLastRow();
    if (lastRow > 1) {
      const cCorreo = mapa['correo'];
      const data = hoja.getRange(2, 1, lastRow - 1, hoja.getLastColumn()).getValues();
      for (let i = 0; i < data.length; i++) {
        if (cCorreo !== undefined && String(data[i][cCorreo]).trim().toLowerCase() === target) {
          hoja.deleteRow(i + 2);
          return crearSalidaJson({ status: 'success', message: 'Usuario eliminado exitosamente.' });
        }
      }
    }
    return crearSalidaJson({ status: 'error', message: 'Usuario no encontrado para eliminar.' }, 404);
  }

  return crearSalidaJson({ status: 'error', message: 'Acción no reconocida: ' + subAction }, 400);
}

function sanitizar(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm');
  }
  return String(val)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

function crearSalidaJson(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
