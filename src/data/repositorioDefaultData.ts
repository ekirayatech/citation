export interface RawMonographRow {
  documento_id: string;
  titulo: string;
  autor: string;
  grado: string;
  año: string;
  'Unidad Académica': string;
  'Linea de investigación': string;
  tipo: string;
  palabras_clave: string;
  resumen: string;
  'Asesor(es)': string;
  drive_file_id: string;
  url_documento: string;
  visibilidad: string;
  estado: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  [key: string]: string;
}

export interface AuthorizedSchoolUser {
  curso: string;
  seccion: string;
  nombres: string;
  correo: string;
  perfil: string;
  isAdmin: boolean;
  createdInApp?: boolean;
  syncedToSheet?: boolean;
  rawRow?: Record<string, string>;
}

export const DEFAULT_REPO_HEADERS: string[] = [
  "documento_id",
  "titulo",
  "autor",
  "grado",
  "año",
  "Unidad Académica",
  "Linea de investigación",
  "tipo",
  "palabras_clave",
  "resumen",
  "Asesor(es)",
  "drive_file_id",
  "url_documento",
  "visibilidad",
  "estado",
  "fecha_registro",
  "fecha_actualizacion"
];

export const DEFAULT_REPO_ROWS: Record<string, string>[] = [
  {
    "documento_id": "2262",
    "titulo": "Formulación experimental de un bálsamo tópico a partir de principios fitoquímicos y referentes de la medicina tradicional.",
    "autor": "Agudelo Gil Emilia",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias",
    "Linea de investigación": "Biología\nQuímica farmaceutica\nMedicina Ancestral",
    "tipo": "Investigación",
    "palabras_clave": "Medicina ancestral, química farmacéutica, bálsamo medicinal, fitoquímica, formulación tópica, farmacofobia, farmacognosia.",
    "resumen": "El presente proyecto analiza la relación entre la medicina ancestral y la química moderna con el propósito de comprender cómo los conocimientos tradicionales pueden transformarse en formulaciones tópicas seguras, estandarizadas y reproducibles. La investigación parte de la necesidad de recuperar y estudiar prácticas medicinales originadas en diversas culturas, incluidas la china, la india, la japonesa y las comunidades indígenas de Colombia, evaluándolas mediante criterios contemporáneos de fitoquímica, farmacotecnia y evidencia científica. Para ello se llevó a cabo una revisión bibliográfica de los metabolitos presentes en plantas medicinales y una comparación entre métodos de extracción tradicionales y modernos. Estos fundamentos permitieron desarrollar dos formulaciones tópicas elaboradas en laboratorio: una pomada con acción antiinflamatoria y analgésica y un  4 bálsamo con propiedades antimicrobianas y cicatrizantes. Los resultados demuestran que la integración entre saber ancestral y metodología científica actual es posible y constituye una vía sólida para la creación de productos naturales con fundamento químico claro, eficacia potencial y pertinencia cultural. ",
    "Asesor(es)": "Diego Nicolás Mancera",
    "drive_file_id": "1-sAS_v9EuXw-ZInmzolNLxJsSQTvyFjm",
    "url_documento": "https://drive.google.com/file/d/1-sAS_v9EuXw-ZInmzolNLxJsSQTvyFjm/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2530",
    "titulo": "Transformar el dolor en magia: la escritura terapéutica como mecanismo de autoexploración .",
    "autor": "Camacho Tobón Mariana",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Psicología",
    "Linea de investigación": "Procesos psicosociales y comunitarios",
    "tipo": "Investigación",
    "palabras_clave": "Escritura terapéutica, autoexploración, sanación, salud mental, diario personal",
    "resumen": "En este proyecto se explora la escritura terapéutica como herramienta de autoexploración, sanación y salud mental. El proyecto nació de una vivencia propia: al escribir un diario personal durante un año, descubrí en las palabras un refugio para resignificar vivencias dolorosas. Mediante un enfoque cualitativo, se analizó el diario personal, se completaron ejercicios guiados de Rupi Kaur y se entrevistó a una psicóloga clínica. Así se demostró cómo la escritura transforma un diálogo interno autocrítico en una narrativa autocompasiva. Como producto final, se diseñó una guía práctica para que otros jóvenes encuentren en la escritura un camino hacia el bienestar.",
    "Asesor(es)": "Camilo Almario Zea",
    "drive_file_id": "1TSZz1EJiLcEgE76f1FAXO49vFnkCx1bY",
    "url_documento": "https://drive.google.com/file/d/1TSZz1EJiLcEgE76f1FAXO49vFnkCx1bY/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2945",
    "titulo": "Más allá del destino, el viaje como forma de vida",
    "autor": "Chica Navarro Mateo",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias sociales",
    "Linea de investigación": "Sociología y Antropología del Turismo\nTurismo Experiencial y Cultural",
    "tipo": "Investigación",
    "palabras_clave": "Vulnerabilidad ante lo\ndiferente, construcción\ndel individuo,\nexperiencias culturales,\ntransformación personal,\ncultura nómada de viaje,\nética del viajero,\nespontaneidad, viajero con\npropósito.",
    "resumen": "Este proyecto explora el viaje mochilero como una experiencia filosófica, humana y transformadora. A través del pensamiento de distintos autores y de una reflexión personal sobre la vulnerabilidad, el encuentro con el otro y la pérdida de control, el viaje se plantea como una forma de conocimiento vivido. El trabajo sirve como base conceptual para un viaje de seis meses, entendido no como turismo, sino como una práctica consciente de aprendizaje y construcción de identidad.",
    "Asesor(es)": "Mauricio Lora Aguirre",
    "drive_file_id": "1MudszokHbl8UNISNDmq5TIhEbqAxZ89s",
    "url_documento": "https://drive.google.com/file/d/1MudszokHbl8UNISNDmq5TIhEbqAxZ89s/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2542",
    "titulo": "Estudio del efecto de la acidificación del mar en estructuras coralinas",
    "autor": "Correa González Juan Andrés",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias",
    "Linea de investigación": "Biología marina",
    "tipo": "Investigación",
    "palabras_clave": "Acidificación del océano, emisiones de carbono, arrecifes de coral, diseño experimental",
    "resumen": "En este proyecto de vida se decidió trabajar, investigar y profundizar un tema importante, la acidificación marina, una problemática que ha sido ignorada o que no se le ha prestado la atención suficiente. Los objetivos de este proyecto son informar sobre el problema que significa la acidificación marina, presentando las causas, consecuencias y soluciones. A modo de representación experimental se realiza un ensayo en el cual se sumergirá corales decesados para estudiar los efectos que tiene la disminución del pH con el paso del tiempo en sus estructuras. De esta manera se podrá ver de forma más clara los efectos de la acidificación del agua en el océano.  ",
    "Asesor(es)": "Diego Nicolás Mancera",
    "drive_file_id": "1BW1qmzifJSZpCwfjuR62VTimD00iR9cZ",
    "url_documento": "https://drive.google.com/file/d/1BW1qmzifJSZpCwfjuR62VTimD00iR9cZ/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "1382",
    "titulo": "La importancia del desarrollo de la música y su documentación a través del tiempo",
    "autor": "Díaz García Isabela",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Música",
    "Linea de investigación": "Documentación, Memoria e Identidad Cultural Musical",
    "tipo": "Investigación",
    "palabras_clave": "Documentación músical, expresión musical, identidad, cultura, artistas musicales. ",
    "resumen": "Las diferentes maneras en que la música se ha documentado a través de los años y cómo se ha producido, en comparación con el día de hoy, con las nuevas plataformas digitales, informando sobre la apreciación musical y sus orígenes. ",
    "Asesor(es)": "Mauricio Lora Aguirre",
    "drive_file_id": "10D55V8QzEOs-8pY8mXvbAgLfD8xCrZDb",
    "url_documento": "https://drive.google.com/file/d/10D55V8QzEOs-8pY8mXvbAgLfD8xCrZDb/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2146",
    "titulo": "Huellas que hablan, sin decir nada",
    "autor": "Donado Abella Salomé",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Psicología",
    "Linea de investigación": "Evaluación del apoyo emocional canino.\nBienestar Social e Integración Comunitaria",
    "tipo": "Investigación",
    "palabras_clave": "Perros, apoyo emocional, entrenamiento, ayuda, mascotas, bienestar emocional, bienestar personal, bienestar social, salud mental. ",
    "resumen": "Este proyecto tiene como objetivo entender cómo la presencia de los perros influye en el bienestar emocional y social de las personas.  A través de encuestas pre y post de una actividad con perros que incluía hacer manualidades y juguetes para ellos, se evidenció que los perros generan emociones positivas, el estado de ánimo de las personas cambió, pudieron conectar con ellos y un ambiente más tranquilo y cercano, confirmando así, que su compañía tiene un impacto real en el bienestar humano. Este texto permite comprender mejor el vínculo humano–animal, valorar más su papel en la sociedad y reconocer que los perros pueden ser una herramienta importante para la salud mental y la construcción de espacios más humanos y afectivos. ",
    "Asesor(es)": "Valentina Sarria Suárez",
    "drive_file_id": "1B92m9MI13kP7I8fZGLiCW63HThpk9l5U",
    "url_documento": "https://drive.google.com/file/d/1B92m9MI13kP7I8fZGLiCW63HThpk9l5U/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2020",
    "titulo": "Manos de ayuda: servicio social y ayuda humanitaria",
    "autor": "Duplat Rebolledo Camila",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Trabajo social",
    "Linea de investigación": "Trabajo comunitario\nServicio social",
    "tipo": "Investigación",
    "palabras_clave": "Ayuda humanitaria, servicio social, ONG, MSF, recursos médicos, violencia, conflicto armado, sensibilización, crisis humanitaria. ",
    "resumen": "El punto de partida de este proyecto es la importancia del servicio social y la labor de ayuda humanitaria como herramienta para transformar la comunidad y el entorno. Este proyecto explora la conexión de este campo con la medicina, para promover la participación de los adolescentes en la reflexión sobre el servicio social en sus proyectos de vida u orientación profesional, comenzando por los estudiantes de taller 3 en el colegio Ekirayá Montessori. ",
    "Asesor(es)": "Camilo Almario Zea",
    "drive_file_id": "1ohhh6GDl7m_srv-B9cOoYR2CPgAYXeYt",
    "url_documento": "https://drive.google.com/open?id=1ohhh6GDl7m_srv-B9cOoYR2CPgAYXeYt&authuser=0",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "112",
    "titulo": "El impacto de la música a nivel biológico y psicológico",
    "autor": "Durán Sterling Santiago",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Música",
    "Linea de investigación": "Neurociencia de la Música\nPsicofisiología de la Emoción Musical y Sincronización ",
    "tipo": "Investigación",
    "palabras_clave": "Música, neurociencia, frecuencia cardíaca, procesamiento auditivo, emoción, BPM, método Tomatis. ",
    "resumen": "Esta investigación analiza cómo la música influye en el ser humano a nivel biológico y psicológico. A través de un diseño experimental basado en distintos géneros musicales y un análisis complementario mediante el método Tomatis, se evaluaron cambios fisiológicos (frecuencia cardíaca), respuestas emocionales y percepciones subjetivas en condiciones de quietud. Los resultados evidencian que la música actúa como un regulador neurofisiológico complejo, cuya influencia depende del contexto, la familiaridad, la estructura musical y la experiencia individual, más que del beat por minuto (BPM) o género por sí solos. ",
    "Asesor(es)": "Diego Nicolás Mancera",
    "drive_file_id": "1AnkgM-BbBAwfNux5-UtwB9LW56LYmsEg",
    "url_documento": "https://drive.google.com/file/d/1AnkgM-BbBAwfNux5-UtwB9LW56LYmsEg/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "130",
    "titulo": "Relevancia de la psicología en la cirugía pediátrica",
    "autor": "Figueredo Zapata Lucas",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias de la salud",
    "Linea de investigación": "Psicología\nPediatría",
    "tipo": "Investigación",
    "palabras_clave": "Acompañamiento emocional, cirugía pediátrica, ansiedad prequirúrgica, recuperación infantil, apoyo familiar, intervención hospitalaria, bienestar emocional. ",
    "resumen": " Esta monografía analiza la relevancia que tiene el acompañamiento emocional en los pacientes pediátricos menores de 10 años los cuales han sido sometidos a cirugías mayores, este proceso implica tanto con desafíos físicos como impactos significativos emocionales y psicológicos. A través de una investigación de naturaleza cualitativa la cual se basó en entrevistas guiadas a profesionales en salud infantil, en las que se encuentran los principales miedos de los niños, las estrategias más efectivas y las necesidades que persisten en los centros médicos. En los resultados se revela que la incertidumbre, el no conocer del proceso quirúrgico, la ansiedad de separación y el miedo al dolor son algunos de los factores que más afectan a los niños. De esta misma manera, los médicos insisten en tener una comunicación honesta, contar con preparación y presencia constante de la familia ayudan a tener una recuperación integral. Con estos hallazgos se propone ejecutar el diseño de un programa de acompañamiento emocional antes, durante y después de la cirugía, de esta manera se logra mejorar la experiencia hospitalaria que los pacientes tengan, reducir la ansiedad, evitar secuelas psicológicas y promover el bienestar emocional de pacientes. ",
    "Asesor(es)": "Giovanna Rebolledo",
    "drive_file_id": "1EcMmLdKhk2FVBLhRmAYv6PSbg2yfE0lq",
    "url_documento": "https://drive.google.com/file/d/1EcMmLdKhk2FVBLhRmAYv6PSbg2yfE0lq/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "124",
    "titulo": "Percepción del riesgo de la población ante el medio aeronáutico. ",
    "autor": "González Pérez Lorenzo",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Aviación",
    "Linea de investigación": "Psicología social\nSeguridad operacional",
    "tipo": "Investigación",
    "palabras_clave": "Seguridad aérea, percepción del riesgo, miedo a volar, accidentes aéreos, divulgación aeronáutica, aviación comercial. ",
    "resumen": "El texto analiza la percepción del riesgo que tiene la población frente a la aviación comercial, a pesar de que esta se reconoce estadísticamente como el medio de transporte más seguro. A través del documento se evidencia que el miedo a volar no surge de una inseguridad real del sistema aeronáutico, sino del desconocimiento sobre su funcionamiento y de la interpretación errónea de experiencias normales del vuelo. Como complemento a este análisis, se aplicó una encuesta a personas con experiencia previa en vuelos comerciales, cuyos resultados confirmaron la existencia de una brecha entre la seguridad objetiva de la aviación y la percepción subjetiva del riesgo. Los datos muestran que fenómenos como la turbulencia, los ruidos, los cambios en la potencia de los motores y los procedimientos técnicos generan ansiedad cuando no se comprenden adecuadamente.  A partir de estos hallazgos, el proyecto plantea la divulgación de información aeronáutica accesible y sencilla como una herramienta clave para reducir el miedo a volar, mas no eliminarlo, y  a su vez mejorar la experiencia del pasajero. Como producto final, se propone la elaboración de un video educativo que explique, de manera comprensible, el funcionamiento de la aviación, las lecciones aprendidas de accidentes históricos y las razones por las cuales volar es un medio de transporte altamente seguro. ",
    "Asesor(es)": "Luis Fernando Huertas",
    "drive_file_id": "1FQR1a2IDTvrGWo-BfyCfCMScjsQo98I9",
    "url_documento": "https://drive.google.com/file/d/1FQR1a2IDTvrGWo-BfyCfCMScjsQo98I9/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "137",
    "titulo": "Salud operacional del piloto en la aviación comercial: Riesgos, evidencia y prevención",
    "autor": "Jáuregui Cubillos Samuel",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Aviación",
    "Linea de investigación": "Salud ocupacional",
    "tipo": "Investigación",
    "palabras_clave": "Riesgo, factor, organizacional, ocupacional, agentes físicos, cardiovascular, fatiga, sueño, obesidad, prevención, aerolínea, piloto. ",
    "resumen": "Los pilotos comerciales de aerolínea, y en general, se ven constantemente expuestos a numerosos riesgos de origen organizacional y ocupacional que afectan a largo plazo su salud en diferentes ámbitos. Vista la problemática y la escasez de medidas preventivas en las aerolíneas, se propone el desarrollo de estrategias de prevención, a partir del estudio y del análisis documental seleccionado y filtrado en bases de datos, para su divulgación en las aerolíneas y en los lugares de trabajo de los pilotos, a través de una página web de libre consulta. ",
    "Asesor(es)": "Yenifer Hernández León",
    "drive_file_id": "1ZE-2OtGfg237u_ujrQUYd510DlKTCMUw",
    "url_documento": "https://drive.google.com/file/d/1ZE-2OtGfg237u_ujrQUYd510DlKTCMUw/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2143",
    "titulo": "Kairós y Terpsícore: Presencia, oportunidad y danza ",
    "autor": "Maldonado Delgado Alejandra",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Artes",
    "Linea de investigación": "Psicología social\nProyección corporal",
    "tipo": "Investigación",
    "palabras_clave": "Presencia, danza, emoción, cuerpo, proceso personal. ",
    "resumen": "Este trabajo va a documentar la relación entre el movimiento y el estado de presencia utilizando la danza como medio para esto. Para esto realicé una investigación personal por medio de la introspección. El registro se llevó  a cabo en un diario de un periodo de aproximadamente un año.  A partir de este proceso se propuso la pregunta ¿De qué forma la danza sirve como vehículo de presencia en periodos de desconexión? Esta pregunta me permite llevar el trabajo a una lectura más teórica de diversas técnicas corporales (mindfulness, grounding, movimiento auténtico) que permiten la presencia completando mi experiencia personal y, de esta manera, mostrar un proceso de reflexión corporal y teórica sobre la presencia y sus implicaciones en mi ser. ",
    "Asesor(es)": "Juliana León",
    "drive_file_id": "1uLASXrX9CluEYsQ1uMSYOV8aD4cE4da4",
    "url_documento": "https://drive.google.com/open?id=1uLASXrX9CluEYsQ1uMSYOV8aD4cE4da4&authuser=0",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "866",
    "titulo": "Bogotá: La ciudad que acoge a todos/as y acepta a pocos/as. Una mirada histórica a la configuración urbana y social de Bogotá.",
    "autor": "Mejía De Valdenebro Úrsula",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Arquitectura",
    "Linea de investigación": "Vivienda Social y Hábitat\nPatrimonio y Conservación",
    "tipo": "Investigación",
    "palabras_clave": "Urbanización, segregación espacial, configuración urbana,\néxodo rural, desarrollo, densificación, expansión.",
    "resumen": "Este texto trata el desarrollo socio-urbano de la ciudad de Bogotá entre finales del siglo XIX y comienzos del siglo XXI y explora sus dinámicas internas de segregación espacial, densificación y expansión urbana. Finalmente analiza las condiciones socioeconómicas de la población actual de la ciudad.",
    "Asesor(es)": "Pablo Forero",
    "drive_file_id": "1dnpVKT2JL3todi4TZl4JwHdc7qBci-iI",
    "url_documento": "https://drive.google.com/file/d/1dnpVKT2JL3todi4TZl4JwHdc7qBci-iI/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "121",
    "titulo": "Optimización de la forma del raspado de datos y su influencia en la comercialización de información",
    "autor": "Perdigón Mejía Jacobo",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ingenieria de sistemas\nCiencias Económicas y Administrativas ",
    "Linea de investigación": "Inteligencia de Mercados Basada en Datos (Big Data & Web Scraping)\n",
    "tipo": "Investigación",
    "palabras_clave": "Raspado de Datos, Web Scraping, comercialización, neuromarketing, IoT, consumidor, Pyme. ",
    "resumen": "La adquisición y eventual comercialización de datos, debido a su creciente relevancia en los mercados internacionales, representa un área de posible lucro. A partir de dicha premisa, se realiza un seguimiento a dicho concepto, historia y estado actual, con el objetivo de producir una propuesta o producto fundamentado en el neuromarketing. Las herramientas mencionadas anteriormente son producto del surgimiento de múltiples elementos tecnológicos en el siglo XX, en adición a la globalización.  ",
    "Asesor(es)": "John Alexander Aponte Peña\nJorge Mario Bernal",
    "drive_file_id": "1qgj3Pl5c-As641A4iX0GE06tp07F4LXG",
    "url_documento": "https://drive.google.com/file/d/1qgj3Pl5c-As641A4iX0GE06tp07F4LXG/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "122",
    "titulo": "Conversaciones de pasillo y representaciones sociales",
    "autor": "Roldán Acosta Valentina",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias sociales",
    "Linea de investigación": "Sociología\nIdentidad, Cultura y Política",
    "tipo": "Investigación",
    "palabras_clave": "Interseccionalidad, dominación social, Representaciones sociales, Violencia simbólica, Convivencia escolar, Imaginarios, Cotidianidad.",
    "resumen": "A partir de mi propia cotidianidad en el colegio Ekiraya Montessori, busco analizar cómo las interacciones, conversaciones de pasillo y el lenguaje cotidiano reproducen de forma inadvertida estructuras de dominación vinculadas al género, la raza, la clase y la sexualidad. Apoyándome en la sociología, la etnografía y el método Montessori, exploro categorías como el dolor, el cuerpo y las relaciones para demostrar cómo se naturalizan imaginarios que afectan la convivencia. Este trabajo pretende despertar una conciencia crítica en los estudiantes sobre su papel activo en el entorno, permitiendo cuestionar y resignificar las dinámicas sociales escolares.",
    "Asesor(es)": "Camilo Almario Zea",
    "drive_file_id": "1HTvrDJd7W7YTN8P1wW9j3NunxiaetFuY",
    "url_documento": "https://drive.google.com/file/d/1HTvrDJd7W7YTN8P1wW9j3NunxiaetFuY/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "2570",
    "titulo": "Saudade: Fragmentos de luz",
    "autor": "Ruiz Bohórquez Mariana",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Psicología",
    "Linea de investigación": "Psicología social",
    "tipo": "Investigación",
    "palabras_clave": "Nostalgia, memoria, emoción, arte, experiencia estética.  ",
    "resumen": "Este proyecto explora la nostalgia como una emoción humana difusa que no puede estudiarse de forma directa, pero sí a través de sus manifestaciones en el arte y la cultura. A partir de un marco teórico que integra psicología de las emociones, estética y neuroestética, se analiza cómo la literatura, el cine, la música y los objetos activan experiencias nostálgicas compartidas. Como producto final, se desarrollan tres dispositivos: un cortometraje autobiográfico construido desde la memoria fragmentada, un museo de nostalgias basado en objetos personales y un archivo fotográfico con adultos mayores. En conjunto, el proyecto demuestra que la nostalgia trasciende lo individual y se configura como una experiencia sensible, colectiva y profundamente humana. ",
    "Asesor(es)": "Pablo Forero",
    "drive_file_id": "1iCkyovctrnpXlWBiRkDgHsUqrM36DN9D",
    "url_documento": "https://drive.google.com/file/d/1iCkyovctrnpXlWBiRkDgHsUqrM36DN9D/view?usp=drive_open",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "133",
    "titulo": "El viento nos llevará",
    "autor": "Torres Prada Catalina",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Música",
    "Linea de investigación": "Investigación-Creación",
    "tipo": "Investigación",
    "palabras_clave": "Adolescencia, emociones, regulación emocional, psicología del color, música y emociones, rueda de las emociones de Plutchik, collage",
    "resumen": "El proyecto de vida “El viento nos llevará” aborda la problemática de la regulación emocional en adolescentes, quienes se enfrentan a situaciones emocionales como la ansiedad, la tristeza y la dificultad para identificar, expresar y regular emociones incómodas. El objetivo del proyecto es diseñar y desarrollar una propuesta artística y pedagógica compuesta por una serie de collages visuales y una canción original, orientada a favorecer el reconocimiento, la expresión y la regulación emocional en adolescentes. La propuesta utiliza el lenguaje visual del collage, el color y la música como recursos simbólicos y sensoriales que permiten representar emociones, generar identificación y propiciar estados de calma. El marco teórico se fundamenta en investigaciones sobre emociones, regulación emocional, música y color, apoyándose en autores como Robert Plutchik, Ileana Mosquera y Julio Santiago, quienes aportan modelos teóricos para la comprensión emocional y la experiencia estética. Finalmente, el proyecto busca resignificar la percepción social de las emociones, proponiendo que estas no son positivas ni negativas, sino experiencias humanas necesarias, y que su reconocimiento y regulación consciente contribuyen al bienestar emocional y adolescencia. ",
    "Asesor(es)": "Cristina Crane",
    "drive_file_id": "1e68y-660FLGwZkDiCqgy4uDcRYPbSuPO",
    "url_documento": "https://drive.google.com/file/d/1e68y-660FLGwZkDiCqgy4uDcRYPbSuPO/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "126",
    "titulo": "La influencia del “viaje mochilero” en la adolescencia",
    "autor": "Tubi Medders Luka",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias sociales",
    "Linea de investigación": "Sociología y Antropología del Turismo\nTurismo Experiencial y Cultural",
    "tipo": "Investigación",
    "palabras_clave": "Viaje, viaje Mochilero, educación, habilidades blandas, identidad, experiencias.  ",
    "resumen": "El presente proyecto de vida analiza el viaje mochilero desde una experiencia formativa y educativa clave durante la etapa de la adolescencia y su impacto en el desarrollo personal y construcción de identidad. A partir de un marco teórico basado en la pedagogía Montessori y en las teorías de Erik Erikson y Susan Whitbourne, se explora cómo viajar favorece el desarrollo de habilidades blandas esenciales para la vida adulta. Por otro lado, se analizan los resultados de una encuesta aplicada a adolescentes que han viajado, evidenciando que estas experiencias fortalecen la madurez, la responsabilidad y la comprensión del mundo. Finalmente, el autor propone la realización de un viaje mochilero de seis meses al salir del colegio como una oportunidad de autodescubrimiento, aprendizaje y preparación para la vida adulta. ",
    "Asesor(es)": "Ricardo Umaña",
    "drive_file_id": "1CNNHLQp-Xr0ePHA9G_2k2r1_GmllpFNB",
    "url_documento": "https://drive.google.com/file/d/1CNNHLQp-Xr0ePHA9G_2k2r1_GmllpFNB/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "139",
    "titulo": "Aplicación de recursos audiovisuales e IA para la enseñanza de la teoría de la relatividad",
    "autor": "Vásquez Velásquez Nicolás",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias",
    "Linea de investigación": "Física",
    "tipo": "Investigación",
    "palabras_clave": "Relatividad, aprendizaje, modelos/simulaciones, pedagogía digital, comprensión conceptual, física moderna.",
    "resumen": "El documento presenta una propuesta para mejorar la comprensión de la teoría de la relatividad en estudiantes de bachillerato, a partir del análisis de su percepción inicial y del uso de recursos pedagógicos digitales. El proyecto se fundamenta en un diagnóstico preliminar que evidencia la presencia de preconceptos relacionados con nociones fundamentales como la curvatura del espacio-tiempo, la dilatación temporal y las diferencias entre los modelos de Newton y Einstein.  Para abordar estas dificultades, se diseñó un recurso audiovisual explicativo apoyado en visualizaciones intuitivas, una narración accesible y simulaciones elaboradas con herramientas de inteligencia artificial. La verificación del aprendizaje entre el formulario diagnóstico inicial y el formulario aplicado posteriormente a la visualización del video permitió identificar una mejora significativa en la comprensión conceptual de los estudiantes, especialmente en el reconocimiento de los principios esenciales de la relatividad y su relación con aplicaciones tecnológicas actuales, como el sistema GPS.  En conclusión, los resultados indican que el uso de recursos audiovisuales e interactivos favorece el aprendizaje significativo de contenidos científicos complejos, contribuye a la superación de preconceptos y fortalece el interés de los estudiantes por la física moderna, evidenciando el valor pedagógico de integrar herramientas tecnológicas innovadoras en el proceso de enseñanza-aprendizaje ",
    "Asesor(es)": "Luis Fernando Huertas",
    "drive_file_id": "1d8038-ybnzOpXspT4ZorOp6L6obrikmL",
    "url_documento": "https://drive.google.com/file/d/1d8038-ybnzOpXspT4ZorOp6L6obrikmL/view?usp=drive_open",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "140",
    "titulo": "¿Cómo escalar una marca digital desde cero?",
    "autor": "Vidal Herrera Violeta",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Administración",
    "Linea de investigación": "Finanzas\nMarketing e inteligencia de negocios",
    "tipo": "Investigación",
    "palabras_clave": "Branding, E-commerce, dropshipping, escalabilidad, sistema, estrategia , conversión, oferta,  avatar, consumidor, cliente, experiencia, identidad, marca, diferenciación",
    "resumen": "Este proyecto analiza el proceso de creación y escalamiento de marcas de e-commerce, partiendo del problema de la saturación creciente de los mercados digitales. En la actualidad, existen millones de marcas genéricas que se enfocan únicamente en la venta de productos, sin una estructura estratégica ni una identidad clara, lo que incrementa la desconfianza del consumidor y dificulta la diferenciación y el crecimiento sostenible. A través del análisis de etapas clave como la investigación de mercado, la definición del avatar, la construcción de la oferta, el branding y los sistemas de adquisición, se busca comprender cómo estos elementos se integran para crear marcas sólidas y coherentes. Como resultado, se desarrolla un sistema organizado en Notion que funciona como una guía paso a paso para planear, ejecutar y escalar una marca digital de manera estratégica, reduciendo la improvisación y facilitando la toma de decisiones. ",
    "Asesor(es)": "Maria Paula Ramos",
    "drive_file_id": "1j4Of2VNYyCyUdCksYQDQiw7lD5OzjkjP",
    "url_documento": "https://drive.google.com/file/d/1j4Of2VNYyCyUdCksYQDQiw7lD5OzjkjP/view",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  },
  {
    "documento_id": "141",
    "titulo": "Monografía de Investigación y Proyecto de Vida (Línea 22)",
    "autor": "Estudiante Promoción 2026",
    "grado": "11",
    "año": "2026",
    "Unidad Académica": "Ciencias",
    "Linea de investigación": "Innovación y Sostenibilidad",
    "tipo": "Investigación",
    "palabras_clave": "Investigación, sostenibilidad, metodología, proyecto de vida, innovación académica.",
    "resumen": "Documento de monografía registrado en la línea 22 de la hoja Repositorio de Google Sheets del Colegio Ekirayá - Educación Montessori. Integra el marco conceptual, objetivos de indagación y resultados metodológicos del proyecto de vida del estudiante.",
    "Asesor(es)": "Esteban Bolaños R",
    "drive_file_id": "1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii",
    "url_documento": "https://drive.google.com/drive/folders/1U0BfnGyQXzxuKaa95nqGx8iqbdG-eCii",
    "visibilidad": "Digital",
    "estado": "Finalizado",
    "fecha_registro": "23 enero 2026",
    "fecha_actualizacion": "10-04-2026"
  }
];

export const DEFAULT_USUARIOS_HEADERS: string[] = [
  'Nombres',
  'Curso',
  'Correo',
  'Sección',
  'Perfil',
];

function makeUser(
  nombres: string,
  curso: string,
  correo: string,
  seccion: string,
  perfil: 'Administrador' | 'Docente' | 'Estudiante' | 'Personal no clases'
): AuthorizedSchoolUser {
  const cleanEmail = correo.trim().toLowerCase();
  const isAdmin = perfil === 'Administrador' || cleanEmail === 'mebolanos@cem.edu.co';
  return {
    nombres,
    curso,
    correo: cleanEmail,
    seccion,
    perfil,
    isAdmin,
    createdInApp: false,
    syncedToSheet: true,
    rawRow: {
      Nombres: nombres,
      Curso: curso,
      Correo: cleanEmail,
      Sección: seccion,
      Perfil: perfil,
    },
  };
}

/**
 * Hoja "usuarios" completa generada a partir de la base de datos institucional del Colegio Ekirayá:
 * - Administradores
 * - Docentes / Asesores de Monografía
 * - Estudiantes de Grado 11° (Autores de Proyecto de Vida 2026)
 * - Personal de no clases
 */
export const DEFAULT_AUTHORIZED_USERS: AuthorizedSchoolUser[] = [
  // Administrador principal institucional (se actualiza automáticamente desde la hoja "usuarios")
  makeUser(
    'Esteban Bolaños R',
    'Docente',
    'mebolanos@cem.edu.co',
    'Academia',
    'Administrador'
  ),

  // Docentes / Asesores de la BD de Monografías
  makeUser('Diego Nicolás Mancera', 'Docente', 'dmancera@cem.edu.co', 'Ciencias', 'Docente'),
  makeUser(
    'Camilo Almario Zea',
    'Docente',
    'calmario@cem.edu.co',
    'Psicología y Ciencias Sociales',
    'Docente'
  ),
  makeUser(
    'Mauricio Lora Aguirre',
    'Docente',
    'mlora@cem.edu.co',
    'Ciencias Sociales y Música',
    'Docente'
  ),
  makeUser('Valentina Sarria Suárez', 'Docente', 'vsarria@cem.edu.co', 'Psicología', 'Docente'),
  makeUser(
    'Giovanna Rebolledo',
    'Docente',
    'grebolledo@cem.edu.co',
    'Ciencias de la Salud',
    'Docente'
  ),
  makeUser(
    'Luis Fernando Huertas',
    'Docente',
    'lhuertas@cem.edu.co',
    'Ciencias y Aviación',
    'Docente'
  ),
  makeUser(
    'Yenifer Hernández León',
    'Docente',
    'yhernandez@cem.edu.co',
    'Salud Ocupacional',
    'Docente'
  ),
  makeUser('Juliana León', 'Docente', 'jleon@cem.edu.co', 'Artes', 'Docente'),
  makeUser('Pablo Forero', 'Docente', 'pforero@cem.edu.co', 'Arquitectura y Psicología', 'Docente'),
  makeUser(
    'John Alexander Aponte Peña',
    'Docente',
    'japonte@cem.edu.co',
    'Ingeniería de Sistemas',
    'Docente'
  ),
  makeUser(
    'Jorge Mario Bernal',
    'Docente',
    'jbernal@cem.edu.co',
    'Ciencias Económicas y Administrativas',
    'Docente'
  ),
  makeUser('Cristina Crane', 'Docente', 'ccrane@cem.edu.co', 'Música', 'Docente'),
  makeUser('Ricardo Umaña', 'Docente', 'rumana@cem.edu.co', 'Ciencias Sociales', 'Docente'),
  makeUser('Maria Paula Ramos', 'Docente', 'mpramos@cem.edu.co', 'Administración', 'Docente'),

  // Estudiantes Autores (Grado 11° - Promoción 2026)
  makeUser('Agudelo Gil Emilia', '11', 'eagudelo@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Camacho Tobón Mariana', '11', 'mcamacho@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Chica Navarro Mateo', '11', 'mchica@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser(
    'Correa González Juan Andrés',
    '11',
    'jcorrea@cem.edu.co',
    'Bachillerato',
    'Estudiante'
  ),
  makeUser('Díaz García Isabela', '11', 'idiaz@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Donado Abella Salomé', '11', 'sdonado@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Duplat Rebolledo Camila', '11', 'cduplat@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Durán Sterling Santiago', '11', 'sduran@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Figueredo Zapata Lucas', '11', 'lfigueredo@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('González Pérez Lorenzo', '11', 'lgonzalez@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Jáuregui Cubillos Samuel', '11', 'sjauregui@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser(
    'Maldonado Delgado Alejandra',
    '11',
    'amaldonado@cem.edu.co',
    'Bachillerato',
    'Estudiante'
  ),
  makeUser('Mejía De Valdenebro Úrsula', '11', 'umejia@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Perdigón Mejía Jacobo', '11', 'jperdigon@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Roldán Acosta Valentina', '11', 'vroldan@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Ruiz Bohórquez Mariana', '11', 'mruiz@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Torres Prada Catalina', '11', 'ctorres@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser('Tubi Medders Luka', '11', 'ltubi@cem.edu.co', 'Bachillerato', 'Estudiante'),
  makeUser(
    'Vásquez Velásquez Nicolás',
    '11',
    'nvasquez@cem.edu.co',
    'Bachillerato',
    'Estudiante'
  ),
  makeUser('Vidal Herrera Violeta', '11', 'vvidal@cem.edu.co', 'Bachillerato', 'Estudiante'),

  // Personal de No Clases
  makeUser(
    'Biblioteca y Centro de Recursos',
    'No clases',
    'biblioteca@cem.edu.co',
    'Biblioteca',
    'Personal no clases'
  ),
  makeUser(
    'Secretaría Académica Ekirayá',
    'No clases',
    'secretaria@cem.edu.co',
    'Administración',
    'Personal no clases'
  ),
];

