import {
  AuthorEntry,
  AuthorMode,
  CitationFormData,
  CitationStyle,
  GeneratedCitation,
  LocatorType,
  SourceType,
} from '../types/citation';

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  book: 'Libro (Con autor, editor, electrónico o traducido)',
  chapter: 'Capítulo de un Libro con Editor',
  article: 'Artículo Científico (Journal: Impreso, en línea o DOI)',
  newspaper: 'Periódico o Revista de Divulgación (Magazine)',
  report: 'Informe Gubernamental o Institucional',
  conference: 'Simposio, Conferencia o Congreso',
  thesis: 'Tesis o Trabajo de Grado (Repositorio o Base de Datos)',
  website: 'Página en la World Wide Web (WWW)',
  audiovisual: 'Material Audiovisual (Película, Serie, Video, Webinar, Podcast)',
  social_media: 'Publicación en Redes Sociales (X/Twitter, Facebook, Instagram)',
  legal: 'Referencia Legal (Sentencia, Ley o Tratado Internacional)',
  ai: 'Inteligencia Artificial (ChatGPT, Gemini, Claude)',
};

export const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: 'APA (7.ª edición · Estándar 2026)',
  mla9: 'MLA (9.ª edición)',
  chicago17: 'Chicago (17.ª edición)',
  icontec: 'Icontec (NTC 1486 / 5613)',
};

export const INITIAL_FORM_DATA: CitationFormData = {
  sourceType: 'book',
  style: 'apa7',
  isInstitutionalAuthor: false,
  authorMode: 'personal',
  institutionalName: '',
  institutionalAbbreviation: '',
  authors: [{ firstName: '', lastName: '' }],
  useSpanishAnd: true,
  title: '',
  chapterTitle: '',
  bookTitle: '',
  bookEditor: '',
  year: '',
  exactDate: '',
  originalYear: '',
  translator: '',
  edition: '',
  publisher: '',
  place: '',
  locatorType: 'page',
  pages: '',
  journalName: '',
  volume: '',
  issue: '',
  doi: '',
  accessDate: '',
  url: '',
  bookSubtype: 'authored',
  newspaperSubtype: 'newspaper_online',
  reportNumber: '',
  conferenceType: 'conferencia',
  conferenceName: '',
  thesisSubtype: 'online_archive',
  thesisLevel: 'Tesis de pregrado',
  databaseName: '',
  audiovisualSubtype: 'video',
  mediaRole: 'Director',
  socialSubtype: 'tweet',
  socialHandle: '',
  legalSubtype: 'sentence',
  legalCourtOrBody: '',
  legalJudgeOrSection: '',
  secondarySourceAuthorYear: '',
  isPersonalCommunication: false,
  aiCompany: '',
  aiModel: '',
  aiVersion: '',
  aiPromptDescription: '',
};

export const EXAMPLE_PRESETS: Record<SourceType, Partial<CitationFormData>> = {
  book: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    bookSubtype: 'authored',
    useSpanishAnd: true,
    authors: [
      { firstName: 'Luz Stella', lastName: 'Ramírez Osorio' },
      { firstName: 'Karen Shirley', lastName: 'López Gil' },
    ],
    title: 'Orientar la escritura a través del currículo en la universidad',
    year: '2018',
    edition: '',
    publisher: 'Sello Editorial Javeriano',
    place: 'Cali, Colombia',
    pages: '45',
    locatorType: 'page',
  },
  chapter: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    useSpanishAnd: true,
    authors: [
      { firstName: 'David', lastName: 'Barton' },
      { firstName: 'Mary', lastName: 'Hamilton' },
    ],
    chapterTitle: 'La literacidad entendida como práctica social',
    bookTitle: 'Escritura y sociedad. Nuevas perspectivas teóricas y etnográficas',
    bookEditor: 'V. Zavala, M. Niño-Murcia y P. Ames',
    year: '2004',
    publisher: 'Red para el desarrollo de las ciencias sociales en el Perú',
    pages: '109-139',
    locatorType: 'page',
  },
  article: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    useSpanishAnd: true,
    authors: [
      { firstName: 'Paula', lastName: 'Hoyos-Hernández' },
      { firstName: 'Juan', lastName: 'Sanabria' },
      { firstName: 'Linda', lastName: 'Orcasita' },
      { firstName: 'Andrés', lastName: 'Valenzuela' },
      { firstName: 'Marcela', lastName: 'González' },
      { firstName: 'Tatiana', lastName: 'Osorio' },
    ],
    title: 'Representaciones sociales asociadas al VIH/Sida en universitarios colombianos',
    journalName: 'Saúde e Sociedade',
    volume: '28',
    issue: '2',
    pages: '227-238',
    year: '2019',
    doi: '10.1590/s0104-12902019180586',
  },
  newspaper: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    newspaperSubtype: 'newspaper_print',
    useSpanishAnd: true,
    authors: [
      { firstName: 'Anabel', lastName: 'Díez' },
      { firstName: 'Camilo S.', lastName: 'Baquero' },
    ],
    title: 'La cúpula de ERC blinda con su apoyo la investidura de Sánchez',
    journalName: 'El País',
    year: '2020',
    exactDate: '2 de enero',
    pages: '4',
  },
  report: {
    authorMode: 'institutional',
    isInstitutionalAuthor: true,
    institutionalName: 'Ministerio de Salud y Protección Social',
    institutionalAbbreviation: 'Minsalud',
    title: 'Política de Atención Integral en Salud',
    year: '2016',
    reportNumber: '',
    url: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/modelo-pais-2016.pdf',
  },
  conference: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    authors: [{ firstName: 'María C.', lastName: 'Cuevas' }],
    title: 'Conexión moral en la intimidación escolar',
    conferenceType: 'conferencia',
    conferenceName:
      'IV Simposio Internacional sobre Acoso Escolar (bullying). Desafíos contemporáneos en torno a la convivencia en la escuela',
    place: 'Medellín, Colombia',
    year: '2019',
    exactDate: 'del 1 al 2 de octubre',
    url: 'https://sitios.ces.edu.co/simposiobullying/index.php',
  },
  thesis: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    thesisSubtype: 'online_archive',
    thesisLevel: 'Tesis de pregrado',
    authors: [{ firstName: 'Hernán', lastName: 'Muñoz-Sánchez' }],
    title:
      'Hacerse hombre. La construcción de masculinidades desde las subjetividades: un análisis a través de relatos de vida de hombres colombianos',
    year: '2018',
    publisher: 'Universidad Complutense de Madrid',
    url: 'https://eprints.ucm.es/28063/',
  },
  website: {
    authorMode: 'institutional',
    isInstitutionalAuthor: true,
    institutionalName: 'Organización Mundial de la Salud',
    institutionalAbbreviation: 'OMS',
    title: 'Malnutrición',
    journalName: '',
    year: '2017',
    exactDate: '1 de abril',
    url: 'https://www.who.int/es/news-room/fact-sheets/detail/malnutrition',
    locatorType: 'paragraph',
    pages: '4',
  },
  audiovisual: {
    authorMode: 'personal',
    isInstitutionalAuthor: false,
    audiovisualSubtype: 'film',
    mediaRole: 'Director',
    authors: [{ firstName: 'Oriol', lastName: 'Paulo' }],
    title: 'Durante la tormenta',
    year: '2018',
    publisher: 'Atresmedia Cine',
    url: 'https://www.netflix.com/co/title/80991158?source=35',
    locatorType: 'timestamp',
    pages: '25:36',
  },
  social_media: {
    authorMode: 'institutional',
    isInstitutionalAuthor: true,
    socialSubtype: 'instagram',
    institutionalName: 'Centro de Escritura Javeriano',
    socialHandle: '@centrodescritura',
    title: 'Cómo usar los tipos de coma',
    year: '2020',
    exactDate: '7 de mayo',
    url: 'https://www.instagram.com/p/B_6CFYnDM--/?utm_source=ig_web_copy_link',
  },
  legal: {
    legalSubtype: 'sentence',
    title: 'Sentencia T-006/20',
    year: '2020',
    exactDate: '17 de enero',
    legalCourtOrBody: 'Corte Constitucional',
    legalJudgeOrSection: 'Cristina Pardo, M.P.',
    url: 'https://www.corteconstitucional.gov.co/Relatoria/2020/T-006-20.htm',
  },
  ai: {
    aiCompany: 'OpenAI',
    aiModel: 'ChatGPT',
    aiVersion: 'GPT-4o',
    aiPromptDescription: 'Síntesis sobre mecanismos de citación y referencias en APA 7.ª edición',
    year: '2026',
    accessDate: '2026-09-29',
    url: 'https://chatgpt.com',
  },
};

export interface OfficialDocumentExample {
  id: string;
  page: string;
  categoryLabel: string;
  title: string;
  description: string;
  formData: Partial<CitationFormData>;
}

/**
 * Catálogo completo de ejemplos extraídos de las páginas 20 a 35 del
 * Manual Normas APA Séptima Edición (Centro de Escritura Javeriano).
 */
export const APA_DOCUMENT_EXAMPLES: OfficialDocumentExample[] = [
  {
    id: 'jav-libro-autor-es',
    page: 'Pág. 25',
    categoryLabel: '4.3.1 Libro con autor (Español)',
    title: 'Ramírez Osorio y López Gil (2018) — Sello Editorial Javeriano',
    description: 'Forma básica para citar libros en español uniendo dos autores con "y".',
    formData: {
      sourceType: 'book',
      style: 'apa7',
      bookSubtype: 'authored',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'Luz Stella', lastName: 'Ramírez Osorio' },
        { firstName: 'Karen Shirley', lastName: 'López Gil' },
      ],
      title: 'Orientar la escritura a través del currículo en la universidad',
      year: '2018',
      publisher: 'Sello Editorial Javeriano',
    },
  },
  {
    id: 'jav-libro-autor-doi',
    page: 'Pág. 25',
    categoryLabel: '4.3.1 Libro con autor y edición (Inglés / DOI)',
    title: 'Jackson (2019) — The psychology of prejudice (2nd ed.)',
    description: 'Libro con número de edición abreviado y enlace DOI.',
    formData: {
      sourceType: 'book',
      style: 'apa7',
      bookSubtype: 'authored',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'Linda M.', lastName: 'Jackson' }],
      title: 'The psychology of prejudice: From attitudes to social action',
      edition: '2nd ed.',
      year: '2019',
      publisher: 'American Psychological Association',
      doi: '10.1037/0000168-000',
    },
  },
  {
    id: 'jav-libro-editor',
    page: 'Pág. 25',
    categoryLabel: '4.3.1 Libro con editor (Ed.)',
    title: 'Molina Natera (Ed.) (2015) — Panorama de los centros de escritura',
    description: 'Libro coordinado por un editor con capítulos de distintos autores.',
    formData: {
      sourceType: 'book',
      style: 'apa7',
      bookSubtype: 'edited',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'Violeta', lastName: 'Molina Natera' }],
      title: 'Panorama de los centros y programas de escritura en Latinoamérica',
      year: '2015',
      publisher: 'Sello Editorial Javeriano',
      doi: '10.2307/j.ctvt6rnd6.27',
    },
  },
  {
    id: 'jav-libro-traduccion',
    page: 'Pág. 19 y 26',
    categoryLabel: '4.3.1 Libro con traducción y fecha original',
    title: 'Piaget & Inhelder (1966/1969) — Con traductor y año original',
    description: 'Incluye traductor (Trad.), edición y año de publicación original (1966/1969).',
    formData: {
      sourceType: 'book',
      style: 'apa7',
      bookSubtype: 'translated',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: false,
      authors: [
        { firstName: 'Jean', lastName: 'Piaget' },
        { firstName: 'Bärbel', lastName: 'Inhelder' },
      ],
      title: 'The psychology of the child',
      translator: 'H. Weaver',
      edition: '2.ª ed.',
      year: '1969',
      originalYear: '1966',
      publisher: 'Basic Books',
    },
  },
  {
    id: 'jav-capitulo-libro',
    page: 'Pág. 26',
    categoryLabel: '4.3.1 Capítulo de un libro',
    title: 'Barton y Hamilton (2004) — En V. Zavala et al. (Eds.)',
    description: 'Capítulo de un libro colectivo con editores y rango de páginas (pp. 109-139).',
    formData: {
      sourceType: 'chapter',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'David', lastName: 'Barton' },
        { firstName: 'Mary', lastName: 'Hamilton' },
      ],
      chapterTitle: 'La literacidad entendida como práctica social',
      bookEditor: 'V. Zavala, M. Niño-Murcia y P. Ames',
      bookTitle: 'Escritura y sociedad. Nuevas perspectivas teóricas y etnográficas',
      pages: '109-139',
      year: '2004',
      publisher: 'Red para el desarrollo de las ciencias sociales en el Perú',
    },
  },
  {
    id: 'jav-articulo-basico',
    page: 'Pág. 28',
    categoryLabel: '4.3.2 Artículo científico con volumen y número',
    title: 'Castro (2016) — Revista Colombiana de Sociología, 39(1)',
    description: 'Forma básica de artículo científico con revista y volumen en cursiva.',
    formData: {
      sourceType: 'article',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'B.', lastName: 'Castro' }],
      title:
        'Construcción y transformación de masculinidades de los corteros de caña de azúcar del Valle del Cauca',
      journalName: 'Revista Colombiana de Sociología',
      volume: '39',
      issue: '1',
      pages: '79-102',
      year: '2016',
    },
  },
  {
    id: 'jav-articulo-en-linea',
    page: 'Pág. 28',
    categoryLabel: '4.3.2 Artículo científico en línea (URL)',
    title: 'Caicedo-Tamayo y Rojas-Ospina (2014) — Educación y Educadores',
    description: 'Artículo científico en línea sin DOI que incluye la URL directa.',
    formData: {
      sourceType: 'article',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'A.', lastName: 'Caicedo-Tamayo' },
        { firstName: 'T.', lastName: 'Rojas-Ospina' },
      ],
      title: 'Creencias, conocimientos y uso de las TIC de los profesores universitarios',
      journalName: 'Educación y Educadores',
      volume: '17',
      issue: '3',
      pages: '517-533',
      year: '2014',
      url: 'https://educacionyeducadores.unisabana.edu.co/index.php/eye/article/view/4333/3810',
    },
  },
  {
    id: 'jav-articulo-doi-6autores',
    page: 'Pág. 28',
    categoryLabel: '4.3.2 Artículo con DOI y múltiples autores (et al.)',
    title: 'Hoyos-Hernández et al. (2019) — Saúde e Sociedade',
    description: '6 autores (en cita usa "Hoyos-Hernández et al." y en referencia enumera los 6).',
    formData: {
      sourceType: 'article',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'P.', lastName: 'Hoyos-Hernández' },
        { firstName: 'J.', lastName: 'Sanabria' },
        { firstName: 'L.', lastName: 'Orcasita' },
        { firstName: 'A.', lastName: 'Valenzuela' },
        { firstName: 'M.', lastName: 'González' },
        { firstName: 'T.', lastName: 'Osorio' },
      ],
      title: 'Representaciones sociales asociadas al VIH/Sida en universitarios colombianos',
      journalName: 'Saúde e Sociedade',
      volume: '28',
      issue: '2',
      pages: '227-238',
      year: '2019',
      doi: '10.1590/s0104-12902019180586',
    },
  },
  {
    id: 'jav-periodico-impreso',
    page: 'Pág. 29',
    categoryLabel: '4.3.3 Periódico impreso',
    title: 'Díez y Baquero (2020, 2 de enero) — El País, 4',
    description: 'Incluye fecha exacta (año, día de mes) y número de página sin abreviación.',
    formData: {
      sourceType: 'newspaper',
      style: 'apa7',
      newspaperSubtype: 'newspaper_print',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'A.', lastName: 'Díez' },
        { firstName: 'C. S.', lastName: 'Baquero' },
      ],
      title: 'La cúpula de ERC blinda con su apoyo la investidura de Sánchez',
      journalName: 'El País',
      year: '2020',
      exactDate: '2 de enero',
      pages: '4',
    },
  },
  {
    id: 'jav-periodico-online',
    page: 'Pág. 30',
    categoryLabel: '4.3.3 Periódico en línea',
    title: 'Varea (2019, 7 de junio) — El País (en línea)',
    description: 'Artículo de prensa digital con nombre del periódico en cursiva y URL.',
    formData: {
      sourceType: 'newspaper',
      style: 'apa7',
      newspaperSubtype: 'newspaper_online',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'R.', lastName: 'Varea' }],
      title: 'Pontificia Universidad Javeriana, la huella de Colombia en la región',
      journalName: 'El País',
      year: '2019',
      exactDate: '7 de junio',
      url: 'https://elpais.com/sociedad/2019/06/03/actualidad/1559522175_313057.html',
    },
  },
  {
    id: 'jav-informe-gubernamental',
    page: 'Pág. 30',
    categoryLabel: '4.3.4 Informe gubernamental',
    title: 'Ministerio de Salud y Protección Social (2016)',
    description: 'Informe oficial de entidad gubernamental con título en cursiva y URL.',
    formData: {
      sourceType: 'report',
      style: 'apa7',
      authorMode: 'institutional',
      isInstitutionalAuthor: true,
      institutionalName: 'Ministerio de Salud y Protección Social',
      title: 'Política de Atención Integral en Salud',
      year: '2016',
      url: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/modelo-pais-2016.pdf',
    },
  },
  {
    id: 'jav-simposio-conferencia',
    page: 'Pág. 31',
    categoryLabel: '4.3.5 Simposios, conferencias y congresos',
    title: 'Cuevas (2019, del 1 al 2 de octubre) — [conferencia]',
    description: 'Ponencia o conferencia con tipo de contribución entre corchetes y sede.',
    formData: {
      sourceType: 'conference',
      style: 'apa7',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'M. C.', lastName: 'Cuevas' }],
      title: 'Conexión moral en la intimidación escolar',
      conferenceType: 'conferencia',
      conferenceName:
        'IV Simposio Internacional sobre Acoso Escolar (bullying). Desafíos contemporáneos en torno a la convivencia en la escuela',
      place: 'Medellín, Colombia',
      year: '2019',
      exactDate: 'del 1 al 2 de octubre',
      url: 'https://sitios.ces.edu.co/simposiobullying/index.php',
    },
  },
  {
    id: 'jav-tesis-base-datos',
    page: 'Pág. 31',
    categoryLabel: '4.3.6 Tesis en base de datos en línea',
    title: 'Kogan Cogan (2014) — [Tesis de doctorado, PUCP]',
    description: 'Tesis alojada en base de datos comercial o institucional (Dissertations & Theses).',
    formData: {
      sourceType: 'thesis',
      style: 'apa7',
      thesisSubtype: 'database',
      thesisLevel: 'Tesis de doctorado',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'L.', lastName: 'Kogan Cogan' }],
      title: 'La insoportable proximidad de lo material: Cuerpos e identidades',
      year: '2014',
      publisher: 'Pontificia Universidad Católica del Perú',
      databaseName: 'Dissertations & Theses A&I',
      url: 'https://bdbib.javerianacali.edu.co:2519/docview/2398211090/',
    },
  },
  {
    id: 'jav-tesis-en-linea',
    page: 'Pág. 31',
    categoryLabel: '4.3.6 Tesis publicada en línea (Archivo digital)',
    title: 'Muñoz-Sánchez (2018) — [Tesis de pregrado, UCM]',
    description: 'Tesis en repositorio abierto con la indicación "Archivo digital".',
    formData: {
      sourceType: 'thesis',
      style: 'apa7',
      thesisSubtype: 'online_archive',
      thesisLevel: 'Tesis de pregrado',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'H.', lastName: 'Muñoz-Sánchez' }],
      title:
        'Hacerse hombre. La construcción de masculinidades desde las subjetividades: un análisis a través de relatos de vida de hombres colombianos',
      year: '2018',
      publisher: 'Universidad Complutense de Madrid',
      url: 'https://eprints.ucm.es/28063/',
    },
  },
  {
    id: 'jav-web-oms',
    page: 'Pág. 32',
    categoryLabel: '4.4.1 Página en la World Wide Web (con sigla)',
    title: 'Organización Mundial de la Salud [OMS] (2017, 1 de abril)',
    description: 'Página web institucional con sigla [OMS] y sin repetir el nombre del sitio.',
    formData: {
      sourceType: 'website',
      style: 'apa7',
      authorMode: 'institutional',
      isInstitutionalAuthor: true,
      institutionalName: 'Organización Mundial de la Salud',
      institutionalAbbreviation: 'OMS',
      title: 'Malnutrición',
      year: '2017',
      exactDate: '1 de abril',
      url: 'https://www.who.int/es/news-room/fact-sheets/detail/malnutrition',
    },
  },
  {
    id: 'jav-pelicula',
    page: 'Pág. 32',
    categoryLabel: '4.4.2 Película o cinta cinematográfica',
    title: 'Paulo (Director) (2018) — Durante la tormenta [Película]',
    description: 'Referencia de película indicando al director y la compañía productora.',
    formData: {
      sourceType: 'audiovisual',
      style: 'apa7',
      audiovisualSubtype: 'film',
      mediaRole: 'Director',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'O.', lastName: 'Paulo' }],
      title: 'Durante la tormenta',
      year: '2018',
      publisher: 'Atresmedia Cine',
      url: 'https://www.netflix.com/co/title/80991158?source=35',
    },
  },
  {
    id: 'jav-serie-tv',
    page: 'Pág. 32',
    categoryLabel: '4.4.3 Serie de televisión',
    title: 'Walley-Beckett (Productora) (2017-2020) — Anne with an E',
    description: 'Serie de televisión con rango de años de emisión y marca de tiempo en cita.',
    formData: {
      sourceType: 'audiovisual',
      style: 'apa7',
      audiovisualSubtype: 'tv_series',
      mediaRole: 'Productora',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'M.', lastName: 'Walley-Beckett' }],
      title: 'Anne with an E',
      year: '2017-2020',
      publisher: 'CBC',
      url: 'https://www.netflix.com/co/title/80136311',
      locatorType: 'timestamp',
      pages: '25:36',
    },
  },
  {
    id: 'jav-video-youtube',
    page: 'Pág. 33',
    categoryLabel: '4.4.4 Video en línea (YouTube)',
    title: 'Pontificia Universidad Javeriana Cali (2020, 26 de mayo) — [Video]',
    description: 'Video de plataforma digital con título en cursiva y etiqueta [Video].',
    formData: {
      sourceType: 'audiovisual',
      style: 'apa7',
      audiovisualSubtype: 'video',
      authorMode: 'institutional',
      isInstitutionalAuthor: true,
      institutionalName: 'Pontificia Universidad Javeriana Cali',
      title:
        '‘HENDER’ Vídeodanza del sentir, del ver y percibir el mundo con múltiples sentidos',
      year: '2020',
      exactDate: '26 de mayo',
      publisher: 'YouTube',
      url: 'https://www.youtube.com/watch?v=4t2av9Mn__U',
    },
  },
  {
    id: 'jav-seminario-web',
    page: 'Pág. 33',
    categoryLabel: '4.4.5 Seminario web grabado (Webinar)',
    title: 'Soto (2020) — La actividad física como fuente de bienestar [seminario Web]',
    description: 'Seminario web grabado y recuperable en línea.',
    formData: {
      sourceType: 'audiovisual',
      style: 'apa7',
      audiovisualSubtype: 'webinar',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      authors: [{ firstName: 'A. M.', lastName: 'Soto' }],
      title: 'La actividad física como fuente de bienestar',
      year: '2020',
      publisher: 'Centro Deportivo Javeriana Cali',
      url: 'https://www.youtube.com/watch?v=ypjSCwxxZSs&t=26s',
    },
  },
  {
    id: 'jav-podcast',
    page: 'Pág. 33',
    categoryLabel: '4.4.6 Podcast',
    title: 'Manrique y Hernández (2020) — The Nutrition Lab [Podcast]',
    description: 'Podcast de audio o video con enlace web.',
    formData: {
      sourceType: 'audiovisual',
      style: 'apa7',
      audiovisualSubtype: 'podcast',
      authorMode: 'personal',
      isInstitutionalAuthor: false,
      useSpanishAnd: true,
      authors: [
        { firstName: 'M.', lastName: 'Manrique' },
        { firstName: 'A.', lastName: 'Hernández' },
      ],
      title: 'The Nutrition Lab',
      year: '2020',
      url: 'https://www.listennotes.com/es/podcasts/the-nutrition-lab-maria-manrique-alejandra-azvXtHqS7_s/',
    },
  },
  {
    id: 'jav-redes-tweet',
    page: 'Pág. 34',
    categoryLabel: '4.4.7 Publicación en Redes Sociales (Tweet / Instagram)',
    title: 'Fundéu [@fundeu] (2020, 4 de mayo) — [Tweet]',
    description: 'Publicación en redes sociales con usuario entre corchetes y primeras 20 palabras.',
    formData: {
      sourceType: 'social_media',
      style: 'apa7',
      socialSubtype: 'tweet',
      authorMode: 'institutional',
      isInstitutionalAuthor: true,
      institutionalName: 'Fundéu',
      socialHandle: '@fundeu',
      title: 'Ganador del mundial de consejos de escritura',
      year: '2020',
      exactDate: '4 de mayo',
      url: 'https://mobile.twitter.com/fundeu/status/125727667305516646',
    },
  },
  {
    id: 'jav-legal-sentencia',
    page: 'Pág. 35',
    categoryLabel: '4.5.1 Referencia Legal: Sentencia Judicial',
    title: 'Sentencia T-006/20 (2020, 17 de enero) — Corte Constitucional',
    description: 'En la cita del texto el título va en cursiva y en la referencia en letra estándar.',
    formData: {
      sourceType: 'legal',
      style: 'apa7',
      legalSubtype: 'sentence',
      title: 'Sentencia T-006/20',
      year: '2020',
      exactDate: '17 de enero',
      legalCourtOrBody: 'Corte Constitucional',
      legalJudgeOrSection: 'Cristina Pardo, M.P.',
      url: 'https://www.corteconstitucional.gov.co/Relatoria/2020/T-006-20.htm',
    },
  },
  {
    id: 'jav-legal-ley',
    page: 'Pág. 35',
    categoryLabel: '4.5.2 Referencia Legal: Ley de la República',
    title: 'Ley 1090 de 2006 (2006, 6 de septiembre) — Congreso de la República',
    description: 'Formato Título-Fecha en cita y Título-Fuente-Fecha en la lista de referencias.',
    formData: {
      sourceType: 'legal',
      style: 'apa7',
      legalSubtype: 'law',
      title: 'Ley 1090 de 2006',
      year: '2006',
      exactDate: '6 de septiembre',
      legalCourtOrBody: 'Congreso de la República',
      legalJudgeOrSection: 'Diario Oficial No 46.383',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1090_2006.html',
    },
  },
  {
    id: 'jav-legal-tratado',
    page: 'Pág. 35',
    categoryLabel: '4.5.3 Tratado o Convención Internacional',
    title: 'Pacto Internacional de Derechos Económicos, Sociales y Culturales (1966)',
    description: 'Nombre del tratado o convención, fecha completa y URL.',
    formData: {
      sourceType: 'legal',
      style: 'apa7',
      legalSubtype: 'treaty',
      title: 'Pacto Internacional de Derechos Económicos, Sociales y Culturales',
      year: '1966',
      exactDate: '16 de diciembre',
      url: 'https://www.ohchr.org/SP/ProfessionalInterest/Pages/CESCR.aspx',
    },
  },
];

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    if (!isNaN(day) && month >= 0 && month < 12 && !isNaN(year)) {
      return `${day} de ${meses[month]} de ${year}`;
    }
  }
  return dateStr;
}

function getInitials(firstName: string): string {
  return firstName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => (n.endsWith('.') ? n.toUpperCase() : `${n.charAt(0).toUpperCase()}.`))
    .join(' ');
}

function getEffectiveAuthorMode(data: CitationFormData): AuthorMode {
  if (data.authorMode) return data.authorMode;
  return data.isInstitutionalAuthor ? 'institutional' : 'personal';
}

function formatLocator(pages: string, locatorType: LocatorType = 'page', style: CitationStyle): string {
  const raw = pages.trim();
  if (!raw) return '';

  if (locatorType === 'paragraph') {
    const clean = raw.replace(/^p[áa]rrs?\.\s*/i, '');
    return clean.includes('-') ? `párrs. ${clean}` : `párr. ${clean}`;
  }

  if (locatorType === 'timestamp') {
    return raw;
  }

  if (locatorType === 'section') {
    return raw.toLowerCase().startsWith('secci') ? raw : `sección ${raw}`;
  }

  // Default: page
  if (style === 'mla9') {
    return raw.replace(/^pp?\.\s*/i, '');
  }
  if (raw.startsWith('p.') || raw.startsWith('pp.')) return raw;
  return raw.includes('-') ? `pp. ${raw}` : `p. ${raw}`;
}

function formatAuthorsForReference(
  data: CitationFormData
): { refAuthor: string; sortKey: string } {
  const {
    authors,
    institutionalName,
    institutionalAbbreviation,
    style,
    useSpanishAnd = true,
    sourceType,
    bookSubtype,
    audiovisualSubtype,
    mediaRole,
    socialHandle,
  } = data;

  const mode = getEffectiveAuthorMode(data);

  if (mode === 'anonymous_title') {
    return {
      refAuthor: '',
      sortKey: (data.title || data.chapterTitle || 'sin titulo').trim().toLowerCase(),
    };
  }

  if (mode === 'anonymous_literal') {
    return {
      refAuthor: 'Anónimo.',
      sortKey: 'anonimo',
    };
  }

  const handlePart =
    sourceType === 'social_media' && socialHandle?.trim()
      ? ` [${socialHandle.trim().startsWith('@') ? socialHandle.trim() : `@${socialHandle.trim()}`}]`
      : '';

  if (mode === 'institutional') {
    const inst = institutionalName.trim() || 'Autor Institucional';
    const abbrPart =
      style === 'apa7' &&
      institutionalAbbreviation?.trim() &&
      sourceType === 'website'
        ? ` [${institutionalAbbreviation.trim()}]`
        : '';
    const formatted =
      style === 'icontec'
        ? `${inst.toUpperCase()}${handlePart}.`
        : `${inst}${abbrPart}${handlePart}.`;
    return { refAuthor: formatted, sortKey: inst.toLowerCase() };
  }

  const validAuthors = authors.filter((a) => a.lastName.trim() || a.firstName.trim());
  if (validAuthors.length === 0) {
    return { refAuthor: 'Anónimo.', sortKey: 'anonimo' };
  }

  const sortKey = (validAuthors[0].lastName || validAuthors[0].firstName).trim().toLowerCase();

  // Role suffix for edited books or audiovisual directors/producers in APA 7
  let roleSuffix = '';
  if (style === 'apa7') {
    if (sourceType === 'book' && bookSubtype === 'edited') {
      roleSuffix = validAuthors.length > 1 ? ' (Eds.).' : ' (Ed.).';
    } else if (
      sourceType === 'audiovisual' &&
      (audiovisualSubtype === 'film' || audiovisualSubtype === 'tv_series')
    ) {
      const defaultRole =
        audiovisualSubtype === 'film'
          ? 'Director'
          : validAuthors.length > 1
          ? 'Productores'
          : 'Productora';
      const role = mediaRole?.trim() || defaultRole;
      roleSuffix = ` (${role}).`;
    }
  }

  if (style === 'apa7') {
    const parts = validAuthors.map((a) => {
      const last = a.lastName.trim();
      const first = a.firstName.trim();
      if (last && first) return `${last}, ${getInitials(first)}`;
      const single = last || first;
      return single.endsWith('.') ? single : `${single}.`;
    });

    let joined = '';
    if (parts.length === 1) {
      joined = `${parts[0]}${handlePart}`;
    } else if (parts.length <= 20) {
      // APA 7 rule (p. 23 & p. 36): 2 to 20 authors
      const connector = useSpanishAnd ? ' y ' : ', & ';
      joined = `${parts.slice(0, -1).join(', ')}${connector}${parts[parts.length - 1]}${handlePart}`;
    } else {
      // APA 7 rule (p. 23): More than 20 authors -> first 19 + ... + last author
      const first19 = parts.slice(0, 19).join(', ');
      const lastAuthor = parts[parts.length - 1];
      joined = `${first19}, ... ${lastAuthor}${handlePart}`;
    }

    if (roleSuffix) {
      return { refAuthor: `${joined}${roleSuffix}`, sortKey };
    }
    return { refAuthor: joined.endsWith('.') ? joined : `${joined}.`, sortKey };
  }

  if (style === 'mla9' || style === 'chicago17') {
    const parts = validAuthors.map((a, idx) => {
      const last = a.lastName.trim();
      const first = a.firstName.trim();
      if (idx === 0) {
        return last && first ? `${last}, ${first}` : last || first;
      }
      return last && first ? `${first} ${last}` : last || first;
    });
    let joined = parts[0];
    if (parts.length === 2) {
      joined = `${parts[0]} y ${parts[1]}`;
    } else if (parts.length > 2) {
      joined = `${parts[0]}, et al.`;
    }
    return { refAuthor: joined.endsWith('.') ? joined : `${joined}.`, sortKey };
  }

  // icontec
  const parts = validAuthors.map((a) => {
    const last = a.lastName.trim().toUpperCase();
    const first = a.firstName.trim();
    if (last && first) return `${last}, ${first}`;
    return last || first.toUpperCase();
  });
  const joined =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
      ? `${parts[0]} y ${parts[1]}`
      : `${parts.slice(0, -1).join('; ')} y ${parts[parts.length - 1]}`;
  return { refAuthor: joined.endsWith('.') ? joined : `${joined}.`, sortKey };
}

function formatAuthorsForInText(
  data: CitationFormData
): {
  parenthetical: string;
  narrative: string;
  subsequentParenthetical?: string;
  subsequentNarrative?: string;
} {
  const {
    authors,
    institutionalName,
    institutionalAbbreviation,
    year,
    originalYear,
    pages,
    locatorType = 'page',
    style,
    useSpanishAnd = true,
    sourceType,
    title,
    chapterTitle,
    secondarySourceAuthorYear,
    isPersonalCommunication,
    exactDate,
  } = data;

  const mode = getEffectiveAuthorMode(data);
  const baseYr = year.trim() || 's.f.';
  const yr = originalYear?.trim() ? `${originalYear.trim()}/${baseYr}` : baseYr;
  const locFormatted = formatLocator(pages, locatorType, style);

  // Personal communication case (p. 21): M. González (comunicación personal, 17 de mayo, 2020)
  if (isPersonalCommunication) {
    const valid = authors.filter((a) => a.lastName.trim() || a.firstName.trim());
    let communicator = 'M. González';
    if (mode === 'institutional' && institutionalName.trim()) {
      communicator = institutionalName.trim();
    } else if (valid.length > 0) {
      const firstInit = valid[0].firstName.trim() ? `${getInitials(valid[0].firstName)} ` : '';
      communicator = `${firstInit}${valid[0].lastName.trim()}`.trim();
    }
    const fullDate = exactDate?.trim()
      ? `${exactDate.trim()}, ${baseYr}`
      : baseYr;
    return {
      parenthetical: `(${communicator}, comunicación personal, ${fullDate})`,
      narrative: `${communicator} (comunicación personal, ${fullDate})`,
    };
  }

  // Legal sources (p. 34-35): Title-Date format
  if (sourceType === 'legal') {
    const legalTitle = title.trim() || 'Sentencia T-006/20';
    return {
      parenthetical: `(${legalTitle}, ${baseYr})`,
      narrative: `${legalTitle} (${baseYr})`,
    };
  }

  let authorLabelPar = 'Anónimo';
  let authorLabelNar = 'Anónimo';
  let subsequentPar: string | undefined;
  let subsequentNar: string | undefined;

  if (mode === 'anonymous_title') {
    const rawTitle = (chapterTitle || title || 'Informe Anual').trim();
    const shortWords = rawTitle.split(/\s+/).slice(0, 4).join(' ');
    const isShortWork =
      sourceType === 'article' ||
      sourceType === 'chapter' ||
      sourceType === 'website' ||
      sourceType === 'newspaper';
    authorLabelPar = isShortWork ? `“${shortWords}”` : shortWords;
    authorLabelNar = isShortWork ? `“${shortWords}”` : shortWords;
  } else if (mode === 'anonymous_literal') {
    authorLabelPar = 'Anónimo';
    authorLabelNar = 'Anónimo';
  } else if (mode === 'institutional') {
    const inst = institutionalName.trim() || 'Autor Institucional';
    const abbr = institutionalAbbreviation?.trim();
    if (abbr && style === 'apa7') {
      // First citation defines abbreviation (p. 16 & p. 18)
      authorLabelPar = `${inst} [${abbr}]`;
      authorLabelNar = `${inst} (${abbr}`;
      const locSuffix = locFormatted ? `, ${locFormatted}` : '';
      subsequentPar = `(${abbr}, ${yr}${locSuffix})`;
      subsequentNar = `${abbr} (${yr}${locSuffix})`;
    } else {
      authorLabelPar = inst;
      authorLabelNar = inst;
    }
  } else {
    const valid = authors.filter((a) => a.lastName.trim() || a.firstName.trim());
    if (valid.length === 1) {
      const name = valid[0].lastName.trim() || valid[0].firstName.trim();
      authorLabelPar = name;
      authorLabelNar = name;
    } else if (valid.length === 2) {
      const n1 = valid[0].lastName.trim() || valid[0].firstName.trim();
      const n2 = valid[1].lastName.trim() || valid[1].firstName.trim();
      const conjPar = style === 'apa7' && !useSpanishAnd ? ' & ' : ' y ';
      authorLabelPar = `${n1}${conjPar}${n2}`;
      authorLabelNar = `${n1} y ${n2}`;
    } else if (valid.length > 2) {
      const n1 = valid[0].lastName.trim() || valid[0].firstName.trim();
      authorLabelPar = `${n1} et al.`;
      authorLabelNar = `${n1} et al.`;
    }
  }

  // Secondary source / Cita de una cita (p. 21): Penrose (como se citó en Hawking, 2010)
  if (secondarySourceAuthorYear?.trim()) {
    const sec = secondarySourceAuthorYear.trim();
    const locPart = locFormatted ? `, ${locFormatted}` : '';
    const cleanNarAuthor = authorLabelNar.includes('(')
      ? authorLabelNar.split(' (')[0]
      : authorLabelNar;
    return {
      parenthetical: `(${authorLabelPar}, como se citó en ${sec}${locPart})`,
      narrative: `${cleanNarAuthor} (como se citó en ${sec}${locPart})`,
    };
  }

  if (style === 'mla9') {
    const pgMla = locFormatted ? ` ${locFormatted}` : '';
    return {
      parenthetical: `(${authorLabelPar}${pgMla})`,
      narrative: locFormatted ? `${authorLabelNar} (${locFormatted})` : `${authorLabelNar}`,
    };
  }

  if (style === 'chicago17') {
    const pgChi = locFormatted ? `, ${locFormatted.replace(/^pp?\.\s*/i, '')}` : '';
    return {
      parenthetical: `(${authorLabelPar} ${yr}${pgChi})`,
      narrative: `${authorLabelNar} (${yr}${pgChi})`,
    };
  }

  // APA 7 & Icontec
  const pgApa = locFormatted ? `, ${locFormatted}` : '';
  if (mode === 'institutional' && institutionalAbbreviation?.trim() && style === 'apa7') {
    return {
      parenthetical: `(${authorLabelPar}, ${yr}${pgApa})`,
      narrative: `${authorLabelNar}, ${yr}${pgApa})`,
      subsequentParenthetical: subsequentPar,
      subsequentNarrative: subsequentNar,
    };
  }

  return {
    parenthetical: `(${authorLabelPar}, ${yr}${pgApa})`,
    narrative: `${authorLabelNar} (${yr}${pgApa})`,
    subsequentParenthetical: subsequentPar,
    subsequentNarrative: subsequentNar,
  };
}

function normalizeDoiUrl(doi: string, url: string): string {
  const cleanDoi = doi.trim();
  if (cleanDoi) {
    if (cleanDoi.startsWith('http://') || cleanDoi.startsWith('https://')) {
      return cleanDoi;
    }
    return `https://doi.org/${cleanDoi.replace(/^doi:\s*/i, '')}`;
  }
  return url.trim();
}

export function generateCitationOutput(data: CitationFormData): GeneratedCitation {
  const {
    sourceType,
    style,
    title,
    chapterTitle,
    bookTitle,
    bookEditor,
    year,
    exactDate,
    originalYear,
    translator,
    edition,
    publisher,
    place,
    pages,
    journalName,
    volume,
    issue,
    doi,
    accessDate,
    url,
    bookSubtype = 'authored',
    newspaperSubtype = 'newspaper_online',
    reportNumber,
    conferenceType = 'conferencia',
    conferenceName,
    thesisSubtype = 'online_archive',
    thesisLevel = 'Tesis de pregrado',
    databaseName,
    audiovisualSubtype = 'video',
    socialSubtype = 'tweet',
    legalSubtype = 'sentence',
    legalCourtOrBody,
    legalJudgeOrSection,
    isPersonalCommunication,
    secondarySourceAuthorYear,
    aiCompany,
    aiModel,
    aiVersion,
    aiPromptDescription,
  } = data;

  // 1. Personal Communication (p. 21)
  if (isPersonalCommunication) {
    const inText = formatAuthorsForInText(data);
    const noteMsg =
      'Nota APA 7 (pág. 21): Las comunicaciones personales (entrevistas, llamadas, correos, clases no grabadas, tradición oral) se citan únicamente dentro del texto y NO se incluyen en la lista de referencias.';
    return {
      referenceHtml: `<i>[No requiere entrada en la lista de referencias — Solo se cita en el texto: ${inText.narrative}]</i>`,
      referencePlain: `[No requiere entrada en la lista de referencias — Solo se cita en el texto: ${inText.narrative}]`,
      parenthetical: inText.parenthetical,
      narrative: inText.narrative,
      requiresReferenceList: false,
      specialNote: noteMsg,
      sortKey: 'comunicacion personal',
    };
  }

  // 2. Artificial Intelligence (AI)
  if (sourceType === 'ai') {
    const company = aiCompany.trim() || publisher.trim() || 'OpenAI';
    const model = aiModel.trim() || data.authors[0]?.firstName.trim() || 'ChatGPT';
    const version = aiVersion.trim() || data.authors[0]?.lastName.trim() || '';
    const yr = year.trim() || '2026';
    const serviceUrl = url.trim() || 'https://chatgpt.com';
    const accFormatted = formatDateSpanish(accessDate);
    const promptText = aiPromptDescription.trim() || title.trim();

    const versionPart = version
      ? version.toLowerCase().startsWith('versi')
        ? ` (${version})`
        : ` (Versión ${version})`
      : '';
    const promptPart = promptText ? ` ["${promptText}"]` : '';

    let refHtml = '';
    let par = '';
    let nar = '';

    if (style === 'apa7') {
      const accSentence = accFormatted ? ` Consultado el ${accFormatted}.` : '';
      refHtml = `${company}. (${yr}). <i>${model}</i>${versionPart} [Modelo de lenguaje grande]${promptPart}. ${serviceUrl}${accSentence}`;
      par = `(${company}, ${yr})`;
      nar = `${company} (${yr})`;
    } else if (style === 'mla9') {
      const promptMla = promptText ? `"${promptText}" prompt. ` : '';
      const accMla = accFormatted ? `, consultado el ${accFormatted}` : '';
      refHtml = `${promptMla}<i>${model}</i>${versionPart}, generado por ${company}, ${yr}, ${serviceUrl}${accMla}.`;
      par = `(${company})`;
      nar = `${company}`;
    } else if (style === 'chicago17') {
      const accChi = accFormatted ? ` Consultado el ${accFormatted}.` : '';
      refHtml = `${company}. ${yr}. <i>${model}</i>${versionPart}${promptPart}. Modelo de inteligencia artificial. ${serviceUrl}.${accChi}`;
      par = `(${company} ${yr})`;
      nar = `${company} (${yr})`;
    } else {
      const accIco = accFormatted || yr;
      refHtml = `${company.toUpperCase()}. <i>${model}</i>${versionPart}: modelo de inteligencia artificial${promptPart} [en línea]. ${yr} [citado el ${accIco}]. Disponible en: &lt;${serviceUrl}&gt;.`;
      par = `(${company}, ${yr})`;
      nar = `${company} (${yr})`;
    }

    const plain = refHtml
      .replace(/<\/?i>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    return {
      referenceHtml: refHtml,
      referencePlain: plain,
      parenthetical: par,
      narrative: nar,
      requiresReferenceList: true,
      sortKey: company.toLowerCase(),
    };
  }

  // 3. Legal References (pp. 34-35)
  if (sourceType === 'legal') {
    const legTitle = title.trim() || 'Sentencia T-006/20';
    const yr = year.trim() || '2020';
    const fullDate = exactDate?.trim() ? `${yr}, ${exactDate.trim()}` : yr;
    const courtOrBody = legalCourtOrBody?.trim() || publisher.trim() || 'Corte Constitucional';
    const judgeOrSec = legalJudgeOrSection?.trim() || '';
    const link = normalizeDoiUrl(doi, url);
    const linkPart = link ? ` ${link}` : '';

    let refHtml = '';
    if (legalSubtype === 'sentence') {
      const judgePart = judgeOrSec ? ` (${judgeOrSec})` : '';
      refHtml = `${legTitle}. (${fullDate}). ${courtOrBody}${judgePart}.${linkPart}`;
    } else if (legalSubtype === 'law') {
      const secPart = judgeOrSec ? ` ${judgeOrSec}.` : '';
      refHtml = `${legTitle}. (${fullDate}). ${courtOrBody}.${secPart}${linkPart}`;
    } else {
      // Treaty (p. 35): Nombre del tratado o convención, fecha, URL
      const treatyDate = exactDate?.trim() ? `${exactDate.trim()}, ${yr}` : yr;
      refHtml = `${legTitle}, ${treatyDate},${linkPart}`;
    }

    const plain = refHtml.replace(/<\/?i>/g, '');
    return {
      referenceHtml: refHtml,
      referencePlain: plain,
      parenthetical:
        legalSubtype === 'sentence' ? `(${legTitle}, ${yr})` : `(${legTitle}, ${yr})`,
      narrative: `${legTitle} (${yr})`,
      requiresReferenceList: true,
      specialNote:
        legalSubtype === 'sentence'
          ? 'Nota APA 7 (pág. 35): En las sentencias, el título se escribe en letra estándar en las referencias y en cursiva en la citación dentro del texto.'
          : undefined,
      sortKey: legTitle.toLowerCase(),
    };
  }

  // 4. General Academic, Electronic & Audiovisual Sources
  const { refAuthor, sortKey } = formatAuthorsForReference(data);
  const inText = formatAuthorsForInText(data);
  const mode = getEffectiveAuthorMode(data);

  const yr = year.trim() || 's.f.';
  const dateWithDayMonth = exactDate?.trim() ? `${yr}, ${exactDate.trim()}` : yr;
  const ed = edition.trim();
  const pub = publisher.trim();
  const loc = place.trim();
  const pg = pages.trim();
  const jName = journalName.trim();
  const vol = volume.trim();
  const iss = issue.trim();
  const link = normalizeDoiUrl(doi, url);
  const accSpan = formatDateSpanish(accessDate);

  let refHtml = '';

  if (style === 'apa7') {
    const yrPart = `(${yr}).`;
    const fullDatePart = `(${dateWithDayMonth}).`;
    const linkPart = link ? ` ${link}` : '';

    // Build parenthetical edition / translator for books (p. 25-26)
    const bookParenItems: string[] = [];
    if (translator?.trim()) {
      bookParenItems.push(`${translator.trim()}, Trad.`);
    }
    if (ed) {
      bookParenItems.push(ed);
    }
    const bookParenPart = bookParenItems.length > 0 ? ` (${bookParenItems.join('; ')})` : '';
    const origWorkPart = originalYear?.trim()
      ? ` (Trabajo original publicado en ${originalYear.trim()}).`
      : '';

    if (sourceType === 'book') {
      const bookT = title.trim() || 'Título del libro';
      const pubPart = pub ? ` ${pub}.` : '';
      if (mode === 'anonymous_title') {
        refHtml = `<i>${bookT}</i>${bookParenPart}. ${yrPart}${pubPart}${linkPart}${origWorkPart}`;
      } else {
        refHtml = `${refAuthor} ${yrPart} <i>${bookT}</i>${bookParenPart}.${pubPart}${linkPart}${origWorkPart}`;
      }
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const bTitle = bookTitle.trim() || 'Título del libro';
      const editorRaw = bookEditor.trim();
      const isPluralEditors =
        editorRaw.includes(' y ') || editorRaw.includes('&') || editorRaw.includes(',');
      const editorLabel = editorRaw
        ? `${editorRaw} (${isPluralEditors ? 'Eds.' : 'Ed.'}), `
        : '';
      const pgClean = pg ? `pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      const parenInfo = [ed, pgClean].filter(Boolean).join(', ');
      const parenPart = parenInfo ? ` (${parenInfo})` : '';
      const pubPart = pub ? ` ${pub}.` : '';
      if (mode === 'anonymous_title') {
        refHtml = `${chT}. ${yrPart} En ${editorLabel}<i>${bTitle}</i>${parenPart}.${pubPart}${linkPart}`;
      } else {
        refHtml = `${refAuthor} ${yrPart} ${chT}. En ${editorLabel}<i>${bTitle}</i>${parenPart}.${pubPart}${linkPart}`;
      }
    } else if (sourceType === 'article') {
      const artT = title.trim() || 'Título del artículo';
      const jPart = jName || 'Nombre de la revista';
      const volPart = vol ? `, <i>${vol}</i>` : '';
      const issPart = iss ? `(${iss})` : '';
      const pgPart = pg ? `, ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      if (mode === 'anonymous_title') {
        refHtml = `${artT}. ${yrPart} <i>${jPart}</i>${volPart}${issPart}${pgPart}.${linkPart}`;
      } else {
        refHtml = `${refAuthor} ${yrPart} ${artT}. <i>${jPart}</i>${volPart}${issPart}${pgPart}.${linkPart}`;
      }
    } else if (sourceType === 'newspaper') {
      const artT = title.trim() || 'Título del artículo';
      const paperName = jName || 'Nombre del periódico';
      if (newspaperSubtype === 'newspaper_print') {
        // Periódico impreso (p. 29): página sin abreviación
        const pgPlain = pg ? `, ${pg.replace(/^pp?\.\s*/i, '')}` : '';
        refHtml =
          mode === 'anonymous_title'
            ? `${artT}. ${fullDatePart} <i>${paperName}</i>${pgPlain}.`
            : `${refAuthor} ${fullDatePart} ${artT}. <i>${paperName}</i>${pgPlain}.`;
      } else if (newspaperSubtype === 'newspaper_online') {
        // Periódico en línea (p. 30)
        refHtml =
          mode === 'anonymous_title'
            ? `${artT}. ${fullDatePart} <i>${paperName}</i>.${linkPart}`
            : `${refAuthor} ${fullDatePart} ${artT}. <i>${paperName}</i>.${linkPart}`;
      } else {
        // Magazine impreso o en línea (p. 30)
        const volPart = vol ? `, <i>${vol}</i>` : '';
        const issPart = iss ? `(${iss})` : '';
        const pgPart =
          newspaperSubtype === 'magazine_print' && pg
            ? `, ${pg.replace(/^pp?\.\s*/i, '')}`
            : '';
        refHtml = `${refAuthor} ${fullDatePart} ${artT}. <i>${paperName}</i>${volPart}${issPart}${pgPart}.${linkPart}`;
      }
    } else if (sourceType === 'report') {
      // Informes gubernamentales (p. 30): Nombre de la organización. (Año). Título del informe (Número). URL
      const repT = title.trim() || 'Título del informe';
      const numPart = reportNumber?.trim() ? ` (${reportNumber.trim()})` : '';
      const pubPart =
        !data.isInstitutionalAuthor && pub ? ` ${pub}.` : '';
      refHtml = `${refAuthor} ${yrPart} <i>${repT}</i>${numPart}.${pubPart}${linkPart}`;
    } else if (sourceType === 'conference') {
      // Simposios, conferencias y congresos (p. 31)
      const confT = title.trim() || 'Título de la ponencia';
      const contribType = conferenceType?.trim() || 'conferencia';
      const eventName =
        conferenceName?.trim() || jName || 'Nombre del simposio o congreso';
      const locPart = loc ? `, ${loc}` : '';
      refHtml = `${refAuthor} ${fullDatePart} ${confT} [${contribType}]. <i>${eventName}</i>${locPart}.${linkPart}`;
    } else if (sourceType === 'thesis') {
      // Tesis y trabajos de grado (p. 31)
      const thT = title.trim() || 'Título de la tesis';
      const level = thesisLevel?.trim() || 'Tesis de pregrado';
      const inst = pub || 'Nombre de la institución';
      if (thesisSubtype === 'database') {
        const db = databaseName?.trim() || 'Dissertations & Theses A&I';
        refHtml = `${refAuthor} ${yrPart} <i>${thT}</i> [${level}, ${inst}]. ${db}.${linkPart}`;
      } else {
        refHtml = `${refAuthor} ${yrPart} <i>${thT}</i> [${level}, ${inst}]. Archivo digital.${linkPart}`;
      }
    } else if (sourceType === 'website') {
      // Páginas en la World Wide Web (p. 32): se eliminó "Recuperado de" y no se repite el nombre del sitio si es igual al autor
      const webT = title.trim() || 'Título de la página web';
      const instClean = data.institutionalName.trim().toLowerCase();
      const siteClean = jName.toLowerCase();
      const shouldIncludeSite =
        Boolean(jName) &&
        !(mode === 'institutional' && instClean && instClean === siteClean);
      const sitePart = shouldIncludeSite ? ` ${jName}.` : '';
      const recPart = accSpan ? ` Recuperado el ${accSpan}, de` : '';
      const urlOut = link || 'https://www.ejemplo.com';
      refHtml = `${refAuthor} ${fullDatePart} <i>${webT}</i>.${sitePart}${recPart} ${urlOut}`;
    } else if (sourceType === 'audiovisual') {
      // Material audiovisual (pp. 32-33)
      const mediaT = title.trim() || 'Título de la obra audiovisual';
      const sourceCompany = pub || jName || '';
      const companyPart = sourceCompany ? ` ${sourceCompany}.` : '';
      if (audiovisualSubtype === 'film') {
        refHtml = `${refAuthor} ${yrPart} <i>${mediaT}</i> [Película].${companyPart}${linkPart}`;
      } else if (audiovisualSubtype === 'tv_series') {
        refHtml = `${refAuthor} ${yrPart} <i>${mediaT}</i> [serie de televisión].${companyPart}${linkPart}`;
      } else if (audiovisualSubtype === 'video') {
        refHtml = `${refAuthor} ${fullDatePart} <i>${mediaT}</i> [Video].${companyPart}${linkPart}`;
      } else if (audiovisualSubtype === 'webinar') {
        refHtml = `${refAuthor} ${yrPart} <i>${mediaT}</i> [seminario Web].${companyPart}${linkPart}`;
      } else {
        // podcast
        refHtml = `${refAuthor} ${fullDatePart} <i>${mediaT}</i> [Podcast].${companyPart}${linkPart}`;
      }
    } else if (sourceType === 'social_media') {
      // Publicaciones en redes sociales (p. 34)
      const postText = title.trim() || 'Descripción del contenido con un máximo de 20 palabras';
      const badge =
        socialSubtype === 'tweet'
          ? '[Tweet]'
          : socialSubtype === 'facebook'
          ? '[Publicación]'
          : '[Fotografía]';
      const network =
        socialSubtype === 'tweet'
          ? 'Twitter'
          : socialSubtype === 'facebook'
          ? 'Facebook'
          : 'Instagram';
      const postFormatted =
        socialSubtype === 'instagram' ? `${postText}` : `<i>${postText}</i>`;
      refHtml = `${refAuthor} ${fullDatePart} ${postFormatted} ${badge}. ${network}.${linkPart}`;
    }
  } else if (style === 'mla9') {
    const edPart = ed ? `, ${ed}` : '';
    const yrPart = year.trim() ? `, ${year.trim()}` : '';
    const locPart = loc ? `${loc}: ` : '';

    if (sourceType === 'book' || sourceType === 'report') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título'}</i>${edPart}. ${locPart}${pub || 'Editorial'}${yrPart}.`;
    } else if (sourceType === 'article' || sourceType === 'newspaper') {
      const volIss = [vol ? `vol. ${vol}` : '', iss ? `no. ${iss}` : ''].filter(Boolean).join(', ');
      const volStr = volIss ? `, ${volIss}` : '';
      const pgStr = pg ? `, pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      const linkStr = link ? `, ${link}` : '';
      refHtml = `${refAuthor} "${title.trim() || 'Título'}." <i>${jName || 'Publicación'}</i>${volStr}${yrPart}${pgStr}${linkStr}.`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const pgStr = pg ? `, pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} "${chT}." <i>${bookTitle.trim() || 'Título del libro'}</i>, ${pub || 'Editorial'}${yrPart}${pgStr}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título de la tesis'}</i>. ${year.trim() || 'Año'}. ${pub || 'Universidad'}, ${thesisLevel || 'Tesis de grado'}.${link ? ` ${link}.` : ''}`;
    } else {
      const accStr = accSpan ? ` Consultado el ${accSpan}.` : '';
      refHtml = `${refAuthor} "${title.trim() || 'Título'}." <i>${jName || pub || 'Fuente Digital'}</i>${yrPart}, ${link || 'https://www.ejemplo.com'}.${accStr}`;
    }
  } else if (style === 'chicago17') {
    const placePub = loc && pub ? `${loc}: ${pub}` : pub || loc || 'Editorial';
    const yrChi = year.trim() || 's.f.';

    if (sourceType === 'book' || sourceType === 'report') {
      const edChi = ed ? ` ${ed}.` : '';
      refHtml = `${refAuthor} ${yrChi}. <i>${title.trim() || 'Título'}</i>.${edChi} ${placePub}.`;
    } else if (sourceType === 'article' || sourceType === 'newspaper') {
      const issChi = iss ? `, no. ${iss}` : '';
      const pgChi = pg ? `: ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título'}." <i>${jName || 'Publicación'}</i> ${vol || ''}${issChi}${pgChi}.${link ? ` ${link}.` : ''}`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const pgChi = pg ? `, ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} ${yrChi}. "${chT}." En <i>${bookTitle.trim() || 'Título del libro'}</i>${pgChi}. ${placePub}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título de la tesis'}." ${thesisLevel || 'Tesis de grado'}, ${pub || 'Institución'}.${link ? ` ${link}.` : ''}`;
    } else {
      const accChi = accSpan ? ` Consultado el ${accSpan}.` : '';
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título'}." ${jName || pub ? `${jName || pub}. ` : ''}${accChi} ${link || 'https://www.ejemplo.com'}.`;
    }
  } else {
    // icontec
    const placePub = loc && pub ? `${loc}: ${pub}` : pub || loc || '[s. l. : s. n.]';
    const yrIco = year.trim() ? `, ${year.trim()}` : '';
    const edIco = ed ? `. ${ed}` : '';
    const pgIco = pg ? `. p. ${pg.replace(/^pp?\.\s*/i, '')}` : '';

    if (sourceType === 'book' || sourceType === 'report') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título'}</i>${edIco}. ${placePub}${yrIco}${pgIco}.`;
    } else if (sourceType === 'article' || sourceType === 'newspaper') {
      const issIco = iss ? `, no. ${iss}` : '';
      refHtml = `${refAuthor} ${title.trim() || 'Título'}. En: <i>${jName || 'Revista'}</i>. Vol. ${vol || '1'}${issIco} (${year.trim() || 'Año'}); p. ${pg.replace(/^pp?\.\s*/i, '') || '1-10'}.${link ? ` Disponible en: &lt;${link}&gt;.` : ''}`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      refHtml = `${refAuthor} ${chT}. En: <i>${bookTitle.trim() || 'Título del libro'}</i>. ${placePub}${yrIco}${pgIco}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título de la tesis'}</i>. ${thesisLevel || 'Trabajo de grado'}. ${placePub}${yrIco}.${link ? ` Disponible en: &lt;${link}&gt;.` : ''}`;
    } else {
      const accIco = accSpan || year.trim() || '2026';
      refHtml = `${refAuthor} <i>${title.trim() || 'Título'}</i> [en línea]. ${jName || pub ? `${jName || pub}, ` : ''}${year.trim() || '2026'} [citado el ${accIco}]. Disponible en: &lt;${link || 'https://www.ejemplo.com'}&gt;.`;
    }
  }

  const plain = refHtml
    .replace(/<\/?i>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  let specialNote: string | undefined;
  if (secondarySourceAuthorYear?.trim()) {
    specialNote = `Nota APA 7 (pág. 21 — Cita de una cita): En la lista de referencias final debes registrar los datos completos de la fuente secundaria que consultaste directamente (${secondarySourceAuthorYear.trim()}).`;
  }

  return {
    referenceHtml: refHtml,
    referencePlain: plain,
    parenthetical: inText.parenthetical,
    narrative: inText.narrative,
    subsequentParenthetical: inText.subsequentParenthetical,
    subsequentNarrative: inText.subsequentNarrative,
    requiresReferenceList: true,
    specialNote,
    sortKey,
  };
}
