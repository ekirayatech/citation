import React, { useState } from 'react';
import {
  FileText,
  Table2,
  Globe2,
  CheckSquare,
  Square,
} from 'lucide-react';

type SubModuleId = 'formato' | 'tablas_figuras' | 'adaptaciones_es';

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

export const Apa2026Section: React.FC = () => {
  const [activeSubModule, setActiveSubModule] = useState<SubModuleId>('formato');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'chk-1': true,
    'chk-2': true,
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal de la Pestaña Normas APA 2026 */}
      <div className="bg-gradient-to-r from-[#533e6f] via-[#664d88] to-[#735697] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              <span>Manual Oficial APA 7.ª Edición · Vigencia Académica 2026</span>
              <span aria-hidden="true">·</span>
              <span>Síntesis Centro de Escritura Javeriano</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Normas APA 2026 — Formato General, Tablas, Figuras y Adaptación al Español
            </h1>
            <p className="text-violet-100 text-sm sm:text-base leading-relaxed">
              Consulta las pautas formales para la presentación de trabajos académicos: configuración
              de página, portada estudiantil, los cinco niveles de títulos, diseño de tablas y
              figuras, y las adaptaciones oficiales del estilo APA al español.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-4 text-xs space-y-1.5 shrink-0">
            <div className="font-semibold text-white">Contenido de esta sección:</div>
            <div className="text-violet-100">• 1. Formato general, portada y niveles de títulos</div>
            <div className="text-violet-100">• 2. Tablas, figuras y lista de chequeo interactiva</div>
            <div className="text-violet-100">• 3. Adaptaciones oficiales al español</div>
          </div>
        </div>

        {/* Sub-navegación de los Apartados 1, 2 y 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-white/15">
          {[
            {
              id: 'formato' as SubModuleId,
              label: '1. Formato General y Títulos',
              sub: 'Papel, márgenes, portada y jerarquía',
              icon: FileText,
            },
            {
              id: 'tablas_figuras' as SubModuleId,
              label: '2. Tablas y Figuras',
              sub: 'Estructura visual y lista de chequeo',
              icon: Table2,
            },
            {
              id: 'adaptaciones_es' as SubModuleId,
              label: '3. Adaptaciones al Español',
              sub: 'Conectores, mayúsculas, fechas y ordinales',
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
                className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${
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
                      className={`text-[11px] truncate ${
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

      {/* APARTADO 1: FORMATO GENERAL DEL TRABAJO, PORTADA Y NIVELES DE TÍTULOS */}
      {activeSubModule === 'formato' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Apartado 1 · Presentación Formal del Documento
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                1. Formato General del Trabajo Académico
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Pautas oficiales de papel, márgenes, fuentes tipográficas permitidas, abreviaturas,
                portada estudiantil y jerarquía de cinco niveles de títulos.
              </p>
            </div>

            {/* Cuadrícula de Especificaciones Técnicas */}
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

            {/* Portada Estudiantil y Orden de los Elementos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Maqueta visual de la Portada Estudiantil */}
              <div className="lg:col-span-6 p-5 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-violet-950">
                    1.2.1 Página de Presentación de Trabajos Estudiantiles
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
                    1.2 Orden de los Elementos del Trabajo
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
                    Abreviaturas Oficiales Utilizadas en APA
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

            {/* 1.3 Nivel de los títulos */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] space-y-4">
              <div>
                <h3 className="text-base font-bold text-violet-950">
                  1.3 Jerarquía de los 5 Niveles de Títulos en APA
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  La adecuada jerarquía de los títulos facilita la comprensión de las relaciones de
                  inclusión (categorías, subcategorías; temas, subtemas) en el texto. Se propone un
                  máximo de cinco niveles:
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

      {/* APARTADO 2: TABLAS, FIGURAS Y LISTA DE CHEQUEO */}
      {activeSubModule === 'tablas_figuras' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Apartado 2 · Elementos Paratextuales y Gráficos
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                2. Formato de Tablas, Figuras y Lista de Chequeo
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Componentes básicos obligatorios: número en negrita, título descriptivo en cursiva,
                contenido limpio y nota con atribución de autoría.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2.1 Formato de Tablas */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-violet-950">2.1 Formato de Tablas</h3>
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

              {/* 2.2 Formato de Figuras */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-violet-950">2.2 Formato de Figuras</h3>
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

            {/* 2.3 Lista de Chequeo Interactiva */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-violet-950">
                    2.3 Lista de Chequeo Interactiva para la Inclusión de Tablas y Figuras
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

      {/* APARTADO 3: ADAPTACIONES AL ESPAÑOL */}
      {activeSubModule === 'adaptaciones_es' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Apartado 3 · Diferencias Idiomáticas Inglés vs. Español
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                3. Adaptaciones de las Normas APA al Español
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
                      citas parentéticas para incluir al último autor de una publicación.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de <strong>“y”</strong> tanto en citas narrativas como en citas
                      parentéticas para incluir al último autor:{' '}
                      <code>(Kaplan y Szapu, 2019)</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">
                      Conector entre autores en las Referencias
                    </td>
                    <td className="p-3.5 text-slate-600">
                      Uso de <code>“, &amp;”</code> precedido por coma en las referencias para
                      incluir al último autor de una publicación.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de <strong>“y”</strong> en las referencias en español, no precedida por
                      coma por tratarse de enumeraciones simples:{' '}
                      <code>González, J., González, A. y Ramos, F.</code> (Se mantiene{' '}
                      <code>“, &amp;”</code> en las referencias en otros idiomas).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Mayúsculas en los títulos</td>
                    <td className="p-3.5 text-slate-600">
                      Uso de mayúscula inicial en las principales palabras de los títulos
                      (sustantivos, adjetivos, verbos).
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Uso de mayúscula <strong>únicamente al inicio de la oración</strong> y de
                      acuerdo con las normas ortográficas del español (por ejemplo, en nombres
                      propios).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Formato de las fechas</td>
                    <td className="p-3.5 text-slate-600">
                      Fechas en formato <em>Year, Month Day</em> con inicial del mes en mayúscula:{' '}
                      <code>(2020, November 23)</code>.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Fechas en formato <strong>Año, día y mes</strong> con la inicial del mes en
                      minúscula: <code>(2020, 23 de noviembre)</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-violet-950">Números ordinales (Edición)</td>
                    <td className="p-3.5 text-slate-600">
                      Números ordinales en inglés: <code>(3rd ed.)</code>.
                    </td>
                    <td className="p-3.5 text-slate-800 bg-emerald-50/40">
                      Números ordinales en español con punto antes de la letra volada:{' '}
                      <code>(3.ª ed.)</code>.
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
