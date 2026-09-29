import React, { useState } from 'react';
import {
  FileText,
  Table2,
  Quote,
  BookMarked,
  Globe2,
  CheckSquare,
  Square,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Scale,
  Video,
  Newspaper,
  GraduationCap,
} from 'lucide-react';
import { CitationFormData } from '../types/citation';
import {
  APA_DOCUMENT_EXAMPLES,
  generateCitationOutput,
  INITIAL_FORM_DATA,
  OfficialDocumentExample,
} from '../utils/citationEngine';

interface Apa2026SectionProps {
  onLoadExampleInGestor: (exampleData: Partial<CitationFormData>, label: string) => void;
  showToast: (msg: string) => void;
}

type SubModuleId =
  | 'formato'
  | 'tablas_figuras'
  | 'citas_especiales'
  | 'referencias_catalogo'
  | 'adaptaciones_es';

const CHECKLIST_ITEMS = [
  {
    id: 'chk-1',
    category: 'General (Tablas y Figuras)',
    text: 'Aportan información relevante que queda más clara en formato visual que en el texto.',
  },
  {
    id: 'chk-2',
    category: 'General (Tablas y Figuras)',
    text: 'Se etiquetan con números arábigos consecutivos en negrita (Tabla 1, Tabla 2... Figura 1, Figura 2...).',
  },
  {
    id: 'chk-3',
    category: 'General (Tablas y Figuras)',
    text: 'Se mencionan de forma explícita en la redacción de los párrafos (ej. "como se observa en la Tabla 1").',
  },
  {
    id: 'chk-4',
    category: 'General (Tablas y Figuras)',
    text: 'Incluyen un título corto pero descriptivo, alineado a la izquierda y en cursiva.',
  },
  {
    id: 'chk-5',
    category: 'General (Tablas y Figuras)',
    text: 'Las notas al pie siguen el orden: general, específica y de probabilidad, y atribuyen los créditos de autoría.',
  },
  {
    id: 'chk-6',
    category: 'Solo en las Tablas',
    text: 'Solo se marcan las líneas horizontales (sin bordes verticales) y los encabezados de columna van centrados.',
  },
  {
    id: 'chk-7',
    category: 'Solo en las Figuras',
    text: 'La imagen es de alta resolución, tiene los ejes etiquetados y usa fuente sin serifa entre 8 y 14 puntos.',
  },
];

const SPECIAL_CITATION_CASES = [
  {
    number: '3.4.1',
    page: 'Pág. 18',
    title: 'Cita de dos o más trabajos en el mismo paréntesis',
    rule: 'Se ordenan alfabéticamente según el orden de aparición en la lista de referencias y se separan con punto y coma (;).',
    exampleNar: 'Diversos estudios recientes coinciden en este fenómeno...',
    examplePar:
      'El cyberbullying es una nueva forma de acoso escolar (Cardozo, 2020; Chocarro y Garaigordobil, 2019; Gastesi y Salceda, 2019).',
  },
  {
    number: '3.4.2',
    page: 'Pág. 18',
    title: 'Varios trabajos de un mismo autor con igual fecha de publicación',
    rule: 'Se agregan letras minúsculas al año (a, b, c...) según el orden de aparición en el texto y en las referencias.',
    exampleNar: 'Douglas (2019a) plantea que... Esta definición es compartida por Douglas (2019b)...',
    examplePar: '(Douglas, 2019a, 2019b)',
  },
  {
    number: '3.4.3',
    page: 'Pág. 19',
    title: 'Cita del mismo autor con diferente año',
    rule: 'Se indica el apellido del autor y entre paréntesis los años del menos reciente al más reciente, separados por punto y coma (;).',
    exampleNar: 'Jodelet (1984; 1986)',
    examplePar: '(Jodelet, 1984; 1986)',
  },
  {
    number: '3.4.4',
    page: 'Pág. 19',
    title: 'Citas con diferentes autores que comparten el mismo apellido',
    rule: 'Se incluye la inicial del nombre de cada autor en la cita para diferenciarlos.',
    exampleNar: 'S. Freud (1921) y A. Freud (1960)',
    examplePar: '(S. Freud, 1921; A. Freud, 1960)',
  },
  {
    number: '3.4.5',
    page: 'Pág. 19',
    title: 'Citas de fuentes con distintas fechas, por reedición o traducción',
    rule: 'Se incluyen ambas fechas (año de publicación original / año de la traducción o reedición) separadas con barra oblicua (/).',
    exampleNar: 'Piaget (1966/2000)',
    examplePar: '(Piaget, 1966/2000)',
  },
  {
    number: '3.4.6',
    page: 'Pág. 20',
    title: 'Citas de publicaciones sin autor',
    rule: 'Se citan las primeras palabras del título y el año. Si es un artículo, capítulo o página web va entre comillas dobles; si es libro o informe va en cursiva. Si está firmada “Anónimo”, se usa ese término.',
    exampleNar: 'En el “Informe Anual” (2013) se destaca que...',
    examplePar:
      'Se evidencia que ha aumentado la defensa de los niños (“Informe Anual”, 2013). | (Anónimo, 2020).',
  },
  {
    number: '3.4.7',
    page: 'Pág. 20',
    title: 'Cita de publicaciones sin fecha',
    rule: 'Cuando no se indica el año o fecha de publicación del material, se incluye la abreviatura s.f. (“sin fecha”).',
    exampleNar:
      'Pulido (s.f.) afirma que el conocimiento concreto de la tarea garantiza una buena solución.',
    examplePar: '(Pulido, s.f.)',
  },
  {
    number: '3.4.8',
    page: 'Pág. 20',
    title: 'Cita textual de material sin paginación o audiovisual',
    rule: 'Se indica el número de párrafo con la abreviatura párr. (o sección). En obras audiovisuales se incluye la marca de tiempo.',
    exampleNar: 'Basu y Jones (2007) señalan un nuevo marco (párr. 4).',
    examplePar:
      '“Se sugiere un nuevo marco para considerar la naturaleza” (Basu y Jones, 2007, párr. 4). | Audiovisual: (Walley-Beckett, 2017, 25:36)',
  },
  {
    number: '3.4.9',
    page: 'Pág. 21',
    title: 'Cita de una cita (Fuente secundaria)',
    rule: 'Cuando se accede a una fuente a través de otra, se usa “como se citó en”. En la lista de referencias solo se incluye la fuente secundaria consultada.',
    exampleNar: 'Penrose (como se citó en Hawking, 2010) plantea que las matemáticas...',
    examplePar: '(Penrose, como se citó en Hawking, 2010)',
  },
];

export const Apa2026Section: React.FC<Apa2026SectionProps> = ({
  onLoadExampleInGestor,
  showToast,
}) => {
  const [activeSubModule, setActiveSubModule] = useState<SubModuleId>('formato');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'chk-1': true,
    'chk-2': true,
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
    showToast('Ejemplo copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredCatalog: OfficialDocumentExample[] = APA_DOCUMENT_EXAMPLES.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.formData.sourceType === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado Principal de la Pestaña Normas APA 2026 */}
      <div className="bg-gradient-to-r from-[#4C1D95] via-[#5B21B6] to-[#6D28D9] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <span>Manual Oficial APA 7.ª Edición · Vigencia Académica 2026</span>
              <span aria-hidden="true">·</span>
              <span>Síntesis Centro de Escritura Javeriano</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Normas APA 2026 — Guía Integral de Formato, Citas y Referencias
            </h1>
            <p className="text-violet-100 text-sm sm:text-base leading-relaxed">
              Consulta las reglas completas de presentación de documentos, niveles de títulos,
              tablas y figuras, los 9 casos especiales de citación (págs. 18–21), el catálogo
              completo de referencias (págs. 22–35) y las adaptaciones oficiales al español (pág.
              36).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-4 text-xs space-y-1.5 shrink-0">
            <div className="font-semibold text-white">Contenido del Manual Interactivo:</div>
            <div className="text-violet-100">• 1. Formato general, portada y 5 niveles de títulos</div>
            <div className="text-violet-100">• 2. Tablas, figuras y lista de chequeo interactiva</div>
            <div className="text-violet-100">• 3. Citas y situaciones especiales (págs. 12–21)</div>
            <div className="text-violet-100">• 4. Referencias y casos prácticos (págs. 22–35)</div>
            <div className="text-violet-100">• 5. Adaptaciones oficiales al español (pág. 36)</div>
          </div>
        </div>

        {/* Sub-navegación de los 5 Capítulos del Manual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-6 pt-5 border-t border-white/15">
          {[
            {
              id: 'formato' as SubModuleId,
              label: '1. Formato y Títulos',
              sub: 'Págs. 4–8',
              icon: FileText,
            },
            {
              id: 'tablas_figuras' as SubModuleId,
              label: '2. Tablas y Figuras',
              sub: 'Págs. 9–11',
              icon: Table2,
            },
            {
              id: 'citas_especiales' as SubModuleId,
              label: '3. Citas y Casos (Pág. 20+)',
              sub: 'Págs. 12–21',
              icon: Quote,
            },
            {
              id: 'referencias_catalogo' as SubModuleId,
              label: '4. Catálogo Referencias',
              sub: 'Págs. 22–35',
              icon: BookMarked,
            },
            {
              id: 'adaptaciones_es' as SubModuleId,
              label: '5. Adaptación Español',
              sub: 'Pág. 36',
              icon: Globe2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubModule(tab.id)}
                className={`p-3 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${
                  active
                    ? 'bg-white text-violet-950 border-white shadow-sm font-semibold'
                    : 'bg-violet-900/40 text-violet-100 border-violet-700/60 hover:bg-violet-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-violet-700' : 'text-violet-300'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs sm:text-sm truncate">{tab.label}</div>
                    <div
                      className={`text-[11px] ${
                        active ? 'text-violet-700' : 'text-violet-300'
                      }`}
                    >
                      {tab.sub}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAPÍTULO 1: FORMATO GENERAL DEL TRABAJO, PORTADA Y NIVELES DE TÍTULOS (PÁGS. 4-8) */}
      {activeSubModule === 'formato' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Sección 1 · Páginas 4 a 8 del Manual
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                1. Formato General del Trabajo Académico
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Pautas oficiales de papel, márgenes, fuentes tipográficas permitidas, abreviaturas,
                portada estudiantil y jerarquía de cinco niveles de títulos.
              </p>
            </div>

            {/* Cuadrícula de Especificaciones Técnicas (Pág. 4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="text-sm font-bold text-violet-950">
                  Papel, Márgenes y Alineación
                </h3>
                <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <li>
                    <strong>Papel:</strong> Tamaño carta (21.59 cm × 27.94 cm).
                  </li>
                  <li>
                    <strong>Márgenes:</strong> <strong>2,54 cm</strong> (1 pulgada) en los cuatro
                    lados (superior, inferior, izquierdo y derecho).
                  </li>
                  <li>
                    <strong>Alineación:</strong> A la izquierda, <strong>sin justificar</strong>.
                  </li>
                  <li>
                    <strong>Numeración:</strong> Extremo superior derecho, en números arábigos (1,
                    2, 3...).
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="text-sm font-bold text-violet-950">Espaciado y Sangrías</h3>
                <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <li>
                    <strong>Interlineado:</strong> Doble (<strong>2.0</strong>) en todo el
                    documento, sin espacio adicional entre párrafos.
                  </li>
                  <li>
                    <strong>Sangría de párrafo:</strong> En la primera línea de cada párrafo a{' '}
                    <strong>1.27 cm</strong> (0.5 pulgadas).
                  </li>
                  <li>
                    <strong>Sangría francesa:</strong> De <strong>1.27 cm</strong> en todas las
                    entradas de la lista de Referencias.
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="text-sm font-bold text-violet-950">
                  Fuentes y Tamaños Permitidos
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-violet-900">Con serifa (Serif):</span>
                    <ul className="list-disc list-inside text-slate-600 mt-0.5">
                      <li>Times New Roman: 12 puntos</li>
                      <li>Georgia: 11 puntos</li>
                      <li>Computer Modern: 10 puntos</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-violet-900">Sin serifa (Sans Serif):</span>
                    <ul className="list-disc list-inside text-slate-600 mt-0.5">
                      <li>Calibri: 11 puntos</li>
                      <li>Arial: 11 puntos</li>
                      <li>Lucida Sans Unicode: 10 puntos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Portada Estudiantil y Orden de los Elementos (Págs. 5-8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Maqueta visual de la Portada Estudiantil */}
              <div className="lg:col-span-6 p-5 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-violet-950">
                    1.2.1 Página de Presentación de Trabajos Estudiantiles (Pág. 5)
                  </h3>
                  <span className="text-[11px] font-semibold bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
                    Vista Previa de Portada
                  </span>
                </div>
                <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-xs text-center space-y-5 font-serif">
                  <div className="text-right text-xs font-sans text-slate-500">
                    1 <span className="text-[10px] text-violet-700">(Número de página)</span>
                  </div>
                  <div className="pt-2 space-y-1">
                    <div className="font-bold text-sm sm:text-base text-slate-900">
                      Educación inclusiva en Colombia
                    </div>
                    <div className="text-[11px] font-sans text-violet-700">
                      ↑ Título del trabajo (centrado y en negrita)
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs sm:text-sm text-slate-800">
                    <div>
                      María Vargas{' '}
                      <span className="text-[11px] font-sans text-slate-400">· Autor(a)</span>
                    </div>
                    <div>
                      Departamento de Educación, Colegio Ekirayá / Universidad{' '}
                      <span className="text-[11px] font-sans text-slate-400">· Afiliación</span>
                    </div>
                    <div>
                      Enfoques educativos II{' '}
                      <span className="text-[11px] font-sans text-slate-400">· Asignatura</span>
                    </div>
                    <div>
                      Dra. Sonia Aguirre{' '}
                      <span className="text-[11px] font-sans text-slate-400">· Profesor(a)</span>
                    </div>
                    <div>
                      25 de mayo de 2026{' '}
                      <span className="text-[11px] font-sans text-slate-400">· Fecha</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orden de los elementos y Abreviaturas */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-sm font-bold text-violet-950">
                    1.2 Orden de los Elementos del Trabajo (Págs. 5–8)
                  </h3>
                  <ol className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
                    <li>
                      <strong>Página de presentación</strong> (Portada estudiantil o profesional).
                    </li>
                    <li>
                      <strong>Resumen</strong> (Máx. 250 palabras, título centrado en negrita, sin
                      sangría) y <em>Palabras clave:</em> palabra 1, palabra 2, palabra 3.
                    </li>
                    <li>
                      <strong>Contenidos o cuerpo del texto</strong> (Estructura IMRD en artículos:
                      Introducción, Método, Resultado y Discusión).
                    </li>
                    <li>
                      <strong>Referencias</strong> (Listado alfabético con sangría francesa de 1.27
                      cm e interlineado 2.0).
                    </li>
                    <li>
                      <strong>Notas al pie, Tablas, Figuras y Anexos</strong> (etiquetados como
                      Anexo A, Anexo B...).
                    </li>
                  </ol>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-sm font-bold text-violet-950">
                    Abreviaturas Oficiales en Español (Pág. 4)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      ['Capítulo', 'cap.'],
                      ['Edición', 'ed.'],
                      ['Edición revisada', 'ed. rev.'],
                      ['Editor (Editores)', 'Ed. (Eds.)'],
                      ['Traductor(es)', 'Trad.'],
                      ['Sin fecha', 's.f.'],
                      ['Página (páginas)', 'p. (pp.)'],
                      ['Volumen / Número', 'Vol. / núm.'],
                      ['Parte / Suplemento', 'Pt. / Supl.'],
                    ].map(([term, abbr]) => (
                      <div
                        key={term}
                        className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between gap-1"
                      >
                        <span className="text-slate-600">{term}:</span>
                        <code className="font-bold text-violet-900">{abbr}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 1.3 Nivel de los títulos (Pág. 8) */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-4">
              <div>
                <h3 className="text-base font-bold text-violet-950">
                  1.3 Jerarquía de los 5 Niveles de Títulos en APA (Pág. 8)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  La adecuada jerarquía de los títulos facilita la comprensión de categorías y
                  subcategorías (máximo 5 niveles):
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="text-xs font-semibold text-blue-800 uppercase">
                    Niveles 1 a 3 (El texto empieza en un nuevo párrafo)
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm border-l-2 border-violet-300 pl-3">
                    <div>
                      <div className="text-center font-bold text-slate-900">
                        Nivel 1. Encabezado centrado en negrita
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        El párrafo comienza en la siguiente línea con sangría de 1.27 cm.
                      </div>
                    </div>
                    <div>
                      <div className="text-left font-bold text-slate-900">
                        Nivel 2. Encabezado alineado a la izquierda en negrita
                      </div>
                    </div>
                    <div>
                      <div className="text-left font-bold italic text-slate-900">
                        Nivel 3. Encabezado alineado a la izquierda en negrita y cursiva
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="text-xs font-semibold text-blue-800 uppercase">
                    Niveles 4 y 5 (El texto empieza en la misma línea)
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm border-l-2 border-violet-300 pl-3">
                    <div className="pl-5">
                      <span className="font-bold text-slate-900">
                        Nivel 4. Encabezado de párrafo con sangría, negrita y punto al final.
                      </span>{' '}
                      <span className="text-slate-600">
                        El texto del párrafo continúa inmediatamente en la misma línea.
                      </span>
                    </div>
                    <div className="pl-5">
                      <span className="font-bold italic text-slate-900">
                        Nivel 5. Encabezado de párrafo con sangría, negrita, cursiva y punto al
                        final.
                      </span>{' '}
                      <span className="text-slate-600">
                        El texto del párrafo continúa inmediatamente en la misma línea.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAPÍTULO 2: TABLAS, FIGURAS Y LISTA DE CHEQUEO (PÁGS. 9-11) */}
      {activeSubModule === 'tablas_figuras' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Sección 2 · Páginas 9 a 11 del Manual
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                2. Formato de Tablas, Figuras y Lista de Chequeo
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Componentes obligatorios: número en negrita, título descriptivo en cursiva,
                contenido limpio y nota con atribución de autoría.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2.1 Formato de Tablas (Pág. 9) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-violet-950">
                    2.1 Formato de Tablas (Pág. 9)
                  </h3>
                  <span className="text-xs font-medium text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-md">
                    Solo líneas horizontales
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">
                    Tabla 1{' '}
                    <span className="font-normal text-[11px] text-violet-700">
                      ← Etiqueta y número en negrita
                    </span>
                  </div>
                  <div className="italic text-slate-800 pb-1">
                    Violencia de género en Cali en los años 2017, 2018 y 2019{' '}
                    <span className="not-italic text-[11px] text-violet-700">
                      ← Título descriptivo en cursiva
                    </span>
                  </div>

                  <table className="w-full border-t-2 border-b-2 border-slate-800 text-xs my-2">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="py-1.5 text-left font-semibold">Tipo de violencia</th>
                        <th className="py-1.5 text-center font-semibold">Año 2018</th>
                        <th className="py-1.5 text-center font-semibold">Año 2019</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1">Doméstica</td>
                        <td className="py-1 text-center">127</td>
                        <td className="py-1 text-center">130</td>
                      </tr>
                      <tr>
                        <td className="py-1">Patrimonial y económica</td>
                        <td className="py-1 text-center">124</td>
                        <td className="py-1 text-center">90</td>
                      </tr>
                      <tr>
                        <td className="py-1">Psicológica</td>
                        <td className="py-1 text-center">119</td>
                        <td className="py-1 text-center">110</td>
                      </tr>
                      <tr className="border-t border-slate-800 font-semibold">
                        <td className="py-1">Total de casos</td>
                        <td className="py-1 text-center">614</td>
                        <td className="py-1 text-center">545</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-xs text-slate-700 pt-1">
                    <i>Nota.</i> Datos tomados del Observatorio de Género de Cali (2020).
                  </p>
                </div>
              </div>

              {/* 2.2 Formato de Figuras (Pág. 10) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-violet-950">
                    2.2 Formato de Figuras (Pág. 10)
                  </h3>
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                    Fuente sin serifa 8–14 pt en gráfico
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">Figura 1</div>
                  <div className="italic text-slate-800">
                    Violencia contra niños, niñas y adolescentes según escolaridad y sexo de la
                    víctima.
                  </div>

                  {/* Representación visual limpia de gráfico de barras */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 font-sans text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Porcentaje (%) por escolaridad</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-blue-600 inline-block rounded-xs" /> Hombre
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-orange-500 inline-block rounded-xs" /> Mujer
                        </span>
                      </div>
                    </div>
                    {[
                      { label: 'Preescolar', h: 48.4, m: 35.6 },
                      { label: 'Básica primaria', h: 33.3, m: 50.8 },
                      { label: 'No aplica', h: 16.4, m: 11.8 },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-700">
                          <span>{bar.label}</span>
                          <span>
                            H: {bar.h}% | M: {bar.m}%
                          </span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div
                            className="bg-blue-600 rounded-xs"
                            style={{ width: `${bar.h}%` }}
                          />
                          <div
                            className="bg-orange-500 rounded-xs"
                            style={{ width: `${bar.m}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 pt-1">
                    <i>Nota.</i> La figura muestra las cifras de violencia contra los niños, niñas
                    y adolescentes en Colombia en el año 2015. Fuente: Medicina Legal (2015).
                  </p>
                </div>
              </div>
            </div>

            {/* 2.3 Lista de Chequeo Interactiva (Pág. 11) */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-violet-950">
                    2.3 Lista de Chequeo Interactiva para la Inclusión de Tablas y Figuras (Pág. 11)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Marca cada criterio para verificar que tus tablas y figuras cumplen con APA 7.ª
                    edición:
                  </p>
                </div>
                <span className="text-xs font-semibold text-violet-800 bg-white px-3 py-1 rounded-lg border border-violet-200">
                  Completados: {Object.values(checkedItems).filter(Boolean).length} /{' '}
                  {CHECKLIST_ITEMS.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {CHECKLIST_ITEMS.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-violet-300 text-slate-700'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-semibold text-violet-700">
                          {item.category}
                        </div>
                        <div className="text-xs leading-relaxed">{item.text}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAPÍTULO 3: CITAS Y SITUACIONES ESPECIALES DE CITACIÓN (PÁGS. 12-21) */}
      {activeSubModule === 'citas_especiales' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Sección 3 · Páginas 12 a 21 del Manual
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                3. Mecanismos de Citación, Número de Autores y Casos Especiales (Pág. 20+)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Reglas del sistema Autor-Fecha para citas cortas, citas en bloque, parafraseo,
                desambiguación de autores, publicaciones sin autor o sin fecha, material sin
                paginación y comunicaciones personales.
              </p>
            </div>

            {/* Cita corta, Cita larga y Parafraseo con el ejemplo oficial de Kaplan y Szapu (2019) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-violet-800 uppercase">
                  3.1.1 Cita Textual Corta (&lt; 40 palabras · Págs. 13–14)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se integra en el párrafo entre <strong>comillas dobles</strong>, sin cursiva. El
                  punto final va después del paréntesis.
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
                  <div>
                    <strong className="text-violet-900 font-sans">Narrativa:</strong> Según Kaplan
                    y Szapu (2019), “Parece ser que cuando no se encuentran medios para tramitar el
                    dolor social, las lesiones en la piel se convierten en una vía de escape” (p.
                    111).
                  </div>
                  <div className="border-t border-slate-100 pt-1.5">
                    <strong className="text-violet-900 font-sans">Parentética:</strong> “Parece ser
                    que cuando no se encuentran medios para tramitar el dolor social, las lesiones
                    en la piel se convierten en una vía de escape” (Kaplan y Szapu, 2019, p. 111).
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-violet-800 uppercase">
                  3.1.2 Cita Textual Larga (&gt; 40 palabras · Págs. 14–15)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  En bloque aparte con <strong>sangría izquierda de 1.27 cm</strong>, sin comillas.
                  El <strong>punto va ANTES del paréntesis</strong>.
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
                  <div>Según Kaplan y Szapu (2019):</div>
                  <div className="pl-4 border-l-2 border-violet-400">
                    Parece ser que cuando no se encuentran medios para tramitar el dolor social, las
                    lesiones en la piel se convierten en una vía de escape. La sensación de alivio
                    obtenida mediante los cortes parece reemplazar un dolor (social) por otro
                    (físico), aunque sea por breves momentos. (p. 111)
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-violet-800 uppercase">
                  3.3.3 Tres o más autores con igual año (Pág. 17)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Si dos obras con 3+ autores coinciden en el primer autor y el año, se citan los
                  apellidos hasta donde se diferencien antes de <code>et al.</code>:
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
                  <div>
                    <span className="text-slate-500 font-sans">Obra 1:</span> Kapoor, Bloom,{' '}
                    <strong className="text-violet-900">Montez</strong>, Warner y Hill (2017) →{' '}
                    <span className="bg-violet-50 px-1 rounded font-semibold">
                      Kapoor, Bloom, Montez et al. (2017)
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500 font-sans">Obra 2:</span> Kapoor, Bloom,{' '}
                    <strong className="text-violet-900">Zucker</strong>, Tang et al. (2017) →{' '}
                    <span className="bg-violet-50 px-1 rounded font-semibold">
                      Kapoor, Bloom, Zucker et al. (2017)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Las 9 Situaciones Especiales de Citación (Págs. 18 a 21) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-violet-950">
                  3.4 Otras Situaciones Especiales de Citación (Páginas 18 a 21)
                </h3>
                <span className="text-xs font-medium text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                  Todos estos casos están integrados en el Gestor
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPECIAL_CITATION_CASES.map((sc) => (
                  <div
                    key={sc.number}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-violet-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-violet-900 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                          {sc.number}
                        </span>
                        <span className="text-slate-500 font-medium">{sc.page}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
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

            {/* 3.5 Citas que NO requieren referencia (Página 21) */}
            <div className="p-5 sm:p-6 rounded-xl bg-amber-50/80 border border-amber-200 space-y-4">
              <div className="flex items-center gap-2 text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold">
                  3.5 Citas que NO Requieren Referencia Bibliográfica al Final (Página 21)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                  <div className="text-xs font-bold text-amber-900">
                    3.5.1 Cita textual del discurso de participantes en la investigación propia
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cuando se retoman fragmentos del discurso de participantes de una investigación
                    propia, se usa un seudónimo para proteger la confidencialidad y no se incluye en
                    la lista de referencias.
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
                    grabados, cartas y tradición oral o de pueblos indígenas no documentada. Se
                    indica inicial del nombre, apellido y fecha exacta:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                    • M. González (comunicación personal, 17 de mayo, 2020)...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAPÍTULO 4: REFERENCIAS Y CATÁLOGO INTERACTIVO DE LAS PÁGINAS 22 A 35 */}
      {activeSubModule === 'referencias_catalogo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Sección 4 · Páginas 22 a 35 del Manual
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                4. Referencias: Reglas por Número de Autores y Catálogo Oficial de Ejemplos
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Diferencia entre referencias y bibliografía, variación según la cantidad de autores
                (pág. 23) y los 23 modelos oficiales de libros, artículos, prensa, tesis, medios
                audiovisuales, redes sociales y normas legales (págs. 24–35).
              </p>
            </div>

            {/* Diferencia entre Referencias y Bibliografía (Pág. 22) + Variación de Autores (Pág. 23) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 p-5 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-violet-950">
                  ¿Cuál es la diferencia entre Referencias y Bibliografía? (Pág. 22)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  En la lista de <strong>Referencias</strong>, el autor incluye{' '}
                  <strong>únicamente aquellas fuentes que utilizó y citó de forma explícita</strong>{' '}
                  en su trabajo. En cambio, una <strong>Bibliografía</strong> puede integrar obras
                  de fundamento que no se citaron en el escrito.
                </p>
                <div className="bg-white p-3.5 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-violet-900">
                    Regla de Oro en Estilo APA:
                  </div>
                  <div>
                    ✓ Todos los autores citados en el texto deben estar en las Referencias.
                  </div>
                  <div>
                    ✓ Todas las fuentes de la lista de Referencias deben haber sido citadas en el
                    texto.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-violet-950">
                  4.2 Variación en la Referencia según el Número de Autores (Pág. 23)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-violet-900 text-white">
                      <tr>
                        <th className="p-2.5 font-semibold">Cantidad de autores</th>
                        <th className="p-2.5 font-semibold">Regla en la Lista de Referencias</th>
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
                        <td className="p-2.5 font-semibold text-violet-950">Dos a veinte autores</td>
                        <td className="p-2.5 text-slate-600">
                          Se mencionan todos los apellidos e iniciales. El último se une con “y” en
                          español o “&amp;” en inglés.
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
                          Se incluyen los <strong>primeros 19 autores</strong>, luego puntos
                          suspensivos (<code>...</code>) y el último autor.
                        </td>
                        <td className="p-2.5 font-mono text-slate-800">
                          Autor 1, A., ... Autor 25, Z.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-violet-950">Sin autor</td>
                        <td className="p-2.5 text-slate-600">
                          Se inicia directamente con el título de la obra antes de la fecha.
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

            {/* Filtro por Categoría de Fuente (Págs. 24 a 35) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-violet-950">
                  Catálogo de Ejemplos Oficiales (Páginas 24 a 35) — Carga en 1 clic al Gestor
                </h3>
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
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                          <span className="font-mono text-slate-500">{item.page}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
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
                          onClick={() => onLoadExampleInGestor(item.formData, item.title)}
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
          </div>
        </div>
      )}

      {/* CAPÍTULO 5: ADAPTACIONES AL ESPAÑOL (PÁGINA 36) */}
      {activeSubModule === 'adaptaciones_es' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Sección 5 · Página 36 del Manual
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                5. Adaptaciones Oficiales de las Normas APA al Español
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Como el manual original de la APA se publica en inglés, al redactar trabajos
                académicos en español se aplican las siguientes adaptaciones ortográficas y
                gramaticales.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-violet-900 text-white">
                  <tr>
                    <th className="p-3.5 font-semibold w-1/4">Elemento</th>
                    <th className="p-3.5 font-semibold w-3/8">Publicación original en inglés</th>
                    <th className="p-3.5 font-semibold w-3/8">
                      Sugerencia de adaptación al español
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">
                      Conector entre autores en las Citas
                    </td>
                    <td className="p-3.5 text-slate-600">
                      Uso de <code>“and”</code> en citas narrativas y de <code>“&amp;”</code> en
                      citas parentéticas para incluir al último autor.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de <strong>“y”</strong> tanto en citas narrativas como en citas
                      parentéticas: <code>(Kaplan y Szapu, 2019)</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">
                      Conector entre autores en las Referencias
                    </td>
                    <td className="p-3.5 text-slate-600">
                      Uso de <code>“, &amp;”</code> precedido por coma en las referencias para
                      incluir al último autor.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de <strong>“y”</strong> en las referencias en español, no precedida por
                      coma por tratarse de enumeraciones simples:{' '}
                      <code>González, J., González, A. y Ramos, F.</code> (Se mantiene{' '}
                      <code>“, &amp;”</code> si se prefiere el estándar internacional en inglés).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Mayúsculas en los títulos</td>
                    <td className="p-3.5 text-slate-600">
                      Uso de mayúscula inicial en las principales palabras de los títulos de
                      revistas (sustantivos, adjetivos, verbos).
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de mayúscula <strong>únicamente al inicio de la oración</strong> y en los
                      nombres propios según las normas ortográficas del español (RAE).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Formato de las fechas</td>
                    <td className="p-3.5 text-slate-600">
                      Formato <em>Year, Month Day</em> con inicial del mes en mayúscula:{' '}
                      <code>(2020, November 23)</code>.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Formato <strong>Año, día de mes</strong> con la inicial del mes en minúscula:{' '}
                      <code>(2020, 23 de noviembre)</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Números ordinales (Edición)</td>
                    <td className="p-3.5 text-slate-600">
                      Terminaciones anglosajonas: <code>(2nd ed.)</code>, <code>(3rd ed.)</code>.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Números ordinales en español con punto antes de la letra volada:{' '}
                      <code>(2.ª ed.)</code>, <code>(3.ª ed.)</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
