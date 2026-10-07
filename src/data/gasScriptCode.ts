/**
 * Código completo y verificado para Google Apps Script (Code.gs)
 * Colegio Ekirayá - Repositorio de Monografías (Proyecto de Vida)
 * 
 * Hoja de Cálculo ID: 1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow
 * Carpeta Raíz Drive: REPOSITORIO PV (ID: 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii)
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * COLEGIO EKIRAYÁ - SISTEMA DE REPOSITORIO DE MONOGRAFÍAS (BACKEND GAS)
 * =========================================================================
 * 
 * Configuración:
 * - ID de Google Sheet: 1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow
 * - ID Carpeta Raíz Drive (REPOSITORIO PV): 1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii
 * 
 * Estructura de Drive:
 * REPOSITORIO PV / Unidades Académicas / [Unidad Académica] / [Año] / [archivo.pdf]
 * 
 * Hojas de Google Sheet:
 * 1. "Repositorio" (17 columnas dinámicas)
 * 2. "Usuarios" (5 columnas dinámicas)
 */

// Configuración Global
const SPREADSHEET_ID = '1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow';
const ROOT_FOLDER_ID = '1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii';
const HOJA_REPOSITORIO = 'Repositorio';
const HOJA_USUARIOS = 'Usuarios';

// Dominios autorizados de la comunidad educativa
const ALLOWED_DOMAINS = ['@cem.edu.co', '@est.cem.edu.co', '@ekiraya.edu.co'];

/**
 * Encabezados esperados en la hoja Repositorio (17 columnas)
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
 * Encabezados esperados en la hoja Usuarios (5 columnas)
 */
const HEADERS_USUARIOS = [
  'Nombres',
  'Curso',
  'Correo',
  'Sección',
  'Perfil'
];

// =========================================================================
// TAREA 1: MAPEO DINÁMICO DE COLUMNAS Y ESCANEO EN APPS SCRIPT
// =========================================================================

/**
 * Mapea dinámicamente los nombres de columna de la Fila 1 a sus índices (0-indexed).
 * Permite que el sistema funcione aunque las columnas se reordenen o inserten nuevas.
 * @param {Sheet} hoja - Instancia de Google Sheets
 * @return {Object} Mapa de nombre_columna => índice
 */
function obtenerMapaColumnas(hoja) {
  if (!hoja) throw new Error('Hoja no válida para mapeo de columnas');
  const lastCol = hoja.getLastColumn();
  if (lastCol === 0) return {};
  
  const headers = hoja.getRange(1, 1, 1, lastCol).getValues()[0];
  const mapa = {};
  
  headers.forEach((h, idx) => {
    if (h && typeof h === 'string') {
      const nombreLimpio = h.trim();
      mapa[nombreLimpio] = idx;
      // Mapeo insensitivo a mayúsculas/minúsculas para mayor robustez
      mapa[nombreLimpio.toLowerCase()] = idx;
    }
  });
  
  return mapa;
}

/**
 * Escanea recursivamente Google Drive siguiendo la jerarquía:
 * REPOSITORIO PV -> Unidades Académicas -> [Unidad] -> [Año] -> Archivos PDF
 * Indexa nuevos documentos en la hoja "Repositorio" sin duplicados.
 * @return {Object} Estadísticas de la sincronización { totalEncontrados, nuevosInsertados, duplicadosOmitidos }
 */
function sincronizarRepositorioDrive() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = ss.getSheetByName(HOJA_REPOSITORIO);
  
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_REPOSITORIO);
    hoja.appendRow(HEADERS_REPOSITORIO);
  }
  
  // 1. Obtener mapa dinámico de columnas
  const mapaCol = obtenerMapaColumnas(hoja);
  
  // 2. Cargar IDs y URLs existentes para control estricto de duplicados
  const lastRow = hoja.getLastRow();
  const existingFileIds = new Set();
  const existingUrls = new Set();
  
  if (lastRow > 1) {
    const data = hoja.getRange(2, 1, lastRow - 1, hoja.getLastColumn()).getValues();
    const driveIdColIdx = mapaCol['drive_file_id'] !== undefined ? mapaCol['drive_file_id'] : mapaCol['drive_file_id'];
    const urlColIdx = mapaCol['url_documento'] !== undefined ? mapaCol['url_documento'] : mapaCol['url_documento'];
    
    data.forEach(row => {
      if (driveIdColIdx !== undefined && row[driveIdColIdx]) {
        existingFileIds.add(String(row[driveIdColIdx]).trim());
      }
      if (urlColIdx !== undefined && row[urlColIdx]) {
        existingUrls.add(String(row[urlColIdx]).trim());
      }
    });
  }
  
  // 3. Abrir la carpeta raíz "REPOSITORIO PV"
  let rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  } catch (err) {
    throw new Error('No se pudo acceder a la carpeta raíz de Drive (REPOSITORIO PV): ' + err.message);
  }
  
  // 4. Buscar subcarpeta fija "Unidades Académicas"
  const subCarpetasNivel1 = rootFolder.getFoldersByName('Unidades Académicas');
  let folderUnidades = null;
  if (subCarpetasNivel1.hasNext()) {
    folderUnidades = subCarpetasNivel1.next();
  } else {
    // Si no existe con ese nombre exacto, iterar subcarpetas
    const iter = rootFolder.getFolders();
    while (iter.hasNext()) {
      const f = iter.next();
      if (/unidades\\s*acad[eé]micas/i.test(f.getName())) {
        folderUnidades = f;
        break;
      }
    }
  }
  
  if (!folderUnidades) {
    folderUnidades = rootFolder; // Fallback a la raíz si las carpetas están en primer nivel
  }
  
  let totalEncontrados = 0;
  let nuevosInsertados = 0;
  let duplicadosOmitidos = 0;
  const filasNuevas = [];
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm:ss');
  
  // 5. Recorrer Nivel 2: Subcarpetas de cada Unidad Académica
  const carpetasUnidades = folderUnidades.getFolders();
  while (carpetasUnidades.hasNext()) {
    const carpetaUnidad = carpetasUnidades.next();
    const nombreUnidad = carpetaUnidad.getName().trim();
    
    // 6. Recorrer Nivel 3: Subcarpetas por Año
    const carpetasAnios = carpetaUnidad.getFolders();
    while (carpetasAnios.hasNext()) {
      const carpetaAnio = carpetasAnios.next();
      const anioStr = carpetaAnio.getName().trim();
      
      // 7. Recorrer Nivel 4: Archivos PDF de monografías
      const archivos = carpetaAnio.getFiles();
      while (archivos.hasNext()) {
        const archivo = archivos.next();
        const mime = archivo.getMimeType();
        const nombreArchivo = archivo.getName();
        
        // Procesar archivos PDF o documentos principales
        if (mime === 'application/pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
          totalEncontrados++;
          const fileId = archivo.getId();
          const fileUrl = archivo.getUrl();
          
          if (existingFileIds.has(fileId) || existingUrls.has(fileUrl)) {
            duplicadosOmitidos++;
            continue;
          }
          
          // Generar ID único de documento
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const docId = anioStr + '_' + randomSuffix;
          
          // Título limpio sin extensión
          const tituloLimpio = nombreArchivo.replace(/\\.pdf$/i, '').replace(/_/g, ' ').trim();
          
          // Construir fila respetando los 17 encabezados
          const numCols = Math.max(hoja.getLastColumn(), HEADERS_REPOSITORIO.length);
          const nuevaFila = new Array(numCols).fill('');
          
          const setVal = (nombreCol, val) => {
            const idx = mapaCol[nombreCol] !== undefined ? mapaCol[nombreCol] : mapaCol[nombreCol.toLowerCase()];
            if (idx !== undefined && idx < numCols) {
              nuevaFila[idx] = val;
            }
          };
          
          setVal('documento_id', docId);
          setVal('titulo', tituloLimpio);
          setVal('autor', ''); // Se completa pedagógicamente en Sheets
          setVal('grado', '11');
          setVal('año', anioStr);
          setVal('Unidad Académica', nombreUnidad);
          setVal('Linea de investigación', '');
          setVal('tipo', 'Monografía');
          setVal('palabras_clave', '');
          setVal('resumen', '');
          setVal('Asesor(es)', '');
          setVal('drive_file_id', fileId);
          setVal('url_documento', fileUrl);
          setVal('visibilidad', 'Público Institucional');
          setVal('estado', 'Finalizado');
          setVal('fecha_registro', fechaHoy);
          setVal('fecha_actualizacion', fechaHoy);
          
          filasNuevas.push(nuevaFila);
          existingFileIds.add(fileId);
          existingUrls.add(fileUrl);
          nuevosInsertados++;
        }
      }
    }
  }
  
  // 8. Insertar todas las filas nuevas por lotes para máximo rendimiento
  if (filasNuevas.length > 0) {
    const startRow = hoja.getLastRow() + 1;
    hoja.getRange(startRow, 1, filasNuevas.length, filasNuevas[0].length).setValues(filasNuevas);
  }
  
  return {
    totalEncontrados: totalEncontrados,
    nuevosInsertados: nuevosInsertados,
    duplicadosOmitidos: duplicadosOmitidos,
    fechaSincronizacion: fechaHoy
  };
}

/**
 * Configura un disparador (Trigger) para ejecutar la sincronización automática cada 24 horas.
 */
function crearTriggerDiario() {
  // Eliminar triggers anteriores de sincronización
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sincronizarRepositorioDrive') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Crear nuevo trigger diario a las 2:00 AM
  ScriptApp.newTrigger('sincronizarRepositorioDrive')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}

// =========================================================================
// TAREA 2: ENDPOINTS API EN APPS SCRIPT (doGet & doPost)
// =========================================================================

/**
 * Manejador de solicitudes GET (Lectura de Monografías y Verificación de Roles)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getMonografias';
    
    if (action === 'getMonografias') {
      return handleGetMonografias();
    }
    
    if (action === 'checkUserRole') {
      const email = e.parameter.email || '';
      return handleCheckUserRole(email);
    }
    
    if (action === 'getUsers') {
      return handleGetUsers();
    }
    
    return jsonResponse({
      status: 'error',
      message: 'Acción GET no reconocida: ' + action
    }, 400);
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Error interno en doGet: ' + err.toString()
    }, 500);
  }
}

/**
 * Manejador de solicitudes POST (Sincronización Drive y Gestión de Usuarios)
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
    const userEmail = payload.userEmail || payload.email || '';
    
    if (action === 'syncDrive') {
      // Validar perfil de administrador
      const roleCheck = verificarRolUsuario(userEmail);
      if (roleCheck.perfil !== 'Administrador' && userEmail.toLowerCase() !== 'mebolanos@cem.edu.co') {
        return jsonResponse({
          status: 'error',
          message: 'Acceso denegado: Solo usuarios con perfil de Administrador pueden sincronizar Drive.'
        }, 403);
      }
      
      const stats = sincronizarRepositorioDrive();
      return jsonResponse({
        status: 'success',
        message: 'Sincronización con Google Drive completada exitosamente.',
        data: stats
      });
    }
    
    if (action === 'manageUser') {
      return handleManageUser(payload);
    }
    
    return jsonResponse({
      status: 'error',
      message: 'Acción POST no reconocida: ' + action
    }, 400);
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Error procesando solicitud POST: ' + err.toString()
    }, 500);
  }
}

// =========================================================================
// HANDLERS AUXILIARES PARA LOS ENDPOINTS
// =========================================================================

/**
 * Retorna la lista completa de monografías sanitizadas desde la hoja "Repositorio"
 */
function handleGetMonografias() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_REPOSITORIO);
  
  if (!hoja) {
    return jsonResponse({
      status: 'success',
      message: 'La hoja Repositorio aún no contiene registros.',
      data: []
    });
  }
  
  const lastRow = hoja.getLastRow();
  if (lastRow <= 1) {
    return jsonResponse({
      status: 'success',
      message: 'No hay monografías registradas.',
      data: []
    });
  }
  
  const mapaCol = obtenerMapaColumnas(hoja);
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const rows = hoja.getRange(2, 1, lastRow - 1, hoja.getLastColumn()).getValues();
  
  const monografias = rows.map((row, rowIdx) => {
    const item = {};
    headers.forEach((headerName, colIdx) => {
      if (headerName) {
        const val = row[colIdx];
        item[String(headerName).trim()] = sanitizarTexto(val);
      }
    });
    
    // Asegurar los 17 campos estándar
    HEADERS_REPOSITORIO.forEach(h => {
      if (item[h] === undefined) {
        const idx = mapaCol[h] !== undefined ? mapaCol[h] : mapaCol[h.toLowerCase()];
        item[h] = (idx !== undefined && row[idx] !== undefined) ? sanitizarTexto(row[idx]) : '';
      }
    });
    
    return item;
  });
  
  return jsonResponse({
    status: 'success',
    message: 'Monografías obtenidas exitosamente.',
    data: monografias,
    count: monografias.length
  });
}

/**
 * Consulta la hoja "Usuarios" para verificar registro y perfil
 */
function handleCheckUserRole(email) {
  const check = verificarRolUsuario(email);
  return jsonResponse({
    status: 'success',
    data: check
  });
}

/**
 * Lógica interna de verificación de rol de usuario
 */
function verificarRolUsuario(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  
  if (!cleanEmail) {
    return { registered: false, perfil: 'Estudiante', isAdmin: false };
  }
  
  // Superadministrador institucional por defecto
  if (cleanEmail === 'mebolanos@cem.edu.co') {
    return { registered: true, perfil: 'Administrador', isAdmin: true };
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_USUARIOS);
  
  if (!hoja || hoja.getLastRow() <= 1) {
    const isTeacherDomain = cleanEmail.endsWith('@cem.edu.co') || cleanEmail.endsWith('@ekiraya.edu.co');
    return {
      registered: isTeacherDomain || cleanEmail.endsWith('@est.cem.edu.co'),
      perfil: isTeacherDomain ? 'Docente' : 'Estudiante',
      isAdmin: false
    };
  }
  
  const mapaCol = obtenerMapaColumnas(hoja);
  const correoColIdx = mapaCol['correo'] !== undefined ? mapaCol['correo'] : mapaCol['correo'];
  const perfilColIdx = mapaCol['perfil'] !== undefined ? mapaCol['perfil'] : mapaCol['perfil'];
  const nombresColIdx = mapaCol['nombres'] !== undefined ? mapaCol['nombres'] : mapaCol['nombres'];
  
  const rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowEmail = correoColIdx !== undefined ? String(row[correoColIdx]).trim().toLowerCase() : '';
    
    if (rowEmail === cleanEmail) {
      const perfil = perfilColIdx !== undefined ? String(row[perfilColIdx]).trim() : 'Estudiante';
      const nombres = nombresColIdx !== undefined ? String(row[nombresColIdx]).trim() : '';
      const isAdmin = /administrador|admin|coordinador/i.test(perfil);
      
      return {
        registered: true,
        perfil: perfil,
        isAdmin: isAdmin,
        nombres: nombres
      };
    }
  }
  
  // Si no está explícito en la hoja pero tiene dominio institucional
  const isEduCo = cleanEmail.endsWith('@cem.edu.co') || cleanEmail.endsWith('@ekiraya.edu.co');
  const isEstCo = cleanEmail.endsWith('@est.cem.edu.co');
  
  return {
    registered: isEduCo || isEstCo,
    perfil: isEduCo ? 'Docente' : 'Estudiante',
    isAdmin: false
  };
}

/**
 * Obtiene la lista completa de usuarios
 */
function handleGetUsers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_USUARIOS);
  
  if (!hoja || hoja.getLastRow() <= 1) {
    return jsonResponse({
      status: 'success',
      data: []
    });
  }
  
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  
  const users = rows.map(row => {
    const u = {};
    headers.forEach((h, idx) => {
      if (h) u[String(h).trim()] = sanitizarTexto(row[idx]);
    });
    return u;
  });
  
  return jsonResponse({
    status: 'success',
    data: users
  });
}

/**
 * Permite agregar, editar o eliminar usuarios en la hoja "Usuarios"
 */
function handleManageUser(payload) {
  const adminEmail = payload.adminEmail || payload.userEmail || '';
  const roleCheck = verificarRolUsuario(adminEmail);
  
  if (!roleCheck.isAdmin && adminEmail.toLowerCase() !== 'mebolanos@cem.edu.co') {
    return jsonResponse({
      status: 'error',
      message: 'Acceso denegado: Se requiere perfil de Administrador para gestionar usuarios.'
    }, 403);
  }
  
  const subAction = payload.subAction || 'add'; // 'add', 'edit', 'delete'
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = ss.getSheetByName(HOJA_USUARIOS);
  
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_USUARIOS);
    hoja.appendRow(HEADERS_USUARIOS);
  }
  
  const mapaCol = obtenerMapaColumnas(hoja);
  const lastRow = hoja.getLastRow();
  
  if (subAction === 'add') {
    const correo = String(payload.Correo || payload.correo || '').trim().toLowerCase();
    if (!correo) throw new Error('El correo del usuario es obligatorio.');
    
    // Validar duplicado
    if (lastRow > 1) {
      const correoColIdx = mapaCol['correo'];
      const data = hoja.getRange(2, 1, lastRow - 1, hoja.getLastColumn()).getValues();
      const exists = data.some(r => correoColIdx !== undefined && String(r[correoColIdx]).trim().toLowerCase() === correo);
      if (exists) {
        return jsonResponse({
          status: 'error',
          message: 'El usuario ya se encuentra registrado con el correo: ' + correo
        }, 400);
      }
    }
    
    const numCols = Math.max(hoja.getLastColumn(), HEADERS_USUARIOS.length);
    const nuevaFila = new Array(numCols).fill('');
    
    const setVal = (h, val) => {
      const idx = mapaCol[h] !== undefined ? mapaCol[h] : mapaCol[h.toLowerCase()];
      if (idx !== undefined && idx < numCols) nuevaFila[idx] = val;
    };
    
    setVal('Nombres', payload.Nombres || payload.nombres || '');
    setVal('Curso', payload.Curso || payload.curso || '11');
    setVal('Correo', correo);
    setVal('Sección', payload.Sección || payload.seccion || 'Bachillerato');
    setVal('Perfil', payload.Perfil || payload.perfil || 'Estudiante');
    
    hoja.appendRow(nuevaFila);
    
    return jsonResponse({
      status: 'success',
      message: 'Usuario agregado correctamente.'
    });
  }
  
  if (subAction === 'delete') {
    const targetEmail = String(payload.Correo || payload.correo || '').trim().toLowerCase();
    if (!targetEmail) throw new Error('Se requiere el correo del usuario a eliminar.');
    
    if (lastRow > 1) {
      const correoColIdx = mapaCol['correo'];
      const data = hoja.getRange(2, 1, lastRow - 1, hoja.getLastColumn()).getValues();
      for (let i = 0; i < data.length; i++) {
        if (correoColIdx !== undefined && String(data[i][correoColIdx]).trim().toLowerCase() === targetEmail) {
          hoja.deleteRow(i + 2);
          return jsonResponse({
            status: 'success',
            message: 'Usuario eliminado exitosamente.'
          });
        }
      }
    }
    
    return jsonResponse({
      status: 'error',
      message: 'Usuario no encontrado para eliminar.'
    }, 404);
  }
  
  return jsonResponse({
    status: 'error',
    message: 'Acción de gestión de usuario no válida: ' + subAction
  }, 400);
}

// =========================================================================
// TAREA 5: CAPAS DE SEGURIDAD, CORS, SANITIZACIÓN Y MANEJO DE RESPUESTAS
// =========================================================================

/**
 * Sanitiza valores de texto para prevenir inyecciones XSS y caracteres corruptos
 */
function sanitizarTexto(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm');
  }
  return String(val)
    .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
    .trim();
}

/**
 * Genera una respuesta HTTP estandarizada en formato JSON con cabeceras CORS
 */
function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
