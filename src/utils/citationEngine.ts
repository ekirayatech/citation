import { AuthorEntry, CitationFormData, CitationStyle, GeneratedCitation, SourceType } from '../types/citation';

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  book: 'Libro (Impreso o Digital)',
  article: 'Artículo de Revista Científica',
  website: 'Sitio Web / Página Web',
  chapter: 'Capítulo de Libro',
  thesis: 'Tesis o Trabajo de Grado',
  ai: 'Inteligencia Artificial (ChatGPT, Gemini, etc.)',
};

export const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: 'APA (7.ª edición)',
  mla9: 'MLA (9.ª edición)',
  chicago17: 'Chicago (17.ª edición)',
  icontec: 'Icontec (NTC 1486)',
};

export const INITIAL_FORM_DATA: CitationFormData = {
  sourceType: 'book',
  style: 'apa7',
  isInstitutionalAuthor: false,
  institutionalName: '',
  authors: [{ firstName: '', lastName: '' }],
  title: '',
  chapterTitle: '',
  bookTitle: '',
  bookEditor: '',
  year: '',
  edition: '',
  publisher: '',
  place: '',
  pages: '',
  journalName: '',
  volume: '',
  issue: '',
  doi: '',
  accessDate: '',
  url: '',
  aiCompany: '',
  aiModel: '',
  aiVersion: '',
  aiPromptDescription: '',
};

export const EXAMPLE_PRESETS: Record<SourceType, Partial<CitationFormData>> = {
  book: {
    isInstitutionalAuthor: false,
    authors: [{ firstName: 'María', lastName: 'Montessori' }],
    title: 'La mente absorbente del niño',
    year: '2019',
    edition: '2.ª ed.',
    publisher: 'Editorial Trillas',
    place: 'Ciudad de México',
    pages: '45',
    doi: '',
    url: '',
  },
  article: {
    isInstitutionalAuthor: false,
    authors: [
      { firstName: 'Roberto', lastName: 'Gómez' },
      { firstName: 'Marcela', lastName: 'Silva' },
    ],
    title: 'Impacto de la inteligencia artificial generativa en el aprendizaje escolar',
    journalName: 'Revista Digital de Educación y Pedagogía',
    volume: '12',
    issue: '3',
    pages: '45-58',
    year: '2024',
    doi: '10.1016/j.rdep.2024.03.004',
  },
  website: {
    isInstitutionalAuthor: true,
    institutionalName: 'UNESCO',
    authors: [{ firstName: '', lastName: '' }],
    title: 'Guía para el uso de IA generativa en la educación y la investigación',
    journalName: 'Portal Educativo UNESCO',
    year: '2025',
    accessDate: '2026-09-26',
    url: 'https://www.unesco.org/es/digital-education/ai',
  },
  chapter: {
    isInstitutionalAuthor: false,
    authors: [{ firstName: 'Gabriel', lastName: 'García Márquez' }],
    chapterTitle: 'La fundación de Macondo y la memoria oral',
    bookTitle: 'Antología del realismo mágico latinoamericano',
    bookEditor: 'E. Rodríguez',
    year: '2021',
    edition: '1.ª ed.',
    publisher: 'Editorial Sudamericana',
    place: 'Buenos Aires',
    pages: '82-104',
  },
  thesis: {
    isInstitutionalAuthor: false,
    authors: [{ firstName: 'Camila', lastName: 'Restrepo Lozano' }],
    title: 'Desarrollo del pensamiento crítico mediante metodologías activas en educación media',
    year: '2024',
    publisher: 'Universidad Nacional de Colombia',
    place: 'Bogotá, Colombia',
    url: 'https://repositorio.unal.edu.co/handle/unal/85412',
  },
  ai: {
    aiCompany: 'OpenAI',
    aiModel: 'ChatGPT',
    aiVersion: 'GPT-4o',
    aiPromptDescription: 'Explicación sobre la estructura de una cita bibliográfica según APA 7',
    year: '2026',
    accessDate: '2026-09-26',
    url: 'https://chatgpt.com',
  },
};

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  // Check if YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
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
    .map((n) => `${n.charAt(0).toUpperCase()}.`)
    .join(' ');
}

function formatAuthorsForReference(
  authors: AuthorEntry[],
  isInstitutional: boolean,
  institutionalName: string,
  style: CitationStyle
): { refAuthor: string; sortKey: string } {
  if (isInstitutional) {
    const inst = institutionalName.trim() || 'Autor Institucional';
    const formatted = style === 'icontec' ? `${inst.toUpperCase()}.` : `${inst}.`;
    return { refAuthor: formatted, sortKey: inst.toLowerCase() };
  }

  const validAuthors = authors.filter((a) => a.lastName.trim() || a.firstName.trim());
  if (validAuthors.length === 0) {
    return { refAuthor: '[Autor anónimo].', sortKey: 'anonimo' };
  }

  const sortKey = (validAuthors[0].lastName || validAuthors[0].firstName).trim().toLowerCase();

  if (style === 'apa7') {
    const parts = validAuthors.map((a) => {
      const last = a.lastName.trim();
      const first = a.firstName.trim();
      if (last && first) return `${last}, ${getInitials(first)}`;
      return `${last || first}.`;
    });
    if (parts.length === 1) return { refAuthor: parts[0], sortKey };
    if (parts.length === 2) return { refAuthor: `${parts[0]}, & ${parts[1]}`, sortKey };
    return {
      refAuthor: `${parts.slice(0, -1).join(', ')}, & ${parts[parts.length - 1]}`,
      sortKey,
    };
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
  const joined = parts.length === 1 ? parts[0] : parts.length === 2 ? `${parts[0]} y ${parts[1]}` : `${parts.slice(0, -1).join('; ')} y ${parts[parts.length - 1]}`;
  return { refAuthor: joined.endsWith('.') ? joined : `${joined}.`, sortKey };
}

function formatAuthorsForInText(
  authors: AuthorEntry[],
  isInstitutional: boolean,
  institutionalName: string,
  year: string,
  pages: string,
  style: CitationStyle
): { parenthetical: string; narrative: string } {
  const yr = year.trim() || 's. f.';
  const pgRaw = pages.trim();
  const isRange = pgRaw.includes('-');
  const pgFormatted = pgRaw
    ? pgRaw.startsWith('p.') || pgRaw.startsWith('pp.')
      ? pgRaw
      : `${isRange ? 'pp.' : 'p.'} ${pgRaw}`
    : '';

  let authorLabelPar = 'Anónimo';
  let authorLabelNar = 'Anónimo';

  if (isInstitutional) {
    authorLabelPar = institutionalName.trim() || 'Autor Institucional';
    authorLabelNar = authorLabelPar;
  } else {
    const valid = authors.filter((a) => a.lastName.trim() || a.firstName.trim());
    if (valid.length === 1) {
      const name = valid[0].lastName.trim() || valid[0].firstName.trim();
      authorLabelPar = name;
      authorLabelNar = name;
    } else if (valid.length === 2) {
      const n1 = valid[0].lastName.trim() || valid[0].firstName.trim();
      const n2 = valid[1].lastName.trim() || valid[1].firstName.trim();
      authorLabelPar = style === 'apa7' ? `${n1} & ${n2}` : `${n1} y ${n2}`;
      authorLabelNar = `${n1} y ${n2}`;
    } else if (valid.length > 2) {
      const n1 = valid[0].lastName.trim() || valid[0].firstName.trim();
      authorLabelPar = `${n1} et al.`;
      authorLabelNar = `${n1} et al.`;
    }
  }

  if (style === 'mla9') {
    const pgMla = pgRaw ? ` ${pgRaw.replace(/^pp?\.\s*/i, '')}` : '';
    return {
      parenthetical: `(${authorLabelPar}${pgMla})`,
      narrative: pgRaw ? `${authorLabelNar} (${pgFormatted})` : `${authorLabelNar}`,
    };
  }

  if (style === 'chicago17') {
    const pgChi = pgRaw ? `, ${pgRaw.replace(/^pp?\.\s*/i, '')}` : '';
    return {
      parenthetical: `(${authorLabelPar} ${yr}${pgChi})`,
      narrative: `${authorLabelNar} (${yr}${pgChi})`,
    };
  }

  // APA 7 & Icontec
  const pgApa = pgFormatted ? `, ${pgFormatted}` : '';
  return {
    parenthetical: `(${authorLabelPar}, ${yr}${pgApa})`,
    narrative: `${authorLabelNar} (${yr}${pgApa})`,
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
    isInstitutionalAuthor,
    institutionalName,
    authors,
    title,
    chapterTitle,
    bookTitle,
    bookEditor,
    year,
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
    aiCompany,
    aiModel,
    aiVersion,
    aiPromptDescription,
  } = data;

  if (sourceType === 'ai') {
    const company = aiCompany.trim() || publisher.trim() || 'OpenAI';
    const model = aiModel.trim() || authors[0]?.firstName.trim() || 'ChatGPT';
    const version = aiVersion.trim() || authors[0]?.lastName.trim() || '';
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
      par = `(${ company })`;
      nar = `${company}`;
    } else if (style === 'chicago17') {
      const accChi = accFormatted ? ` Consultado el ${accFormatted}.` : '';
      refHtml = `${company}. ${yr}. <i>${model}</i>${versionPart}${promptPart}. Modelo de inteligencia artificial. ${serviceUrl}.${accChi}`;
      par = `(${company} ${yr})`;
      nar = `${company} (${yr})`;
    } else {
      // icontec
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
      sortKey: company.toLowerCase(),
    };
  }

  // Non-AI sources
  const { refAuthor, sortKey } = formatAuthorsForReference(
    authors,
    isInstitutionalAuthor,
    institutionalName,
    style
  );
  const { parenthetical, narrative } = formatAuthorsForInText(
    authors,
    isInstitutionalAuthor,
    institutionalName,
    year,
    pages,
    style
  );

  const yr = year.trim() || 's. f.';
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
    const edPart = ed ? ` (${ed})` : '';
    const linkPart = link ? ` ${link}` : '';

    if (sourceType === 'book') {
      const bookT = title.trim() || 'Título del libro';
      const pubPart = pub ? ` ${pub}.` : '';
      refHtml = `${refAuthor} ${yrPart} <i>${bookT}</i>${edPart}.${pubPart}${linkPart}`;
    } else if (sourceType === 'article') {
      const artT = title.trim() || 'Título del artículo';
      const jPart = jName || 'Nombre de la Revista';
      const volPart = vol ? `, <i>${vol}</i>` : '';
      const issPart = iss ? `(${iss})` : '';
      const pgPart = pg ? `, ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} ${yrPart} ${artT}. <i>${jPart}</i>${volPart}${issPart}${pgPart}.${linkPart}`;
    } else if (sourceType === 'website') {
      const webT = title.trim() || 'Título de la página web';
      const sitePart = jName ? ` ${jName}.` : '';
      const recPart = accSpan ? ` Recuperado el ${accSpan}, de` : '';
      const urlOut = link || 'https://www.ejemplo.com';
      refHtml = `${refAuthor} ${yrPart} <i>${webT}</i>.${sitePart}${recPart} ${urlOut}`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const bTitle = bookTitle.trim() || 'Título de la obra principal';
      const editorPart = bookEditor.trim() ? `${bookEditor.trim()} (Ed.), ` : '';
      const pgClean = pg ? `pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      const parenInfo = [ed, pgClean].filter(Boolean).join(', ');
      const parenPart = parenInfo ? ` (${parenInfo})` : '';
      const pubPart = pub ? ` ${pub}.` : '';
      refHtml = `${refAuthor} ${yrPart} ${chT}. En ${editorPart}<i>${bTitle}</i>${parenPart}.${pubPart}${linkPart}`;
    } else if (sourceType === 'thesis') {
      const thT = title.trim() || 'Título de la tesis o trabajo de grado';
      const instPart = pub ? ` [Tesis de grado, ${pub}]` : ' [Tesis de grado]';
      refHtml = `${refAuthor} ${yrPart} <i>${thT}</i>${instPart}.${linkPart}`;
    }
  } else if (style === 'mla9') {
    const edPart = ed ? `, ${ed}` : '';
    const yrPart = year.trim() ? `, ${year.trim()}` : '';
    const locPart = loc ? `${loc}: ` : '';

    if (sourceType === 'book') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título del libro'}</i>${edPart}. ${locPart}${pub || 'Editorial'}${yrPart}.`;
    } else if (sourceType === 'article') {
      const volIss = [vol ? `vol. ${vol}` : '', iss ? `no. ${iss}` : ''].filter(Boolean).join(', ');
      const volStr = volIss ? `, ${volIss}` : '';
      const pgStr = pg ? `, pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      const linkStr = link ? `, ${link}` : '';
      refHtml = `${refAuthor} "${title.trim() || 'Título del artículo'}." <i>${jName || 'Revista'}</i>${volStr}${yrPart}${pgStr}${linkStr}.`;
    } else if (sourceType === 'website') {
      const accStr = accSpan ? ` Consultado el ${accSpan}.` : '';
      refHtml = `${refAuthor} "${title.trim() || 'Título de la página'}." <i>${jName || 'Sitio Web'}</i>${yrPart}, ${link || 'https://www.ejemplo.com'}.${accStr}`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const pgStr = pg ? `, pp. ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} "${chT}." <i>${bookTitle.trim() || 'Título del libro'}</i>, ${pub || 'Editorial'}${yrPart}${pgStr}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título de la tesis'}</i>. ${year.trim() || 'Año'}. ${pub || 'Universidad'}, Tesis de grado.${link ? ` ${link}.` : ''}`;
    }
  } else if (style === 'chicago17') {
    const placePub = loc && pub ? `${loc}: ${pub}` : pub || loc || 'Editorial';
    const yrChi = year.trim() || 's. f.';

    if (sourceType === 'book') {
      const edChi = ed ? ` ${ed}.` : '';
      refHtml = `${refAuthor} ${yrChi}. <i>${title.trim() || 'Título del libro'}</i>.${edChi} ${placePub}.`;
    } else if (sourceType === 'article') {
      const issChi = iss ? `, no. ${iss}` : '';
      const pgChi = pg ? `: ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título del artículo'}." <i>${jName || 'Revista'}</i> ${vol || '1'}${issChi}${pgChi}.${link ? ` ${link}.` : ''}`;
    } else if (sourceType === 'website') {
      const accChi = accSpan ? ` Consultado el ${accSpan}.` : '';
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título de la página'}." ${jName ? `${jName}. ` : ''}${accChi} ${link || 'https://www.ejemplo.com'}.`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      const pgChi = pg ? `, ${pg.replace(/^pp?\.\s*/i, '')}` : '';
      refHtml = `${refAuthor} ${yrChi}. "${chT}." En <i>${bookTitle.trim() || 'Título del libro'}</i>${pgChi}. ${placePub}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} ${yrChi}. "${title.trim() || 'Título de la tesis'}." Tesis de grado, ${pub || 'Institución'}.${link ? ` ${link}.` : ''}`;
    }
  } else {
    // icontec
    const placePub = loc && pub ? `${loc}: ${pub}` : pub || loc || '[s. l. : s. n.]';
    const yrIco = year.trim() ? `, ${year.trim()}` : '';
    const edIco = ed ? `. ${ed}` : '';
    const pgIco = pg ? `. p. ${pg.replace(/^pp?\.\s*/i, '')}` : '';

    if (sourceType === 'book') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título del libro'}</i>${edIco}. ${placePub}${yrIco}${pgIco}.`;
    } else if (sourceType === 'article') {
      const issIco = iss ? `, no. ${iss}` : '';
      refHtml = `${refAuthor} ${title.trim() || 'Título del artículo'}. En: <i>${jName || 'Revista'}</i>. Vol. ${vol || '1'}${issIco} (${year.trim() || 'Año'}); p. ${pg.replace(/^pp?\.\s*/i, '') || '1-10'}.${link ? ` Disponible en: &lt;${link}&gt;.` : ''}`;
    } else if (sourceType === 'website') {
      const accIco = accSpan || year.trim() || '2026';
      refHtml = `${refAuthor} <i>${title.trim() || 'Título de la página'}</i> [en línea]. ${jName ? `${jName}, ` : ''}${year.trim() || '2026'} [citado el ${accIco}]. Disponible en: &lt;${link || 'https://www.ejemplo.com'}&gt;.`;
    } else if (sourceType === 'chapter') {
      const chT = chapterTitle.trim() || title.trim() || 'Título del capítulo';
      refHtml = `${refAuthor} ${chT}. En: <i>${bookTitle.trim() || 'Título del libro'}</i>. ${placePub}${yrIco}${pgIco}.`;
    } else if (sourceType === 'thesis') {
      refHtml = `${refAuthor} <i>${title.trim() || 'Título de la tesis'}</i>. Trabajo de grado. ${placePub}${yrIco}.${link ? ` Disponible en: &lt;${link}&gt;.` : ''}`;
    }
  }

  const plain = refHtml
    .replace(/<\/?i>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  return {
    referenceHtml: refHtml,
    referencePlain: plain,
    parenthetical,
    narrative,
    sortKey,
  };
}
