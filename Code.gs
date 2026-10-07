/**
 * REPOSITO PV - SISTEMA DE MONOGRAFÍAS EKIRAYÁ
 * Backend sin dependencia de hoja usuarios.
 */

const CONFIG = {
  NOMBRE_CARPETA_RAIZ: 'REPOSITORIO PV',
  SUBPROP_UNIDADES: 'Unidades Académicas',
  HOJA_REPOSITORIO: 'repositorio',
  DOMINIOS_PERMITIDOS: ['cem.edu.co', 'est.cem.edu.co']
};

/**
 * 1. MAPEO DINÁMICO DE COLUMNAS (Fila 1)
 */
function obtenerMapaColumnas(hoja) {
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const mapa = {};
  encabezados.forEach((nombre, index) => {
    if (nombre) {
      mapa[nombre.toString().trim()] = index;
    }
  });
  return mapa;
}

/**
 * 2. VALIDACIÓN DE DOMINIO INSTITUCIONAL
 */
function esCorreoValido(email) {
  if (!email) return false;
  const emailLimpio = email.toLowerCase().trim();
  return CONFIG.DOMINIOS_PERMITIDOS.some(dominio => emailLimpio.endsWith('@' + dominio));
}

/**
 * 3. ESCANEO Y SINCRONIZACIÓN AUTOMÁTICA DE DRIVE
 * Jerarquía: REPOSITORIO PV / Unidades Académicas / [Unidad] / [Año] / [Archivo.pdf]
 */
function sincronizarRepositorioDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaRepo = ss.getSheetByName(CONFIG.HOJA_REPOSITORIO);
  if (!hojaRepo) throw new Error(`No se encontró la hoja '${CONFIG.HOJA_REPOSITORIO}'`);

  const col = obtenerMapaColumnas(hojaRepo);
  
  // Buscar carpeta raíz 'REPOSITORIO PV'
  const carpetasRaiz = DriveApp.getFoldersByName(CONFIG.NOMBRE_CARPETA_RAIZ);
  if (!carpetasRaiz.hasNext()) {
    throw new Error(`No se encontró la carpeta raíz '${CONFIG.NOMBRE_CARPETA_RAIZ}'`);
  }
  const carpetaRaiz = carpetasRaiz.next();

  // Buscar subcarpeta 'Unidades Académicas'
  const carpetasUnidadesPadre = carpetaRaiz.getFoldersByName(CONFIG.SUBPROP_UNIDADES);
  if (!carpetasUnidadesPadre.hasNext()) {
    throw new Error(`No se encontró la subcarpeta '${CONFIG.SUBPROP_UNIDADES}' dentro de '${CONFIG.NOMBRE_CARPETA_RAIZ}'`);
  }
  const carpetaUnidadesPadre = carpetasUnidadesPadre.next();

  // Obtener IDs/URLs existentes en Sheets para prevenir duplicados
  const datosExistentes = hojaRepo.getDataRange().getValues();
  const identificadoresExistentes = new Set();
  
  if (datosExistentes.length > 1) {
    for (let i = 1; i < datosExistentes.length; i++) {
      const fileId = col['drive_file_id'] !== undefined ? datosExistentes[i][col['drive_file_id']] : '';
      const urlDoc = col['url_documento'] !== undefined ? datosExistentes[i][col['url_documento']] : '';
      if (fileId) identificadoresExistentes.add(fileId.toString().trim());
      if (urlDoc) identificadoresExistentes.add(urlDoc.toString().trim());
    }
  }

  const nuevasFilas = [];
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // Nivel 2: Iterar sobre cada Unidad Académica
  const subcarpetasUnidades = carpetaUnidadesPadre.getFolders();
  while (subcarpetasUnidades.hasNext()) {
    const carpetaUnidad = subcarpetasUnidades.next();
    const nombreUnidad = carpetaUnidad.getName().trim();

    // Nivel 3: Iterar sobre subcarpetas por Año
    const carpetasAnios = carpetaUnidad.getFolders();
    while (carpetasAnios.hasNext()) {
      const carpetaAnio = carpetasAnios.next();
      const anio = carpetaAnio.getName().trim();

      // Nivel 4: Iterar sobre archivos dentro de cada Año
      const archivos = carpetaAnio.getFiles();
      while (archivos.hasNext()) {
        const archivo = archivos.next();
        const fileId = archivo.getId();
        const urlArchivo = archivo.getUrl();

        // Verificar si el archivo es nuevo
        if (!identificadoresExistentes.has(fileId) && !identificadoresExistentes.has(urlArchivo)) {
          const docId = Math.floor(1000 + Math.random() * 9000).toString(); // ID Numérico
          const nombreSinExtension = archivo.getName().replace(/\.[^/.]+$/, "");

          // Inicializar arreglo para las 17 columnas
          const totalColumnas = Object.keys(col).length || hojaRepo.getLastColumn();
          const nuevaFila = new Array(totalColumnas).fill('');

          if (col['documento_id'] !== undefined) nuevaFila[col['documento_id']] = docId;
          if (col['titulo'] !== undefined) nuevaFila[col['titulo']] = nombreSinExtension;
          if (col['autor'] !== undefined) nuevaFila[col['autor']] = '';
          if (col['grado'] !== undefined) nuevaFila[col['grado']] = '11';
          if (col['año'] !== undefined) nuevaFila[col['año']] = anio;
          if (col['Unidad Académica'] !== undefined) nuevaFila[col['Unidad Académica']] = nombreUnidad;
          if (col['Linea de investigación'] !== undefined) nuevaFila[col['Linea de investigación']] = '';
          if (col['tipo'] !== undefined) nuevaFila[col['tipo']] = 'Investigación';
          if (col['palabras_clave'] !== undefined) nuevaFila[col['palabras_clave']] = '';
          if (col['resumen'] !== undefined) nuevaFila[col['resumen']] = '';
          if (col['Asesor(es)'] !== undefined) nuevaFila[col['Asesor(es)']] = '';
          if (col['drive_file_id'] !== undefined) nuevaFila[col['drive_file_id']] = fileId;
          if (col['url_documento'] !== undefined) nuevaFila[col['url_documento']] = urlArchivo;
          if (col['visibilidad'] !== undefined) nuevaFila[col['visibilidad']] = 'Digital';
          if (col['estado'] !== undefined) nuevaFila[col['estado']] = 'Finalizado';
          if (col['fecha_registro'] !== undefined) nuevaFila[col['fecha_registro']] = fechaHoy;
          if (col['fecha_actualizacion'] !== undefined) nuevaFila[col['fecha_actualizacion']] = fechaHoy;

          nuevasFilas.push(nuevaFila);
          identificadoresExistentes.add(fileId);
        }
      }
    }
  }

  // Insertar únicamente las nuevas líneas en Sheets
  if (nuevasFilas.length > 0) {
    hojaRepo.getRange(
      hojaRepo.getLastRow() + 1, 
      1, 
      nuevasFilas.length, 
      nuevasFilas[0].length
    ).setValues(nuevasFilas);
  }

  return { sincronizados: nuevasFilas.length };
}

/**
 * 4. ACTIVADOR PARA AUTO-DESPLIEGUE Y AUTO-SINCRONIZACIÓN
 * Ejecuta esta función UNA sola vez en Apps Script para programar el escaneo automático.
 */
function crearActivadorAutomatico() {
  // Eliminar activadores previos para evitar duplicados
  const activadores = ScriptApp.getProjectTriggers();
  activadores.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Crear un activador que sincroniza el repositorio cada 1 hora
  ScriptApp.newTrigger('sincronizarRepositorioDrive')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Activador automático creado exitosamente. Se ejecutará cada hora.');
}

/**
 * 5. ENDPOINTS WEB API (doGet / doPost)
 */
function doGet(e) {
  const action = e.parameter.action;
  const email = e.parameter.email;

  try {
    // Validar acceso solo por dominio
    if (!esCorreoValido(email)) {
      return jsonResponse({ status: 'error', message: 'Acceso no autorizado. Debe ingresar con su correo institucional (@cem.edu.co o @est.cem.edu.co).' });
    }

    if (action === 'getMonografias') {
      return jsonResponse({ status: 'success', data: obtenerMonografiasFormateadas() });
    }

    return jsonResponse({ status: 'error', message: 'Acción no válida en GET.' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const email = payload.email;

    if (!esCorreoValido(email)) {
      return jsonResponse({ status: 'error', message: 'Dominio de correo no autorizado.' });
    }

    if (payload.action === 'syncDrive') {
      const resultado = sincronizarRepositorioDrive();
      return jsonResponse({ 
        status: 'success', 
        message: `Sincronización finalizada. Se detectaron ${resultado.sincronizados} documentos nuevos.`, 
        data: resultado 
      });
    }

    return jsonResponse({ status: 'error', message: 'Acción no válida en POST.' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * LECTURA DE MONOGRAFÍAS
 */
function obtenerMonografiasFormateadas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(CONFIG.HOJA_REPOSITORIO);
  const datos = hoja.getDataRange().getValues();
  
  if (datos.length <= 1) return [];

  const col = obtenerMapaColumnas(hoja);
  const registros = [];

  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    registros.push({
      documento_id: col['documento_id'] !== undefined ? fila[col['documento_id']] : '',
      titulo: col['titulo'] !== undefined ? fila[col['titulo']] : '',
      autor: col['autor'] !== undefined ? fila[col['autor']] : '',
      grado: col['grado'] !== undefined ? fila[col['grado']] : '',
      año: col['año'] !== undefined ? fila[col['año']] : '',
      unidadAcademica: col['Unidad Académica'] !== undefined ? fila[col['Unidad Académica']] : '',
      lineaInvestigacion: col['Linea de investigación'] !== undefined ? fila[col['Linea de investigación']] : '',
      tipo: col['tipo'] !== undefined ? fila[col['tipo']] : '',
      palabrasClave: col['palabras_clave'] !== undefined ? fila[col['palabras_clave']] : '',
      resumen: col['resumen'] !== undefined ? fila[col['resumen']] : '',
      asesores: col['Asesor(es)'] !== undefined ? fila[col['Asesor(es)']] : '',
      driveFileId: col['drive_file_id'] !== undefined ? fila[col['drive_file_id']] : '',
      urlDocumento: col['url_documento'] !== undefined ? fila[col['url_documento']] : '',
      visibilidad: col['visibilidad'] !== undefined ? fila[col['visibilidad']] : '',
      estado: col['estado'] !== undefined ? fila[col['estado']] : '',
      fechaRegistro: col['fecha_registro'] !== undefined ? fila[col['fecha_registro']] : '',
      fechaActualizacion: col['fecha_actualizacion'] !== undefined ? fila[col['fecha_actualizacion']] : ''
    });
  }

  return registros;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
