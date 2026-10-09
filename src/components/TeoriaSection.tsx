import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Link2,
  FileText,
  Users,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Presentation,
  LayoutList,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CitationFormData, CitationStyle, SourceType } from '../types/citation';
import {
  APA_DOCUMENT_EXAMPLES,
  generateCitationOutput,
  INITIAL_FORM_DATA,
  OfficialDocumentExample,
} from '../utils/citationEngine';

interface TeoriaSectionProps {
  onNavigateToGestor: (presetType?: SourceType, presetStyle?: CitationStyle) => void;
  onNavigateToTaller: () => void;
  onLoadExampleInGestor?: (exampleData: Partial<CitationFormData>, label: string) => void;
  showToast?: (msg: string) => void;
}

const SPECIAL_CITATION_CASES = [
  {
    number: '3.4.1',
    title: 'Cita de dos o más trabajos en el mismo paréntesis',
    rule: 'Para incluir los autores de varias obras dentro de un paréntesis, se deben ordenar alfabéticamente de acuerdo al orden de aparición en la lista de referencias y se utiliza el punto y coma (;) para separar las citas.',
    exampleNar: 'Diversos estudios recientes coinciden en este fenómeno...',
    examplePar:
      'El cyberbullying es una nueva forma de acoso escolar (Cardozo, 2020; Chocarro y Garaigordobil, 2019; Gastesi y Salceda, 2019).',
  },
  {
    number: '3.4.2',
    title: 'Varios trabajos de un autor con igual fecha de publicación',
    rule: 'Para citar varias obras de un mismo autor en la misma fecha, se agregan letras minúsculas al año (a, b, c...) en el orden de aparición de las obras en el texto.',
    exampleNar: 'Douglas (2019a) plantea que... Esta definición es compartida por Douglas (2019b)...',
    examplePar: '(Douglas, 2019a, 2019b)',
  },
  {
    number: '3.4.3',
    title: 'Cita del mismo autor con diferente año',
    rule: 'Si son citas de un mismo autor pero con un año diferente, se indica el apellido del autor y entre paréntesis los años correspondientes (del menos reciente al más reciente) separados por un punto y coma (;).',
    exampleNar: 'Jodelet (1984; 1986)',
    examplePar: '(Jodelet, 1984; 1986)',
  },
  {
    number: '3.4.4',
    title: 'Citas con diferentes autores que comparten el mismo apellido',
    rule: 'Cuando en el texto se van a citar seguidamente dos o más autores que comparten el mismo apellido, se incluye la inicial del nombre de cada autor para lograr diferenciarlos.',
    exampleNar: 'S. Freud (1921) y A. Freud (1960)',
    examplePar: '(S. Freud, 1921; A. Freud, 1960)',
  },
  {
    number: '3.4.5',
    title: 'Citas de fuentes con distintas fechas, por reedición o traducción',
    rule: 'En libros que han pasado por procesos de reimpresión, reedición o traducción, en las citas se incluyen las dos fechas (año original / año de traducción o reedición) separadas con una barra oblicua (/).',
    exampleNar: 'Piaget (1966/2000)',
    examplePar: '(Piaget, 1966/2000)',
  },
  {
    number: '3.4.6',
    title: 'Citas de publicaciones sin autor',
    rule: 'Se citan las primeras palabras del título de la obra y el año de publicación. Si es un artículo, capítulo de libro o página web, las palabras del título van entre comillas dobles. Si está firmada “Anónimo”, se utiliza este término.',
    exampleNar: 'En el “Informe Anual” (2013) se destaca que...',
    examplePar:
      'Se evidencia que ha aumentado la defensa de los niños (“Informe Anual”, 2013). | (Anónimo, 2020).',
  },
  {
    number: '3.4.7',
    title: 'Cita de publicaciones sin fecha',
    rule: 'Si en el material a citar no se indica el año o fecha de publicación, es necesario que se incluya s.f. que indica “sin fecha”.',
    exampleNar:
      'Pulido (s.f.) afirma que el conocimiento concreto de la tarea garantiza una buena solución.',
    examplePar: '(Pulido, s.f.)',
  },
  {
    number: '3.4.8',
    title: 'Cita textual de material sin paginación o audiovisual',
    rule: 'Cuando no hay número de página, se incluye el número de párrafo con la abreviatura párr. (o el encabezado/sección). En obras audiovisuales se incluye una marca de tiempo.',
    exampleNar: 'Basu y Jones (2007) proponen este enfoque (párr. 4).',
    examplePar:
      '“Se sugiere un nuevo marco para considerar la naturaleza” (Basu y Jones, 2007, párr. 4). | Audiovisual: (Walley-Beckett, 2017, 25:36)',
  },
  {
    number: '3.4.9',
    title: 'Cita de una cita (Fuente secundaria)',
    rule: 'Se usa cuando se tiene acceso a una fuente a través de otra. Se recomienda hacer el menor uso posible de este tipo de citas mientras se pueda acceder al material original.',
    exampleNar: 'Penrose (como se citó en Hawking, 2010) plantea que las matemáticas...',
    examplePar: '(Penrose, como se citó en Hawking, 2010)',
  },
];

const SLIDE_METADATA = [
  {
    index: 0,
    badge: 'Slide 1 de 6 · Ética e Integridad Académica',
    shortTitle: '1. Probidad Académica',
    title: 'Probidad Académica y Respeto por los Derechos de Autor',
  },
  {
    index: 1,
    badge: 'Slide 2 de 6 · Citas Bibliográficas y Tipos',
    shortTitle: '2. ¿Qué es una Cita?',
    title: '¿Qué es una Cita Bibliográfica y cuáles son sus tipos?',
  },
  {
    index: 2,
    badge: 'Slide 3 de 6 · Extensión, Autores y Casos Especiales',
    shortTitle: '3. Clasificación y Casos',
    title: 'Clasificación según la extensión, número de autores y casos especiales (APA 7.ª)',
  },
  {
    index: 3,
    badge: 'Slide 4 de 6 · Referencias y Catálogo Oficial',
    shortTitle: '4. ¿Qué es una Referencia?',
    title: '¿Qué es una Referencia Bibliográfica y Catálogo de Referencias?',
  },
  {
    index: 4,
    badge: 'Slide 5 de 6 · Anatomía Interactiva',
    shortTitle: '5. Partes de la Referencia',
    title: '¿De qué partes se compone una referencia bibliográfica?',
  },
  {
    index: 5,
    badge: 'Slide 6 de 6 · Identificadores Digitales',
    shortTitle: '6. Términos e Identificadores',
    title: 'Tabla de Términos Académicos Esenciales e Identificadores Digitales',
  },
];

export const TeoriaSection: React.FC<TeoriaSectionProps> = ({
  onNavigateToGestor,
  onNavigateToTaller,
  onLoadExampleInGestor,
  showToast,
}) => {
  const [activePart, setActivePart] = useState<'all' | 'who' | 'when' | 'what' | 'where'>('all');
  const [selectedNormStyle, setSelectedNormStyle] = useState<CitationStyle>('apa7');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slides' | 'list'>('slides');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    if (showToast) showToast('Referencia copiada al portapapeles');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredCatalog: OfficialDocumentExample[] = APA_DOCUMENT_EXAMPLES.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.formData.sourceType === categoryFilter;
  });

  const totalSlides = SLIDE_METADATA.length;

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  useEffect(() => {
    if (viewMode !== 'slides') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrevSlide, handleNextSlide]);

  const normComparisonExamples: Record<
    CitationStyle,
    {
      name: string;
      discipline: string;
      description: string;
      inTextExample: string;
      referenceExampleHtml: string;
      keyRules: string[];
    }
  > = {
    apa7: {
      name: 'APA (7.ª edición)',
      discipline: 'Ciencias Sociales, Educación y Ciencias Exactas',
      description:
        'Estándar principal adoptado en el Colegio Ekirayá. Utiliza el sistema Autor-Fecha en el texto y sangría francesa en la lista de referencias final.',
      inTextExample: '(Montessori, 2019, p. 45)  ·  Según Montessori (2019), ... (p. 45).',
      referenceExampleHtml:
        'Montessori, M. (2019). <i>La mente absorbente del niño</i> (2.ª ed.). Editorial Trillas.',
      keyRules: [
        'Solo se escribe la inicial del nombre del autor (Apellido, N.).',
        'El año de publicación va entre paréntesis inmediatamente después del autor.',
        'Los títulos de libros y nombres de revistas van en cursiva.',
        'Los enlaces DOI deben escribirse como URL completa (https://doi.org/...).',
      ],
    },
    mla9: {
      name: 'MLA (9.ª edición)',
      discipline: 'Humanidades, Literatura, Lenguas y Artes',
      description:
        'Ideal para análisis literario y ensayos de humanidades. En el texto prioriza el apellido del autor y el número de página sin coma intermedia.',
      inTextExample: '(Montessori 45)  ·  Montessori afirma que ... (45).',
      referenceExampleHtml:
        'Montessori, María. <i>La mente absorbente del niño</i>, 2.ª ed., Editorial Trillas, 2019.',
      keyRules: [
        'Se escribe el nombre completo del autor (Apellido, Nombre).',
        'La cita en el texto usa Autor y página sin "p." ni coma: (García Márquez 82).',
        'Los títulos de artículos y capítulos van entre comillas (" ").',
        'El año de publicación se ubica hacia el final de la referencia.',
      ],
    },
    chicago17: {
      name: 'Chicago (17.ª edición)',
      discipline: 'Historia, Filosofía, Arte y Ciencias Sociales',
      description:
        'Muy utilizado en investigaciones históricas y monografías extensas. En su variante Autor-Fecha incluye lugar de publicación y editorial.',
      inTextExample: '(Montessori 2019, 45)  ·  Montessori (2019, 45) sostiene...',
      referenceExampleHtml:
        'Montessori, María. 2019. <i>La mente absorbente del niño</i>. 2.ª ed. Ciudad de México: Editorial Trillas.',
      keyRules: [
        'Incluye el nombre completo del autor y el año sin paréntesis en la referencia.',
        'Especifica la ciudad de publicación seguida de dos puntos y la editorial.',
        'En el texto no lleva coma entre el apellido y el año: (Autor Año, página).',
      ],
    },
    icontec: {
      name: 'Icontec (NTC 1486 / NTC 5613)',
      discipline: 'Norma Técnica Colombiana Institucional',
      description:
        'Normativa colombiana tradicional para presentación de trabajos de grado, informes técnicos y monografías institucionales en el país.',
      inTextExample: '(Montessori, 2019, p. 45)  ·  Montessori (2019, p. 45)',
      referenceExampleHtml:
        'MONTESSORI, María. <i>La mente absorbente del niño</i>. 2.ª ed. Ciudad de México: Editorial Trillas, 2019. p. 45.',
      keyRules: [
        'Los apellidos del autor se escriben completamente en MAYÚSCULAS SOSTENIDAS.',
        'Para recursos en línea se añade la designación [en línea] y la fecha de cita [citado el ...].',
        'Especifica lugar de publicación, editorial, año y paginación.',
      ],
    },
  };

  const currentNorm = normComparisonExamples[selectedNormStyle];

  /* Bloque reutilizable del Catálogo Interactivo de los 23 Ejemplos Oficiales */
  const renderReferencesCatalog = () => (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h5 className="text-base font-bold text-violet-950">
            4.3 a 4.5 Catálogo de las Principales Referencias (Carga en 1 clic al Gestor)
          </h5>
          <p className="text-xs text-slate-600">
            Explora los 23 modelos oficiales por tipo de fuente (libros, capítulos, artículos,
            periódicos, informes, simposios, tesis, web, medios audiovisuales, redes sociales y
            referencias legales):
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todos (23)' },
            { id: 'book', label: 'Libros' },
            { id: 'chapter', label: 'Capítulos' },
            { id: 'article', label: 'Artículos (Journal)' },
            { id: 'newspaper', label: 'Periódicos' },
            { id: 'report', label: 'Informes' },
            { id: 'conference', label: 'Simposios' },
            { id: 'thesis', label: 'Tesis' },
            { id: 'website', label: 'Web WWW' },
            { id: 'audiovisual', label: 'Audiovisual / Podcast' },
            { id: 'social_media', label: 'Redes Sociales' },
            { id: 'legal', label: 'Legales (Leyes/Sentencias)' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCategoryFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === f.id
                  ? 'bg-violet-800 text-white font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-violet-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCatalog.map((item) => {
          const fullForm: CitationFormData = {
            ...INITIAL_FORM_DATA,
            ...item.formData,
          };
          const output = generateCitationOutput(fullForm);
          const isCopied = copiedId === item.id;

          return (
            <article
              key={item.id}
              className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 shadow-2xs flex flex-col justify-between space-y-3 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                    {item.categoryLabel}
                  </span>
                </div>
                <h6 className="text-sm font-bold text-slate-900">{item.title}</h6>
                <p className="text-xs text-slate-600">{item.description}</p>

                <div
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 hanging-indent leading-relaxed select-all"
                  dangerouslySetInnerHTML={{ __html: output.referenceHtml }}
                />

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-600 px-1">
                  <span>
                    <strong className="font-sans text-slate-700">Cita parentética:</strong>{' '}
                    {output.parenthetical}
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="font-sans text-slate-700">Narrativa:</strong>{' '}
                    {output.narrative}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(output.referencePlain, item.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? 'Copiada' : 'Copiar referencia'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onLoadExampleInGestor) {
                      onLoadExampleInGestor(item.formData, item.title);
                    } else {
                      onNavigateToGestor(item.formData.sourceType, 'apa7');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cargar en el Gestor</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Banner Institucional de Presentación — Propuesta 1 con base blanca e institucional */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#315BA3] font-bold">
              <span>Colegio Ekirayá Educación Montessori</span>
              <span aria-hidden="true">·</span>
              <span>Guía Teórica Interactiva en 6 Slides</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-slate-950 font-display"
              style={{ textWrap: 'balance' }}
            >
              Fundamentos de Citación, Probidad Académica y Referencias
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Explora en modo presentación cada módulo temático: probidad académica, qué es una cita
              y sus tipos, clasificación y casos especiales, qué es una referencia y su catálogo
              oficial, las partes de la referencia y la tabla de identificadores digitales (
              <strong className="text-slate-900">DOI, ISBN, ISSN y URL/URI</strong>).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToGestor()}
              className="px-4 py-2.5 bg-[#315BA3] hover:bg-[#254680] text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#f8c62e]" />
              Abrir Gestor Cita Master
            </button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE SLIDES A PANTALLA COMPLETA (6 PESTAÑAS INTEGRADAS) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
              Presentación Interactiva · Guía Teórica Completa
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {viewMode === 'slides'
                ? SLIDE_METADATA[currentSlide].title
                : 'Vista Completa de los 6 Módulos de la Guía Teórica'}
            </h3>
          </div>

          {/* Selector de Modo: Diapositivas (Slide) vs Vista Completa */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('slides')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'slides'
                  ? 'bg-[#315BA3] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Modo Slide (6)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#315BA3] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Ver Todas</span>
            </button>
          </div>
        </div>

        {/* BARRA SUPERIOR DE PESTAÑAS Y FLECHAS DEL SLIDE (6 PESTAÑAS) */}
        <div className="space-y-5">
          {viewMode === 'slides' && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3.5">
              {/* Barra Superior con Indicador y Flechas de Retroceso y Avance */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#315BA3]/10 text-[#315BA3] font-bold text-xs border border-[#315BA3]/20">
                    {SLIDE_METADATA[currentSlide].badge}
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-500">
                    Selecciona cualquiera de las 6 pestañas o usa las flechas para navegar
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-[#315BA3]/40 text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    aria-label="Diapositiva anterior"
                    title="Retroceder a la diapositiva anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#315BA3]" />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="px-3.5 py-1.5 rounded-xl bg-[#315BA3] hover:bg-[#254680] text-white border border-[#315BA3] text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    aria-label="Siguiente diapositiva"
                    title="Avanzar a la siguiente diapositiva"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pestañas directas de las 6 Diapositivas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-0.5">
                {SLIDE_METADATA.map((slide) => {
                  const isActive = currentSlide === slide.index;
                  return (
                    <button
                      key={slide.index}
                      type="button"
                      onClick={() => setCurrentSlide(slide.index)}
                      className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all border flex items-center justify-between gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#315BA3] text-white border-[#315BA3] shadow-xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#315BA3]/40 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{slide.shortTitle}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive ? 'bg-[#f8c62e]' : 'bg-slate-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Barra de Progreso Visual */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-700 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* CONTENEDOR DE CADA SLIDE (OCUPA TODA LA PANTALLA CON LA INFORMACIÓN COMPLETA) */}
          <div className="min-h-[64vh]">
            {/* =====================================================================
                SLIDE 1: PROBIDAD ACADÉMICA Y RESPETO POR LOS DERECHOS DE AUTOR
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 0) && (
              <section className="p-5 sm:p-7 rounded-2xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-6 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-4">
                  <div>
                    <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                      Módulo 1 · Ética Investigativa y Derechos de Autor
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                      1. Probidad Académica y Respeto por los Derechos de Autor
                    </h4>
                  </div>
                  <span className="text-xs text-violet-800 font-semibold bg-white px-3 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
                    Principio Ético Institucional · Colegio Ekirayá
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  En el <strong>Colegio Ekirayá Educación Montessori</strong>, la{' '}
                  <strong>probidad académica</strong> es un principio ético fundamental que promueve
                  la honestidad personal, el rigor científico y la responsabilidad en el aprendizaje.
                  Implica dar crédito oportuno y explícito a las fuentes originales de información,
                  ideas, imágenes, tablas, datos o códigos utilizados en cualquier proyecto,
                  presentación o ensayo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs space-y-2">
                    <div className="text-sm font-bold text-violet-950">Derecho de Autor</div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Protección jurídica y moral que otorga a los creadores el reconocimiento sobre
                      sus obras intelectuales (libros, artículos, fotografías, software). Presentar
                      ideas ajenas como propias sin citarlas constituye{' '}
                      <strong>plagio académico</strong>.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs space-y-2">
                    <div className="text-sm font-bold text-violet-950">
                      Uso Ético de la Inteligencia Artificial
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Al emplear modelos generativos (como ChatGPT, Gemini o Claude) para indagar
                      conceptos o estructurar ideas, la probidad exige declarar su uso, mencionar la
                      instrucción (<em>prompt</em>) e incluir su cita y referencia formal.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs space-y-2">
                    <div className="text-sm font-bold text-violet-950">
                      ¿Cuándo NO es necesario citar?
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      No requieren cita tus propias reflexiones originales, resultados de tus propios
                      experimentos escolares ni los hechos de{' '}
                      <strong>conocimiento público general</strong> (ej. &quot;Bogotá es la capital
                      de Colombia&quot;). En caso de duda, cita siempre la fuente.
                    </p>
                  </div>
                </div>

                {/* Principios de Integridad en la Escritura Académica */}
                <div className="bg-white p-5 rounded-xl border border-blue-200 space-y-3">
                  <h5 className="text-sm sm:text-base font-bold text-violet-950">
                    Compromisos de Integridad Académica al Investigar y Escribir
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Correspondencia estricta:</strong> Todo autor citado en el desarrollo
                        del texto debe aparecer en la lista final de Referencias, y toda referencia
                        listada debe haber sido citada en el texto.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Prioridad a las fuentes primarias:</strong> Siempre que sea posible,
                        consulta la obra original directamente y utiliza las citas secundarias
                        (&quot;como se citó en...&quot;) únicamente cuando el texto original no esté
                        disponible.
                      </span>
                    </div>
                  </div>
                </div>

                {/* COMPARADOR INTERACTIVO DE GUÍAS DE NORMAS ACADÉMICAS */}
                <div className="bg-white p-5 rounded-xl border border-blue-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-xs font-medium text-violet-700">
                        Estándares Internacionales en Cita Master
                      </div>
                      <h5 className="text-base sm:text-lg font-bold text-slate-900">
                        Comparador de Guías de Normas Académicas
                      </h5>
                    </div>
                    <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
                      {(['apa7', 'mla9', 'chicago17', 'icontec'] as CitationStyle[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedNormStyle(st)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                            selectedNormStyle === st
                              ? 'bg-white text-violet-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'apa7'
                            ? 'APA 7.ª'
                            : st === 'mla9'
                            ? 'MLA 9.ª'
                            : st === 'chicago17'
                            ? 'Chicago 17.ª'
                            : 'Icontec'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h6 className="text-sm sm:text-base font-semibold text-slate-900">
                          {currentNorm.name}
                        </h6>
                        <p className="text-xs text-violet-700 font-medium">
                          Campo de aplicación: {currentNorm.discipline}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToGestor('book', selectedNormStyle)}
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1 self-start sm:self-auto"
                      >
                        Usar {currentNorm.name} en el Gestor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {currentNorm.description}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Ejemplo de Cita y Referencia en {currentNorm.name}:
                        </div>
                        <div className="text-xs font-mono text-emerald-800 bg-emerald-50/70 px-2.5 py-1.5 rounded border border-emerald-200/60">
                          Cita: {currentNorm.inTextExample}
                        </div>
                        <div
                          className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 hanging-indent"
                          dangerouslySetInnerHTML={{ __html: currentNorm.referenceExampleHtml }}
                        />
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Criterios clave de formato:
                        </div>
                        <ul className="space-y-1.5">
                          {currentNorm.keyRules.map((rule, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================================================
                SLIDE 2: ¿QUÉ ES UNA CITA BIBLIOGRÁFICA Y CUÁLES SON SUS TIPOS?
                (Incluye definición, cita parentética, cita narrativa, cita corta,
                 cita larga en bloque, parafraseo y acceso a casos de citación)
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 1) && (
              <section
                className={`p-5 sm:p-7 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-6 transition-all ${
                  viewMode === 'list' ? 'mt-8' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-4">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Módulo 2 · Fundamentos y Mecanismos de Citación en el Texto
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                      2. ¿Qué es una Cita Bibliográfica y cuáles son sus tipos?
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-900 font-semibold bg-white px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                    Sistema Autor-Fecha (APA 7.ª edición)
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  Una <strong>cita bibliográfica</strong> es una mención abreviada que se inserta{' '}
                  <strong>dentro del texto del documento</strong> cada vez que se utiliza una idea,
                  frase literal, dato estadístico o concepto proveniente de otro autor o fuente
                  (incluyendo herramientas de IA). Las normas APA utilizan el sistema{' '}
                  <strong>Autor-Fecha</strong> para dar crédito en el lugar exacto de uso y remitir
                  al lector a la lista de referencias final.
                </p>

                {/* Modalidades según el énfasis: Parentética vs Narrativa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1">
                        Modalidad 1 · Énfasis en la idea o contenido
                      </div>
                      <h5 className="text-base font-bold text-slate-900 mb-1.5">
                        Cita Parentética
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Se hace énfasis en el texto o idea citada. Los datos del autor, año y
                        localizador (página o párrafo) se colocan entre paréntesis al final de la
                        oración, antes del punto.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
                      &ldquo;Parece ser que cuando no se encuentran medios para tramitar el dolor
                      social, las lesiones en la piel se convierten en una vía de escape&rdquo;{' '}
                      <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                        (Kaplan y Szapu, 2019, p. 111)
                      </span>
                      .
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1">
                        Modalidad 2 · Énfasis en el autor
                      </div>
                      <h5 className="text-base font-bold text-slate-900 mb-1.5">
                        Cita Narrativa
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        El apellido del autor se incorpora directamente en la redacción de la
                        oración, seguido inmediatamente por el año entre paréntesis; la página va al
                        final.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
                      Según{' '}
                      <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                        Kaplan y Szapu (2019)
                      </span>
                      , &ldquo;cuando no se encuentran medios para tramitar el dolor social, las
                      lesiones en la piel se convierten en una vía de escape&rdquo;{' '}
                      <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                        (p. 111)
                      </span>
                      .
                    </div>
                  </div>
                </div>

                {/* Cita Directa (Corta y Larga) vs. Cita Indirecta (Parafraseo) con ejemplos del Manual Javeriana */}
                <div className="space-y-3">
                  <h5 className="text-base font-bold text-violet-950">
                    Tipos de Citas según su Fidelidad al Texto Original: Textual (Directa) y
                    Parafraseo (Indirecta)
                  </h5>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-white border border-emerald-200 space-y-2.5 shadow-2xs">
                      <div className="text-xs font-bold text-violet-800 uppercase">
                        3.1.1 Cita Textual Corta (Menos de 40 palabras)
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Se integra dentro del párrafo y se encierra entre{' '}
                        <strong>comillas dobles</strong>, sin cursiva. El punto final se sitúa
                        después del paréntesis.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
                        <div>
                          <strong className="text-violet-900 font-sans">Ejemplo:</strong> &ldquo;La
                          mente del niño absorbe el entorno activamente&rdquo; (Montessori, 2019, p.
                          45).
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-emerald-200 space-y-2.5 shadow-2xs">
                      <div className="text-xs font-bold text-violet-800 uppercase">
                        3.1.2 Cita Textual Larga (40 palabras o más)
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Se escribe en <strong>párrafo aparte con sangría de 1.27 cm</strong> a la
                        izquierda, sin comillas ni cursiva. El{' '}
                        <strong>punto final va antes del paréntesis</strong>.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                        <div>Según Kaplan y Szapu (2019):</div>
                        <div className="pl-3.5 border-l-2 border-violet-400">
                          Parece ser que cuando no se encuentran medios para tramitar el dolor
                          social, las lesiones en la piel se convierten en una vía de escape. La
                          sensación de alivio obtenida mediante los cortes parece reemplazar un dolor
                          (social) por otro (físico), aunque sea por breves momentos. (p. 111)
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-emerald-200 space-y-2.5 shadow-2xs">
                      <div className="text-xs font-bold text-violet-800 uppercase">
                        3.2 Parafraseo (Cita Indirecta)
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Se expresan con palabras propias las ideas de otro autor.{' '}
                        <strong>No lleva comillas</strong> e incluye obligatoriamente autor y año de
                        publicación.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
                        <div>
                          <strong className="text-violet-900 font-sans">Parentético:</strong> Las
                          autolesiones corporales surgen como un mecanismo para desplazar el
                          sufrimiento social hacia el plano físico (Kaplan y Szapu, 2019).
                        </div>
                        <div className="border-t border-slate-200 pt-1">
                          <strong className="text-violet-900 font-sans">Narrativo:</strong> Kaplan y
                          Szapu (2019) sostienen que las autolesiones desplazan el sufrimiento
                          social.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {viewMode === 'slides' && (
                  <div className="flex items-center justify-between bg-white/90 p-3.5 rounded-xl border border-emerald-200 text-xs">
                    <span className="text-slate-700">
                      ¿Quieres ver la tabla según el número de autores, la desambiguación y las{' '}
                      <strong>9 situaciones especiales de citación</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentSlide(2)}
                      className="px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <span>Ver Slide 3: Clasificación y Casos de Cita</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* =====================================================================
                SLIDE 3: CLASIFICACIÓN SEGÚN LA EXTENSIÓN, AUTORES Y CASOS ESPECIALES
                (Incluye tabla de autores, desambiguación, las 9 situaciones especiales
                 3.4.1 a 3.4.9 y las citas que no requieren referencia 3.5.1 y 3.5.2)
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 2) && (
              <section
                className={`p-5 sm:p-7 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-6 transition-all ${
                  viewMode === 'list' ? 'mt-8' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Módulo 3 · Reglas de Autores, Desambiguación y Casos Especiales
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                        3. Clasificación según la Extensión, Autores y Situaciones Especiales de
                        Citado
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-900 font-semibold bg-white px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                    Incluye los 9 casos especiales y excepciones APA 7.ª
                  </span>
                </div>

                {/* Regla del número de autores y desambiguación */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-emerald-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-violet-950">
                      <Users className="w-4 h-4 text-violet-700 shrink-0" />
                      <span>
                        3.3 Variación de acuerdo con el Número de Autores (&ldquo;y&rdquo;,
                        &ldquo;&amp;&rdquo; y &ldquo;et al.&rdquo;)
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-violet-900 text-white">
                          <tr>
                            <th className="p-2.5 font-semibold">Tipo de autor</th>
                            <th className="p-2.5 font-semibold">Cita narrativa</th>
                            <th className="p-2.5 font-semibold">Cita parentética</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white font-mono">
                          <tr>
                            <td className="p-2.5 font-sans font-semibold text-slate-900">
                              Un autor
                            </td>
                            <td className="p-2.5 text-slate-800">López-Gómez (2019)</td>
                            <td className="p-2.5 text-slate-800">(López-Gómez, 2019)</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-sans font-semibold text-slate-900">
                              Dos autores
                            </td>
                            <td className="p-2.5 text-slate-800">Saldarriaga y Londoño (2020)</td>
                            <td className="p-2.5 text-slate-800">
                              (Saldarriaga y Londoño, 2020) / (&amp;)
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-sans font-semibold text-slate-900">
                              Tres o más autores
                            </td>
                            <td className="p-2.5 text-slate-800">Hoyos-Hernández et al. (2019)</td>
                            <td className="p-2.5 text-slate-800">(Hoyos-Hernández et al., 2019)</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-sans font-semibold text-slate-900">
                              Autor corporativo (1.ª cita)
                            </td>
                            <td className="p-2.5 text-slate-800">
                              Organización Mundial de la Salud (OMS, 2015)
                            </td>
                            <td className="p-2.5 text-slate-800">
                              (Organización Mundial de la Salud [OMS], 2015)
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-sans font-semibold text-slate-900">
                              Autor corporativo (2.ª+ cita)
                            </td>
                            <td className="p-2.5 text-slate-800">OMS (2015)</td>
                            <td className="p-2.5 text-slate-800">(OMS, 2015)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Desambiguación de 3 o más autores en fuentes diferentes con igual año */}
                  <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-emerald-200 space-y-3 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-violet-800 uppercase">
                        3.3.3 Tres o más autores en fuentes diferentes con igual año
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Cuando existen dos o más obras de tres o más autores publicadas el mismo año
                        que coinciden en el primer apellido, se escriben los apellidos necesarios
                        hasta diferenciar las obras antes de añadir <code>et al.</code>:
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
                      <div>
                        <span className="text-slate-500 font-sans block">
                          Obra 1 (Kapoor, Bloom, Montez, Warner y Hill, 2017):
                        </span>
                        <span className="bg-violet-100/80 px-1.5 py-0.5 rounded font-semibold text-violet-950">
                          Kapoor, Bloom, Montez et al. (2017)
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-2">
                        <span className="text-slate-500 font-sans block">
                          Obra 2 (Kapoor, Bloom, Zucker, Tang et al., 2017):
                        </span>
                        <span className="bg-violet-100/80 px-1.5 py-0.5 rounded font-semibold text-violet-950">
                          Kapoor, Bloom, Zucker et al. (2017)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Las 9 Situaciones Especiales de Citación */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-base font-bold text-violet-950">
                      3.4 Las 9 Situaciones Especiales de Citación
                    </h5>
                    <span className="text-xs font-medium text-violet-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      Todas disponibles en el Gestor Cita Master
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SPECIAL_CITATION_CASES.map((sc) => (
                      <div
                        key={sc.number}
                        className="p-4 rounded-xl bg-white border border-emerald-200/90 hover:border-violet-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                      >
                        <div className="space-y-1.5">
                          <span className="inline-block font-bold text-xs text-violet-900 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                            {sc.number}
                          </span>
                          <h6 className="text-sm font-bold text-slate-900">{sc.title}</h6>
                          <p className="text-xs text-slate-600 leading-relaxed">{sc.rule}</p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                          <div>
                            <strong className="font-sans text-violet-800">Narrativa:</strong>{' '}
                            {sc.exampleNar}
                          </div>
                          <div>
                            <strong className="font-sans text-emerald-800">Parentética:</strong>{' '}
                            {sc.examplePar}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3.5 Citas que NO requieren referencia */}
                <div className="p-5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-950">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                    <h5 className="text-base font-bold">
                      3.5 Citas que NO Requieren Referencia en el Listado Final
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                      <div className="text-xs font-bold text-amber-900">
                        3.5.1 Cita textual del discurso de participantes en la investigación propia
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cuando se retoman fragmentos del discurso de participantes de una
                        investigación propia, se sigue el formato general en el texto con un
                        seudónimo para proteger la confidencialidad, sin incluir entrada en las
                        referencias.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                        • Al respecto, “Juan” planteó que esta experiencia “fue incómoda, pues los
                        facilitadores del trabajo no tuvieron en cuenta las expectativas de la
                        comunidad”.
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                      <div className="text-xs font-bold text-amber-900">
                        3.5.2 Cita de comunicación personal
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Incluye entrevistas personales, llamadas, mensajes, correos, seminarios no
                        grabados, discursos en vivo, cartas y tradición oral o de los pueblos
                        indígenas no documentada. Se indica inicial del nombre, apellido y fecha:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                        • M. González (comunicación personal, 17 de mayo, 2020)...
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================================================
                SLIDE 4: ¿QUÉ ES UNA REFERENCIA BIBLIOGRÁFICA?
                (Incluye definición, sangría francesa, diferencia entre Referencias
                 y Bibliografía, variación por número de autores y Catálogo de 23 ejemplos)
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 3) && (
              <section
                className={`p-5 sm:p-7 rounded-2xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-6 transition-all ${
                  viewMode === 'list' ? 'mt-8' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-4">
                  <div>
                    <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                      Módulo 4 · Lista Final de Referencias y Catálogo por Categoría
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                      4. ¿Qué es una Referencia Bibliográfica y cómo varía según los autores?
                    </h4>
                  </div>
                  <span className="text-xs text-violet-800 font-semibold bg-white px-3 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
                    Orden alfabético y Sangría Francesa (1.27 cm)
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  Una <strong>referencia bibliográfica</strong> es la descripción completa y
                  detallada de cada fuente citada en el trabajo. Se ubica al final del documento bajo
                  el título centrado y en negrita <strong>&ldquo;Referencias&rdquo;</strong>, con
                  interlineado doble (2.0) y <strong>sangría francesa de 1.27 cm</strong>, para que
                  cualquier lector pueda localizar y verificar el recurso original.
                </p>

                {/* Diferencia entre Referencias y Bibliografía + Variación por Número de Autores */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-blue-200 space-y-3 shadow-2xs">
                    <h5 className="text-sm sm:text-base font-bold text-violet-950">
                      ¿Cuál es la diferencia entre Referencias y Bibliografía?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      En la lista de <strong>Referencias</strong>, el autor incluye{' '}
                      <strong>solo aquellas fuentes que utilizó y citó de forma explícita</strong>{' '}
                      en su trabajo, mientras que en la <strong>Bibliografía</strong> se integran
                      obras que sirvieron de fundamento general pero que no se citaron en el texto.
                    </p>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-violet-900">Regla de oro en APA 7.ª:</div>
                      <div>
                        ✓ Todos los autores citados en el cuerpo de un texto deben coincidir con la
                        lista de referencias final.
                      </div>
                      <div>
                        ✓ Nunca debe referenciarse un autor que no haya sido citado en el texto.
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-blue-200 space-y-3 shadow-2xs">
                    <h5 className="text-sm sm:text-base font-bold text-violet-950">
                      4.2 Variación en la Referencia de acuerdo con el Número de Autores
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-violet-900 text-white">
                          <tr>
                            <th className="p-2.5 font-semibold">Número de autores</th>
                            <th className="p-2.5 font-semibold">
                              Formato en la Lista de Referencias
                            </th>
                            <th className="p-2.5 font-semibold">Ejemplo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr>
                            <td className="p-2.5 font-semibold text-violet-950">Un autor</td>
                            <td className="p-2.5 text-slate-600">
                              Apellido del autor, seguido de la inicial del nombre.
                            </td>
                            <td className="p-2.5 font-mono text-slate-800">López-Gómez, V.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold text-violet-950">
                              Dos a veinte autores
                            </td>
                            <td className="p-2.5 text-slate-600">
                              Se mencionan todos los apellidos e iniciales. El último se une con “y”
                              en español o con “&amp;” en fuentes en inglés.
                            </td>
                            <td className="p-2.5 font-mono text-slate-800">
                              González, J., González, A. y Ramos, F.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold text-violet-950">
                              Más de veinte autores
                            </td>
                            <td className="p-2.5 text-slate-600">
                              Se incluyen los <strong>primeros 19 autores</strong>, seguidos de tres
                              puntos suspensivos (<code>...</code>) y el último autor.
                            </td>
                            <td className="p-2.5 font-mono text-slate-800">
                              Autor 1, A., ... Autor 25, Z.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold text-violet-950">Sin autor</td>
                            <td className="p-2.5 text-slate-600">
                              Se inicia directamente con el título de la obra.
                            </td>
                            <td className="p-2.5 font-mono text-slate-800">
                              <i>Informe anual de educación.</i> (2020).
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Catálogo Interactivo de los 23 Ejemplos de Referencias */}
                {renderReferencesCatalog()}
              </section>
            )}

            {/* =====================================================================
                SLIDE 5: ¿DE QUÉ PARTES SE COMPONE UNA REFERENCIA BIBLIOGRÁFICA?
                (Incluye los 4 elementos interactivos: ¿Quién?, ¿Cuándo?, ¿Qué?,
                 ¿Dónde?, el visualizador anatómico en vivo y ejemplos modelo)
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 4) && (
              <section
                className={`p-5 sm:p-7 rounded-2xl bg-[#FAF5FF] border border-[#F3E8FF] space-y-6 transition-all ${
                  viewMode === 'list' ? 'mt-8' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-200 pb-4">
                  <div>
                    <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                      Módulo 5 · Estructura Anatómica de una Referencia
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                      5. ¿De qué partes se compone una referencia bibliográfica?
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Toda referencia responde a 4 preguntas esenciales. Haz clic en cada tarjeta
                      para resaltar su posición exacta:
                    </p>
                  </div>
                  {activePart !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setActivePart('all')}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline self-start sm:self-auto"
                    >
                      Mostrar todas las partes
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setActivePart(activePart === 'who' ? 'all' : 'who')}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      activePart === 'who'
                        ? 'bg-violet-900 text-white border-violet-900 shadow-sm'
                        : 'bg-white text-slate-900 border-violet-200 hover:border-violet-400'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        activePart === 'who' ? 'text-violet-200' : 'text-violet-700'
                      }`}
                    >
                      01. ¿Quién?
                    </div>
                    <div className="font-bold text-sm mb-1">Autor o Responsable</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        activePart === 'who' ? 'text-violet-100' : 'text-slate-600'
                      }`}
                    >
                      Persona, grupo de investigadores, entidad gubernamental o empresa creadora
                      (ej. OpenAI).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePart(activePart === 'when' ? 'all' : 'when')}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      activePart === 'when'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-900 border-violet-200 hover:border-violet-400'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        activePart === 'when' ? 'text-emerald-200' : 'text-emerald-700'
                      }`}
                    >
                      02. ¿Cuándo?
                    </div>
                    <div className="font-bold text-sm mb-1">Fecha de Publicación</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        activePart === 'when' ? 'text-emerald-100' : 'text-slate-600'
                      }`}
                    >
                      Año entre paréntesis (2024), fecha exacta (2020, 2 de enero) o “s.f.” si no
                      tiene fecha.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePart(activePart === 'what' ? 'all' : 'what')}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      activePart === 'what'
                        ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                        : 'bg-white text-slate-900 border-violet-200 hover:border-violet-400'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        activePart === 'what' ? 'text-amber-200' : 'text-amber-700'
                      }`}
                    >
                      03. ¿Qué?
                    </div>
                    <div className="font-bold text-sm mb-1">Título del Recurso</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        activePart === 'what' ? 'text-amber-100' : 'text-slate-600'
                      }`}
                    >
                      Nombre de la obra en cursiva o del artículo, más descripción entre corchetes
                      si aplica.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePart(activePart === 'where' ? 'all' : 'where')}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      activePart === 'where'
                        ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                        : 'bg-white text-slate-900 border-violet-200 hover:border-violet-400'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        activePart === 'where' ? 'text-sky-200' : 'text-sky-700'
                      }`}
                    >
                      04. ¿Dónde?
                    </div>
                    <div className="font-bold text-sm mb-1">Fuente o Ubicación</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        activePart === 'where' ? 'text-sky-100' : 'text-slate-600'
                      }`}
                    >
                      Editorial, nombre de la revista científica, volumen, páginas, código DOI o URL
                      directa.
                    </p>
                  </button>
                </div>

                {/* Visualizador Anatómico en Vivo */}
                <div className="bg-white p-5 rounded-xl border border-violet-200 space-y-2 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">
                    Anatomía de la referencia (haz clic en las tarjetas superiores para resaltar):
                  </div>
                  <div className="font-mono text-xs sm:text-sm leading-relaxed hanging-indent break-words">
                    <span
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        activePart === 'all' || activePart === 'who'
                          ? 'bg-violet-100 text-violet-950 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      Gómez, R. y Silva, M.
                    </span>{' '}
                    <span
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        activePart === 'all' || activePart === 'when'
                          ? 'bg-emerald-100 text-emerald-950 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      (2024).
                    </span>{' '}
                    <span
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        activePart === 'all' || activePart === 'what'
                          ? 'bg-amber-100 text-amber-950 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      Impacto de la inteligencia artificial en el aula escolar.
                    </span>{' '}
                    <span
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        activePart === 'all' || activePart === 'where'
                          ? 'bg-sky-100 text-sky-950 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      <i>Revista Digital de Educación</i>, <i>12</i>(3), 45-58.
                      https://doi.org/10.1016/j.rdep.2024.03
                    </span>
                  </div>
                </div>

                {/* 3 Modelos Prácticos Listos para Usar (IA, Artículo y Libro) */}
                <div className="space-y-3 pt-1">
                  <h5 className="text-base font-bold text-violet-950">
                    Ejemplos Prácticos de las 4 Partes en Distintas Fuentes
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-violet-200 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-violet-700">
                          Fuente Generativa · IA
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                          OpenAI. (2024). <i>ChatGPT</i> (Versión GPT-4) [Modelo de lenguaje
                          grande]. https://chatgpt.com
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToGestor('ai', 'apa7')}
                        className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        Probar ejemplo de IA en el Gestor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-violet-200 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-emerald-700">
                          Publicación Periódica · Artículo
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                          Hoyos-Hernández, P., Sanabria, J., Orcasita, L., Valenzuela, A., González,
                          M. y Osorio, T. (2019). Representaciones sociales asociadas al VIH/Sida en
                          universitarios colombianos. <i>Saúde e Sociedade</i>, <i>28</i>(2),
                          227-238. https://doi.org/10.1590/s0104-12902019180586
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToGestor('article', 'apa7')}
                        className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        Probar Artículo en el Gestor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-violet-200 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-700">
                          Obra Monográfica · Libro
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                          Ramírez Osorio, L. S. y López Gil, K. S. (2018).{' '}
                          <i>Orientar la escritura a través del currículo en la universidad</i>.
                          Sello Editorial Javeriano.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToGestor('book', 'apa7')}
                        className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        Probar Libro en el Gestor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================================================
                SLIDE 6: TABLA DE TÉRMINOS ACADÉMICOS ESENCIALES E IDENTIFICADORES DIGITALES
               ===================================================================== */}
            {(viewMode === 'list' || currentSlide === 5) && (
              <section
                className={`p-5 sm:p-7 rounded-2xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-6 transition-all ${
                  viewMode === 'list' ? 'mt-8' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-violet-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                        Módulo 6 · Identificación Internacional de Recursos
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-violet-950 mt-0.5">
                        6. Tabla de Términos Académicos Esenciales e Identificadores Digitales
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs text-violet-800 font-semibold bg-white px-3 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
                    DOI · ISBN · ISSN · URL / URI · Abreviaturas
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  En la investigación académica contemporánea, los libros, revistas y documentos en
                  línea cuentan con códigos estandarizados internacionalmente que garantizan su
                  localización exacta y evitan confusiones entre obras con títulos similares:
                </p>

                {/* Tabla estructurada de Identificadores de Recursos Digitales e Impresos */}
                <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-violet-950 text-white">
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">
                          Término / Sigla
                        </th>
                        <th className="py-3 px-4 font-semibold">Significado Completo</th>
                        <th className="py-3 px-4 font-semibold">
                          Función en la Identificación de Recursos
                        </th>
                        <th className="py-3 px-4 font-semibold">Uso en la Referencia (APA 7.ª)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-900 whitespace-nowrap">
                          DOI
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">
                            Digital Object Identifier
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            (Identificador de Objeto Digital)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 leading-relaxed">
                          Código alfanumérico único y <strong>permanente</strong> asignado a
                          artículos científicos, capítulos, ponencias y libros digitales. A
                          diferencia de un enlace web normal, el DOI nunca caduca aunque el artículo
                          cambie de servidor o revista.
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block text-xs text-slate-600 mb-1">
                            Se incluye siempre al final como enlace completo sin punto final:
                          </span>
                          <code className="font-mono text-xs text-violet-800 bg-violet-50 px-1.5 py-0.5 rounded">
                            https://doi.org/10.1016/j.rdep.2024.03
                          </code>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-900 whitespace-nowrap">
                          URL / URI
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">
                            Uniform Resource Locator / Identifier
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            (Localizador / Identificador Uniforme de Recursos)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 leading-relaxed">
                          La <strong>URI</strong> es el estándar general que identifica un recurso
                          en la red, y la <strong>URL</strong> es la dirección web específica que
                          indica dónde se encuentra alojada una página, informe o herramienta de IA
                          en internet.
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block text-xs text-slate-600 mb-1">
                            Se coloca directamente cuando el recurso no tiene DOI (sin escribir
                            “Recuperado de”):
                          </span>
                          <code className="font-mono text-xs text-violet-800 bg-violet-50 px-1.5 py-0.5 rounded">
                            https://www.unesco.org/es
                          </code>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-900 whitespace-nowrap">
                          ISBN
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">
                            International Standard Book Number
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            (Número Estándar Internacional de Libros)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 leading-relaxed">
                          Código numérico comercial de 13 dígitos (antes 10) que identifica de
                          manera exclusiva cada edición y formato (impreso, PDF, ePub) de un{' '}
                          <strong>libro o monografía</strong> a nivel mundial.
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block text-xs text-slate-600 mb-1">
                            No se escribe en la referencia APA, pero permite identificar e importar
                            el libro con precisión:
                          </span>
                          <code className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            ISBN: 978-968-24-3688-8
                          </code>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-900 whitespace-nowrap">
                          ISSN / e-ISSN
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">
                            International Standard Serial Number
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            (Número Internacional Normalizado de Publicaciones Seriadas)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 leading-relaxed">
                          Código de 8 dígitos (dos grupos de cuatro separados por guion) que
                          identifica{' '}
                          <strong>revistas científicas, periódicos y publicaciones seriadas</strong>{' '}
                          tanto impresas (ISSN) como electrónicas (e-ISSN).
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block text-xs text-slate-600 mb-1">
                            Valida que una revista sea académica o indexada (en APA se prioriza el
                            DOI del artículo):
                          </span>
                          <code className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            ISSN: 2027-8306
                          </code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Abreviaturas frecuentes en citación */}
                <div className="bg-white p-5 rounded-xl border border-blue-100 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-violet-700" />
                    <h5 className="text-sm sm:text-base font-semibold text-slate-900">
                      Abreviaturas Bibliográficas Frecuentes en Citas y Referencias
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="font-mono text-violet-900 block mb-1">
                        s. f. (sin fecha)
                      </strong>
                      Se emplea entre paréntesis <code>(s. f.)</code> cuando la página web o
                      documento no registra año de publicación.
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="font-mono text-violet-900 block mb-1">
                        p. / pp. (páginas)
                      </strong>
                      Se usa <code>p.</code> para una página única (<code>p. 45</code>) y{' '}
                      <code>pp.</code> para un rango de varias páginas (<code>pp. 45-58</code>).
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="font-mono text-violet-900 block mb-1">
                        párr. (párrafo)
                      </strong>
                      En fuentes digitales sin paginación fija se indica el número de párrafo:{' '}
                      <code>(UNESCO, 2025, párr. 4)</code>.
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="font-mono text-violet-900 block mb-1">
                        et al. (y otros)
                      </strong>
                      Locución latina usada al citar obras de 3 o más autores desde la primera
                      mención: <code>(Gómez et al., 2024)</code>.
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Barra Inferior de Navegación del Slide con Flechas y Puntos (6 Slides) */}
          {viewMode === 'slides' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-800 hover:text-violet-900 border border-slate-200 hover:border-violet-300 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4 text-violet-700" />
                <span>
                  Anterior:{' '}
                  {SLIDE_METADATA[(currentSlide - 1 + totalSlides) % totalSlides].shortTitle}
                </span>
              </button>

              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Indicadores de diapositiva"
              >
                {SLIDE_METADATA.map((s) => (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() => setCurrentSlide(s.index)}
                    aria-label={`Ir a ${s.title}`}
                    className={`h-2.5 rounded-full transition-all ${
                      currentSlide === s.index
                        ? 'w-8 bg-violet-700'
                        : 'w-2.5 bg-slate-300 hover:bg-violet-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextSlide}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>
                  Siguiente: {SLIDE_METADATA[(currentSlide + 1) % totalSlides].shortTitle}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FUENTES CONSULTADAS Y REFERENCIAS DE APOYO INSTITUCIONAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8">
        <section className="p-5 sm:p-6 rounded-xl bg-[#FAF5FF] border border-[#F3E8FF] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-700" />
              <h4 className="text-base font-semibold text-violet-950">
                Fuentes Consultadas y Referencias de Apoyo Institucional
              </h4>
            </div>
            <span className="text-xs text-violet-800 font-medium">
              Formato estricto APA 7.ª edición · Orden alfabético
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-violet-100 space-y-3 text-xs sm:text-sm font-mono text-slate-800">
            <div className="hanging-indent">
              Ascolbi. (2016).{' '}
              <i>
                Las bibliotecas y su aporte a la integridad académica y científica institucional
              </i>
              . Asociación Colombiana de Bibliotecólogos y Documentalistas.{' '}
              <a
                href="https://www.ascolbi.org/publicaciones/blog/bibliotecas-aporte-integridad-academica-cientifica-institucional"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://www.ascolbi.org/publicaciones/blog/bibliotecas-aporte-integridad-academica-cientifica-institucional
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div className="hanging-indent">
              Cabrera, L. (2017). <i>La probidad académica</i> [Presentación de diapositivas].
              SlideShare.{' '}
              <a
                href="https://es.slideshare.net/leonelacarmen/la-probidad-acadmica"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://es.slideshare.net/leonelacarmen/la-probidad-acadmica
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div className="hanging-indent">
              Centro de Escritura Javeriano. (2020). <i>Normas APA, séptima edición</i>. Pontificia
              Universidad Javeriana, seccional Cali.{' '}
              <a
                href="https://www2.javerianacali.edu.co/centro-escritura/recursos/manual-de-normas-apa-septima-edicion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://www2.javerianacali.edu.co/centro-escritura/recursos/manual-de-normas-apa-septima-edicion
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div className="hanging-indent">
              OpenAI. (2024). <i>ChatGPT</i> (Versión del 14 de marzo) [Modelo de lenguaje grande].{' '}
              <a
                href="https://chat.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://chat.openai.com
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div className="hanging-indent">
              Turnitin. (2022). <i>Los 12 tipos de trabajos no originales más comunes</i>{' '}
              [Infografía].{' '}
              <a
                href="https://turnitin.com/es/infographics/prevencion-de-plagio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://turnitin.com/es/infographics/prevencion-de-plagio
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div className="hanging-indent">
              Universidad Nacional de Colombia [UNAL]. (2014). <i>Derechos de autor</i>. Dirección
              Nacional de Bibliotecas - Propiedad Intelectual.{' '}
              <a
                href="https://propiedadintelectual.unal.edu.co/acerca-de/derechos-de-autor/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 hover:underline inline-flex items-center gap-1 break-all"
              >
                https://propiedadintelectual.unal.edu.co/acerca-de/derechos-de-autor/
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
