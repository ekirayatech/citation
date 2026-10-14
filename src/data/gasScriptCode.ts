export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * COLEGIO EKIRAYÁ - SISTEMA DE REPOSITORIO DE PROYECTOS DE VIDA (BACKEND GAS)
 * =========================================================================
 * 
 * Google Apps Script: Code.gs
 * Hoja de Cálculo ID: 1_Te5Czkvtjue-49-foSBU3tWSTMg1-tucAPAzWIjJSw
 * Carpeta Raíz Drive (Unidades Académicas) ID: 1BLBoX4Y7k3V_z8-Xy1VwPF199Ith9BOM
 * 
 * Jerarquía en Google Drive:
 * Unidades Académicas (Raíz)
 *  └── [Nombre de Unidad Académica] (ej. Ciencias, Música, Psicología, etc.)
 *       └── [Año] (ej. 2025, 2026, 2027)
 *            └── [archivo_proyecto.pdf]
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
const SPREADSHEET_ID = '1_Te5Czkvtjue-49-foSBU3tWSTMg1-tucAPAzWIjJSw';
const ROOT_FOLDER_ID = '1BLBoX4Y7k3V_z8-Xy1VwPF199Ith9BOM'; // Unidades Académicas
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
// 1. MAPEO DINÁMICO DE COLUMNAS Y UTILIDADES DE IDENTIFICACIÓN DE DRIVE
// =========================================================================

function extraerDriveFileId(valor) {
  if (!valor) return '';
  const str = String(valor).trim();
  if (!str) return '';

  if (/^[a-zA-Z0-9_-]{25,55}$/.test(str)) {
    return str;
  }

  const matchHyperlink = str.match(/=HYPERLINK\\(\\s*[\"']([^\"']+)[\"']/i);
  if (matchHyperlink && matchHyperlink[1]) {
    const fromHl = extraerDriveFileId(matchHyperlink[1]);
    if (fromHl) return fromHl;
  }

  const matchFileD = str.match(/\\/file(?:\\/u\\/\\d+)?\\/d\\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1].trim();

  const matchD = str.match(/\\/d\\/([a-zA-Z0-9_-]+)/i);
  if (matchD && matchD[1]) return matchD[1].trim();

  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1].trim();

  return '';
}

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

  const normalizar = (txt) => {
    return String(txt || '')
      .trim()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  encabezados.forEach((nombre, idx) => {
    if (nombre !== null && nombre !== undefined) {
      const limpio = String(nombre).trim();
      if (limpio.length > 0) {
        mapa[limpio] = idx;
        mapa[limpio.toLowerCase()] = idx;
        mapa[normalizar(limpio)] = idx;
      }
    }
  });

  const sinonimos = {
    'drive_file_id': [
      'drive_file_id', 'drivefileid', 'id_drive', 'iddrive', 'file_id', 'fileid',
      'drive id', 'id drive', 'id de drive', 'id_de_drive', 'id archivo', 'id de archivo',
      'idarchivo', 'id_archivo', 'google drive id', 'drive_id', 'driveid', 'archivo_id'
    ],
    'url_documento': [
      'url_documento', 'urldocumento', 'url', 'enlace', 'link', 'enlace_documento',
      'url documento', 'link drive', 'enlace drive', 'url drive', 'link pdf',
      'enlace pdf', 'url pdf', 'enlace_archivo', 'link_archivo', 'url_archivo'
    ],
    'documento_id': ['documento_id', 'documentoid', 'id_documento', 'iddocumento', 'id', 'codigo', 'código'],
    'titulo': ['titulo', 'título', 'nombre', 'title', 'tema'],
    'autor': ['autor', 'autores', 'estudiante', 'estudiantes'],
    'grado': ['grado', 'curso', 'nivel'],
    'año': ['año', 'ano', 'anio', 'year'],
    'Unidad Académica': ['unidad académica', 'unidad academica', 'unidadacademica', 'unidad'],
    'Linea de investigación': ['linea de investigación', 'linea de investigacion', 'lineadeinvestigacion', 'linea', 'línea'],
    'resumen': ['resumen', 'abstract', 'descripcion', 'descripción'],
    'Asesor(es)': ['asesor(es)', 'asesores', 'asesor', 'tutor', 'tutores'],
    'palabras_clave': ['palabras_clave', 'palabras clave', 'palabrasclave', 'keywords'],
    'tipo': ['tipo', 'tipo_documento'],
    'visibilidad': ['visibilidad', 'acceso'],
    'estado': ['estado', 'status'],
    'fecha_registro': ['fecha_registro', 'fecharegistro'],
    'fecha_actualizacion': ['fecha_actualizacion', 'fechaactualizacion']
  };

  Object.keys(sinonimos).forEach(canonico => {
    if (mapa[canonico] === undefined) {
      const lista = sinonimos[canonico];
      for (let i = 0; i < lista.length; i++) {
        const s = lista[i];
        if (mapa[s] !== undefined) {
          mapa[canonico] = mapa[s];
          break;
        }
        const normS = normalizar(s);
        if (mapa[normS] !== undefined) {
          mapa[canonico] = mapa[normS];
          break;
        }
      }
    }
  });

  return mapa;
}

// =========================================================================
// 2. ESCANEO RECURSIVO DE DRIVE E INSERCIÓN EN SHEETS (IDEMPOTENTE)
// =========================================================================

function sincronizarRepositorioDrive() {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(30000);
  if (!hasLock) {
    return {
      status: 'error',
      message: 'Hay otra sincronización en ejecución. Intenta de nuevo en unos momentos.'
    };
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaRepo = ss.getSheetByName(HOJA_REPOSITORIO);

    if (!hojaRepo) {
      const todasHojas = ss.getSheets();
      for (let h = 0; h < todasHojas.length; h++) {
        const nHoja = todasHojas[h].getName().trim().toLowerCase();
        if (nHoja === HOJA_REPOSITORIO.toLowerCase() || nHoja === 'monografias' || nHoja === 'monografías') {
          hojaRepo = todasHojas[h];
          break;
        }
      }
    }

    if (!hojaRepo) {
      throw new Error('No se encontró la hoja "' + HOJA_REPOSITORIO + '" en el Google Sheet.');
    }

    const lastCol = hojaRepo.getLastColumn();
    if (lastCol === 0) {
      throw new Error('La hoja "' + HOJA_REPOSITORIO + '" no contiene columnas ni encabezados.');
    }

    const encabezados = hojaRepo.getRange(1, 1, 1, lastCol).getValues()[0];
    let colDriveFileId = -1;
    let colUrlDocumento = -1;
    const mapaCols = {};

    const normalizarEncabezado = (txt) => {
      return String(txt || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    for (let c = 0; c < encabezados.length; c++) {
      const hRaw = String(encabezados[c] || '').trim();
      const hNorm = normalizarEncabezado(hRaw);
      if (hRaw) {
        mapaCols[hRaw] = c;
        mapaCols[hRaw.toLowerCase()] = c;
        mapaCols[hNorm] = c;
      }
      if (
        hNorm === 'drivefileid' ||
        hNorm === 'iddrive' ||
        hNorm === 'idarchivo' ||
        hNorm === 'fileid' ||
        hNorm === 'driveid'
      ) {
        colDriveFileId = c;
      }
      if (
        hNorm === 'urldocumento' ||
        hNorm === 'url' ||
        hNorm === 'link' ||
        hNorm === 'enlace' ||
        hNorm === 'linkdocumento' ||
        hNorm === 'urldrive'
      ) {
        colUrlDocumento = c;
      }
    }

    if (colUrlDocumento === -1 && mapaCols['url_documento'] !== undefined) {
      colUrlDocumento = mapaCols['url_documento'];
    }

    if (colDriveFileId === -1) {
      throw new Error('Error crítico: No se encontró la columna "drive_file_id" en la hoja "' + HOJA_REPOSITORIO + '".');
    }

    const lastRow = hojaRepo.getLastRow();
    const existingDriveIds = new Set();
    let filasSinDriveFileIdConUrl = 0;

    if (lastRow > 1) {
      const valoresDriveCol = hojaRepo.getRange(2, colDriveFileId + 1, lastRow - 1, 1).getValues();
      let valoresUrlCol = null;
      if (colUrlDocumento !== -1) {
        valoresUrlCol = hojaRepo.getRange(2, colUrlDocumento + 1, lastRow - 1, 1).getValues();
      }

      for (let r = 0; r < valoresDriveCol.length; r++) {
        const celdaDrive = valoresDriveCol[r][0];
        const idLimpio = celdaDrive !== null && celdaDrive !== undefined ? String(celdaDrive).trim() : '';

        if (idLimpio.length > 0) {
          existingDriveIds.add(idLimpio);
          existingDriveIds.add(idLimpio.toLowerCase());
          const idExtraido = extraerDriveFileId(idLimpio);
          if (idExtraido && idExtraido.length > 0) {
            existingDriveIds.add(idExtraido);
            existingDriveIds.add(idExtraido.toLowerCase());
          }
        } else if (valoresUrlCol) {
          const celdaUrl = valoresUrlCol[r][0];
          const urlLimpia = celdaUrl !== null && celdaUrl !== undefined ? String(celdaUrl).trim() : '';
          const idDeUrl = extraerDriveFileId(urlLimpia);
          if (idDeUrl && idDeUrl.length > 0) {
            filasSinDriveFileIdConUrl++;
            existingDriveIds.add(idDeUrl);
            existingDriveIds.add(idDeUrl.toLowerCase());
          }
        }
      }
    }

    // Abrir la carpeta raíz (Unidades Académicas)
    let carpetaRaiz;
    try {
      carpetaRaiz = DriveApp.getFolderById(ROOT_FOLDER_ID);
    } catch (e) {
      throw new Error('No se pudo abrir la carpeta raíz Unidades Académicas (' + ROOT_FOLDER_ID + '): ' + e.message);
    }

    let totalPdfsEncontrados = 0;
    let nuevosInsertados = 0;
    let omitidosYaExistian = 0;
    let totalErrores = 0;
    const nuevasFilas = [];
    const timeZone = Session.getScriptTimeZone() || 'America/Bogota';
    const fechaHoy = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');

    // Nivel 1: Recorrer subcarpetas de cada Unidad Académica directamente desde la raíz
    const iteradorUnidades = carpetaRaiz.getFolders();

    while (iteradorUnidades.hasNext()) {
      const carpetaUnidad = iteradorUnidades.next();
      const nombreUnidad = carpetaUnidad.getName().trim();

      // Nivel 2: Recorrer subcarpetas por Año
      const iteradorAnios = carpetaUnidad.getFolders();

      while (iteradorAnios.hasNext()) {
        const carpetaAnio = iteradorAnios.next();
        const anioStr = carpetaAnio.getName().trim();

        // Nivel 3: Leer archivos PDF
        const iteradorArchivos = carpetaAnio.getFiles();

        while (iteradorArchivos.hasNext()) {
          let archivo;
          try {
            archivo = iteradorArchivos.next();
          } catch (eArch) {
            totalErrores++;
            continue;
          }

          const nombreArchivo = archivo.getName();
          const mimeType = archivo.getMimeType();

          if (mimeType === 'application/pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
            totalPdfsEncontrados++;

            let rawFileId = '';
            try {
              rawFileId = archivo.getId();
            } catch (eId) {
              totalErrores++;
              continue;
            }

            const fileId = String(rawFileId || '').trim();
            if (!fileId) {
              totalErrores++;
              continue;
            }

            if (existingDriveIds.has(fileId) || existingDriveIds.has(fileId.toLowerCase())) {
              omitidosYaExistian++;
              continue;
            }

            existingDriveIds.add(fileId);
            existingDriveIds.add(fileId.toLowerCase());

            const fileUrl = archivo.getUrl();
            const tituloLimpio = nombreArchivo
              .replace(/\\.pdf$/i, '')
              .replace(/_/g, ' ')
              .trim();

            const docIdSuffix = fileId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
            const documentoId = 'DOC_' + anioStr + '_' + docIdSuffix;

            const numCols = Math.max(lastCol, HEADERS_REPOSITORIO.length);
            const fila = new Array(numCols).fill('');

            const asignarValor = (nombreCol, valor) => {
              const idx = mapaCols[nombreCol] !== undefined
                ? mapaCols[nombreCol]
                : mapaCols[nombreCol.toLowerCase()];
              if (idx !== undefined && idx < numCols) {
                fila[idx] = valor;
              }
            };

            asignarValor('documento_id', documentoId);
            asignarValor('titulo', tituloLimpio);
            asignarValor('autor', '');
            asignarValor('grado', '11');
            asignarValor('año', anioStr);
            asignarValor('Unidad Académica', nombreUnidad);
            asignarValor('Linea de investigación', '');
            asignarValor('tipo', 'Proyecto de Vida');
            asignarValor('palabras_clave', '');
            asignarValor('resumen', '');
            asignarValor('Asesor(es)', '');
            asignarValor('url_documento', fileUrl);
            asignarValor('visibilidad', 'Público Institucional');
            asignarValor('estado', 'Finalizado');
            asignarValor('fecha_registro', fechaHoy);
            asignarValor('fecha_actualizacion', fechaHoy);

            fila[colDriveFileId] = fileId;

            const idEnFila = String(fila[colDriveFileId] || '').trim();
            if (!idEnFila || idEnFila !== fileId) {
              totalErrores++;
              continue;
            }

            nuevasFilas.push(fila);
            nuevosInsertados++;
          }
        }
      }
    }

    const filasParaInsertar = [];
    for (let i = 0; i < nuevasFilas.length; i++) {
      const f = nuevasFilas[i];
      const idEnColumna = String(f[colDriveFileId] || '').trim();
      if (idEnColumna.length > 0) {
        filasParaInsertar.push(f);
      } else {
        totalErrores++;
        nuevosInsertados--;
      }
    }

    if (filasParaInsertar.length > 0) {
      const filaInicio = hojaRepo.getLastRow() + 1;
      hojaRepo.getRange(filaInicio, 1, filasParaInsertar.length, filasParaInsertar[0].length).setValues(filasParaInsertar);
      SpreadsheetApp.flush();
    }

    return {
      status: 'success',
      totalArchivosEncontrados: totalPdfsEncontrados,
      nuevosInsertados: nuevosInsertados,
      omitidosYaExistian: omitidosYaExistian,
      duplicadosOmitidos: omitidosYaExistian,
      errores: totalErrores,
      casosRevision: filasSinDriveFileIdConUrl,
      filasSinDriveFileIdConUrl: filasSinDriveFileIdConUrl,
      fechaSincronizacion: fechaHoy,
      message: 'Sincronización completada: ' + nuevosInsertados + ' documentos nuevos insertados.'
    };
  } finally {
    lock.releaseLock();
  }
}

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
}

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

    if (action === 'syncDrive' || action === 'syncDriveAndSheets' || action === 'sync') {
      const stats = sincronizarRepositorioDrive();
      return crearSalidaJson({ status: 'success', message: 'Sincronización completada', data: stats });
    }

    return crearSalidaJson({ status: 'error', message: 'Acción GET desconocida: ' + action }, 400);
  } catch (err) {
    return crearSalidaJson({ status: 'error', message: err.toString() }, 500);
  }
}

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

    if (action === 'syncDrive' || action === 'syncDriveAndSheets' || action === 'sync') {
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

    if (action === 'manageUser') {
      return procesarGestionUsuario(payload);
    }

    return crearSalidaJson({ status: 'error', message: 'Acción POST no reconocida: ' + action }, 400);
  } catch (err) {
    return crearSalidaJson({ status: 'error', message: err.toString() }, 500);
  }
}

function responderMonografias() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(HOJA_REPOSITORIO);

  if (!hoja || hoja.getLastRow() <= 1) {
    return crearSalidaJson({ status: 'success', message: 'No hay registros', data: [], count: 0 });
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
    if (lastRow > 1)হের
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

function sanitizar(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm');
  }
  return String(val)
    .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
    .trim();
}

function crearSalidaJson(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
