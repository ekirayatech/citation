import React, { useState } from 'react';
import { BookOpen, ArrowRight, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { CitationStyle, SourceType } from '../types/citation';

interface TeoriaSectionProps {
  onNavigateToGestor: (presetType?: SourceType, presetStyle?: CitationStyle) => void;
  onNavigateToTaller: () => void;
}

export const TeoriaSection: React.FC<TeoriaSectionProps> = ({
  onNavigateToGestor,
  onNavigateToTaller,
}) => {
  const [activePart, setActivePart] = useState<'all' | 'who' | 'when' | 'what' | 'where'>('all');
  const [selectedNormStyle, setSelectedNormStyle] = useState<CitationStyle>('apa7');

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

  return (
    <div className="space-y-8">
      {/* Banner Institucional de Presentación */}
      <div className="bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] text-white rounded-2xl p-6 sm:p-10 border border-violet-800/40 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-xs text-violet-200 font-medium">
            <span>Colegio Ekirayá Educación Montessori</span>
            <span aria-hidden="true">·</span>
            <span>Guía Teórica y Portal de Investigación</span>
          </div>
          <h2
            className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Fundamentos de Citación, Probidad Académica y Referencias
          </h2>
          <p className="text-violet-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
            Comprende la estructura rigurosa de una cita y una referencia bibliográfica según los
            estándares internacionales (APA 7.ª, MLA 9.ª, Chicago 17.ª e Icontec), el uso ético de
            herramientas de Inteligencia Artificial y pon a prueba tus conocimientos.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToGestor()}
              className="px-5 py-2.5 bg-white text-violet-950 hover:bg-violet-50 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-violet-700" />
              Abrir Gestor Cita Master
            </button>
            <button
              type="button"
              onClick={onNavigateToTaller}
              className="px-5 py-2.5 bg-violet-800/60 hover:bg-violet-800 text-white border border-violet-500/40 font-medium text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Ir al Taller y Test Evaluativo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de la Guía Teórica */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="text-xs font-medium text-violet-700 mb-1">
            01. Principios Institucionales y Ética Investigativa
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Guía Teórica y Configuración de Referencias
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Todo trabajo académico en el Colegio Ekirayá se fundamenta en el respeto intelectual y
            la trazabilidad de las fuentes consultadas.
          </p>
        </div>

        {/* RECUADRO 1: PROBIDAD ACADÉMICA */}
        <section className="p-5 sm:p-6 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-4">
          <h4 className="text-base sm:text-lg font-semibold text-violet-950">
            Probidad Académica y Respeto por los Derechos de Autor
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            En el <strong>Colegio Ekirayá Bilingüe</strong>, la <strong>probidad académica</strong>{' '}
            es un principio ético fundamental que promueve la honestidad personal, el rigor
            científico y la responsabilidad en el aprendizaje. Implica dar crédito oportuno y
            explícito a las fuentes originales de información, ideas, imágenes, datos o códigos
            utilizados en cualquier proyecto o ensayo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="text-sm font-semibold text-slate-900 mb-1">Derecho de Autor</div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Protección legal y moral que otorga a los creadores la propiedad sobre sus obras
                intelectuales (libros, artículos, fotografías, software). Utilizar su trabajo sin
                citarlo constituye una falta a la ética académica y plagio.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="text-sm font-semibold text-slate-900 mb-1">
                Uso Ético de la Inteligencia Artificial
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Al emplear modelos generativos (como ChatGPT, Gemini o Claude) para estructurar
                ideas o consultar conceptos, la probidad académica exige declarar su uso, indicar
                el prompt empleado e incluir la cita y referencia correspondiente.
              </p>
            </div>
          </div>
        </section>

        {/* RECUADRO 2: ¿QUÉ ES UNA CITA BIBLIOGRÁFICA? */}
        <section className="p-5 sm:p-6 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-base sm:text-lg font-semibold text-emerald-950">
              ¿Qué es una Cita Bibliográfica?
            </h4>
            <span className="text-xs text-emerald-800 font-medium">
              Se inserta dentro del párrafo del texto
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Una <strong>cita bibliográfica</strong> es una mención abreviada que se inserta{' '}
            <strong>dentro del texto del documento</strong> cada vez que se utiliza una idea, frase
            literal, dato estadístico o concepto proveniente de otro autor o fuente (incluyendo IA).
            Su propósito es otorgar el crédito académico en el lugar exacto de uso y remitir al
            lector a la lista de referencias al final del trabajo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-1">
                  Modalidad 1 · Énfasis en la idea
                </div>
                <h5 className="text-base font-semibold text-slate-900 mb-1.5">Cita Parentética</h5>
                <p className="text-xs sm:text-sm text-slate-600">
                  Los datos del autor, año y página van entre paréntesis al final de la idea o frase
                  citada, antes del punto final.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed">
                "La mente del niño absorbe el entorno activamente"{' '}
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                  (Montessori, 2019, p. 45)
                </span>
                .
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-1">
                  Modalidad 2 · Énfasis en el autor
                </div>
                <h5 className="text-base font-semibold text-slate-900 mb-1.5">Cita Narrativa</h5>
                <p className="text-xs sm:text-sm text-slate-600">
                  El apellido del autor se incorpora directamente en la redacción de la oración,
                  seguido del año entre paréntesis.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed">
                Según{' '}
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                  Montessori (2019, p. 45)
                </span>
                , la mente del niño absorbe el entorno activamente.
              </div>
            </div>
          </div>

          {/* Nota pedagógica adicional sobre cita directa vs paráfrasis */}
          <div className="bg-white/90 p-4 rounded-lg border border-emerald-200/60 text-xs sm:text-sm text-slate-700 flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <strong className="text-slate-900">Cita Textual (Literal):</strong> Copia exacta de
              las palabras del autor. Lleva comillas si tiene menos de 40 palabras y{' '}
              <strong>siempre exige número de página (p. o pp.)</strong>.
            </div>
            <div className="sm:border-l sm:border-emerald-200 sm:pl-4">
              <strong className="text-slate-900">Cita Parafraseada:</strong> Explicación de la idea
              del autor con tus propias palabras. Exige autor y año, sin comillas.
            </div>
          </div>
        </section>

        {/* RECUADRO 3: ¿QUÉ ES UNA REFERENCIA BIBLIOGRÁFICA? */}
        <section className="p-5 sm:p-6 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-base sm:text-lg font-semibold text-violet-950">
              ¿Qué es una Referencia Bibliográfica?
            </h4>
            <span className="text-xs text-violet-800 font-medium">
              Se ubica al final del documento en orden alfabético
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Una <strong>referencia bibliográfica</strong> es la descripción completa y detallada de
            cada fuente citada en el trabajo. Se ubica al final del documento bajo el título{' '}
            <strong>"Referencias"</strong> y proporciona todos los metadatos necesarios (autor,
            fecha, título y fuente o enlace) para que cualquier lector o docente pueda localizar y
            verificar el recurso original.
          </p>
          <div className="bg-white p-5 rounded-lg border border-blue-100 space-y-2">
            <div className="text-xs font-semibold text-violet-700">
              Formato estándar con Sangría Francesa (APA 7.ª edición):
            </div>
            <p className="text-xs text-slate-600">
              Se organiza alfabéticamente por el apellido del primer autor y se aplica{' '}
              <strong>sangría francesa</strong> (la primera línea comienza en el margen izquierdo y
              las líneas siguientes llevan sangría de 1.27 cm):
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 hanging-indent">
              Montessori, M. (2019). <i>La mente absorbente del niño</i> (2.ª ed.). Editorial
              Trillas. https://doi.org/10.xxxx/ejemplo-educativo
            </div>
          </div>
        </section>

        {/* RECUADRO 4: LAS 4 PARTES DE UNA REFERENCIA (INTERACTIVO) */}
        <section className="p-5 sm:p-6 rounded-xl bg-[#FAF5FF] border border-[#F3E8FF] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-violet-950">
                ¿De qué partes se compone una referencia bibliográfica?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Haz clic en cada una de las 4 preguntas fundamentales para explorar su función
                dentro de la referencia:
              </p>
            </div>
            {activePart !== 'all' && (
              <button
                type="button"
                onClick={() => setActivePart('all')}
                className="text-xs font-medium text-violet-700 hover:text-violet-900 underline self-start sm:self-auto"
              >
                Mostrar todas las partes
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActivePart(activePart === 'who' ? 'all' : 'who')}
              className={`text-left p-4 rounded-lg border transition-all ${
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
              <div className="font-semibold text-sm mb-1">Autor o Creador</div>
              <p
                className={`text-xs leading-relaxed ${
                  activePart === 'who' ? 'text-violet-100' : 'text-slate-600'
                }`}
              >
                Persona, grupo de investigadores, institución o empresa creadora (ej. OpenAI).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActivePart(activePart === 'when' ? 'all' : 'when')}
              className={`text-left p-4 rounded-lg border transition-all ${
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
              <div className="font-semibold text-sm mb-1">Fecha de Publicación</div>
              <p
                className={`text-xs leading-relaxed ${
                  activePart === 'when' ? 'text-emerald-100' : 'text-slate-600'
                }`}
              >
                Año entre paréntesis (2024) o "s. f." (sin fecha) si no está disponible.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActivePart(activePart === 'what' ? 'all' : 'what')}
              className={`text-left p-4 rounded-lg border transition-all ${
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
              <div className="font-semibold text-sm mb-1">Título del Recurso</div>
              <p
                className={`text-xs leading-relaxed ${
                  activePart === 'what' ? 'text-amber-100' : 'text-slate-600'
                }`}
              >
                Nombre de la obra en cursiva o del artículo, más descripción entre corchetes si
                aplica.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActivePart(activePart === 'where' ? 'all' : 'where')}
              className={`text-left p-4 rounded-lg border transition-all ${
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
              <div className="font-semibold text-sm mb-1">Fuente o Ubicación</div>
              <p
                className={`text-xs leading-relaxed ${
                  activePart === 'where' ? 'text-sky-100' : 'text-slate-600'
                }`}
              >
                Editorial, nombre de la revista científica, DOI o dirección URL directa.
              </p>
            </button>
          </div>

          {/* Visualizador Anatómico en Vivo */}
          <div className="bg-white p-4 rounded-lg border border-violet-200">
            <div className="text-xs text-slate-500 mb-2 font-medium">
              Anatomía de la referencia (pasa o haz clic en las tarjetas superiores):
            </div>
            <div className="font-mono text-xs sm:text-sm leading-relaxed hanging-indent">
              <span
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  activePart === 'all' || activePart === 'who'
                    ? 'bg-violet-100 text-violet-950 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                Gómez, R., &amp; Silva, M.
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
        </section>

        {/* SECCIÓN 5: GUÍAS DE NORMAS INTERNACIONALES (COMPARADOR INTERACTIVO DE FILE 1) */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="text-xs font-medium text-violet-700">
                02. Estándares Internacionales en Cita Master
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                Comparador de Guías de Normas Académicas
              </h4>
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

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="text-base font-semibold text-slate-900">{currentNorm.name}</h5>
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

            <p className="text-sm text-slate-700 leading-relaxed">{currentNorm.description}</p>

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
        </section>

        {/* SECCIÓN 6: EJEMPLOS PRÁCTICOS COMPLETOS */}
        <section className="space-y-4 pt-2">
          <div className="border-b border-slate-200 pb-3">
            <div className="text-xs font-medium text-violet-700">
              03. Modelos Listos para Usar
            </div>
            <h4 className="text-lg font-semibold text-slate-900">
              Ejemplos Prácticos Completos (Norma APA 7.ª)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Ejemplo IA */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-violet-700">Fuente Generativa</div>
                  <h5 className="text-base font-semibold text-slate-900">
                    Inteligencia Artificial
                  </h5>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div>
                    <strong className="text-slate-900">Parentética:</strong>{' '}
                    <span className="font-mono text-slate-700">(OpenAI, 2024)</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Narrativa:</strong>{' '}
                    <span className="font-mono text-slate-700">Según OpenAI (2024)...</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                  OpenAI. (2024). <i>ChatGPT</i> (Versión GPT-4) [Modelo de lenguaje grande].
                  https://chatgpt.com
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToGestor('ai', 'apa7')}
                className="w-full py-2 px-3 bg-white hover:bg-violet-50 text-violet-800 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Cargar ejemplo de IA en el Gestor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ejemplo Artículo Científico */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-emerald-700">Publicación Periódica</div>
                  <h5 className="text-base font-semibold text-slate-900">Artículo Científico</h5>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div>
                    <strong className="text-slate-900">Parentética:</strong>{' '}
                    <span className="font-mono text-slate-700">(Gómez &amp; Silva, 2024)</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Narrativa:</strong>{' '}
                    <span className="font-mono text-slate-700">Gómez y Silva (2024)...</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                  Gómez, R., &amp; Silva, M. (2024). Impacto de la IA en el aprendizaje escolar.{' '}
                  <i>Revista Digital de Educación</i>, <i>12</i>(3), 45-58.
                  https://doi.org/10.1016/j.rdep.2024.03.004
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToGestor('article', 'apa7')}
                className="w-full py-2 px-3 bg-white hover:bg-violet-50 text-violet-800 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Cargar ejemplo de Artículo en el Gestor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ejemplo Libro */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-slate-600">Obra Monográfica</div>
                  <h5 className="text-base font-semibold text-slate-900">
                    Libro Impreso o Digital
                  </h5>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div>
                    <strong className="text-slate-900">Parentética:</strong>{' '}
                    <span className="font-mono text-slate-700">(Montessori, 2019, p. 45)</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Narrativa:</strong>{' '}
                    <span className="font-mono text-slate-700">Montessori (2019, p. 45)...</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 hanging-indent">
                  Montessori, M. (2019). <i>La mente absorbente del niño</i> (2.ª ed.). Editorial
                  Trillas.
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToGestor('book', 'apa7')}
                className="w-full py-2 px-3 bg-white hover:bg-violet-50 text-violet-800 border border-violet-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Cargar ejemplo de Libro en el Gestor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* RECUADRO 5: FUENTES CONSULTADAS Y REFERENCIAS DE APOYO */}
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
              Ascolbi. (2016). <i>Las bibliotecas y su aporte a la integridad académica y científica institucional</i>. Asociación Colombiana de Bibliotecólogos y Documentalistas.{' '}
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
              Cabrera, L. (2017). <i>La probidad académica</i> [Presentación de diapositivas]. SlideShare.{' '}
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
              Turnitin. (2022). <i>Los 12 tipos de trabajos no originales más comunes</i> [Infografía].{' '}
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
              Universidad Nacional de Colombia [UNAL]. (2014). <i>Derechos de autor</i>. Dirección Nacional de Bibliotecas - Propiedad Intelectual.{' '}
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
