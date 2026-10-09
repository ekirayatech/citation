import React from 'react';
import { ExternalLink, CheckCircle2, Layers } from 'lucide-react';

export const UniversitariosSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <div className="text-xs font-medium text-violet-700 mb-1">
          Ecosistema Académico Avanzado
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Gestores Bibliográficos de Uso Universitario
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Herramientas profesionales para la automatización, almacenamiento y gestión de fuentes en
          la educación superior y proyectos de investigación extensos.
        </p>
      </div>

      {/* Introducción */}
      <section className="p-5 sm:p-6 rounded-xl bg-[#FAF5FF] border border-[#F3E8FF] space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-700" />
          <h3 className="text-base sm:text-lg font-semibold text-violet-950">
            ¿Qué es un Gestor Bibliográfico Universitario?
          </h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          A medida que los estudiantes avanzan hacia los últimos grados escolares y la educación
          superior, o desarrollan monografías complejas con decenas de fuentes, el manejo manual se
          vuelve exigente. Los gestores bibliográficos universitarios son programas especializados
          que permiten capturar metadatos de artículos, libros y páginas web directamente desde el
          navegador, organizar PDFs en bibliotecas virtuales y sincronizar citas automáticas en
          procesadores de texto como Microsoft Word, LibreOffice o Google Docs.
        </p>
      </section>

      {/* Tarjetas de Mendeley, Zotero y EndNote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mendeley */}
        <div className="p-6 rounded-xl bg-[#F0F7FF] border border-[#DCEBFE] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-blue-800">
                Desarrollado por Elsevier · Nube Académica
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Mendeley Reference Manager</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Gestor de referencias bibliográficas y lector de PDFs sincronizado en la nube para
                investigadores y estudiantes.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Características Principales:
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lector PDF integrado:</strong> Permite subrayar, hacer anotaciones en
                    varios colores y organizar notas de documentos académicos directamente en la
                    nube.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mendeley Web Importer:</strong> Extensión de navegador que extrae
                    automáticamente autores, DOI y metadatos de bases de datos científicas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mendeley Cite:</strong> Complemento moderno para insertar citas y crear
                    la bibliografía automáticamente en Microsoft Word y Word Online.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <a
            href="https://www.mendeley.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-[#315BA3] hover:bg-[#254680] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            Acceder al sitio oficial de Mendeley
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Zotero */}
        <div className="p-6 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-emerald-800">
                Código Abierto · Gratuito y Multiplataforma
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Zotero</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Asistente de investigación personal de código abierto, altamente flexible y
                respaldado por universidades de todo el mundo.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-emerald-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Características Principales:
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Captura con 1 clic (Zotero Connector):</strong> Detecta libros,
                    artículos, videos y tesis en Google Scholar o catálogos de bibliotecas
                    guardando todos los metadatos al instante.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Más de 10,000 estilos de citación:</strong> Compatible con APA 7.ª,
                    MLA 9.ª, Chicago, IEEE, Vancouver e Icontec, integrándose con Word y Google
                    Docs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Colaboración en grupos:</strong> Permite compartir bibliotecas y
                    carpetas de investigación con compañeros de clase o docentes sin límite.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <a
            href="https://www.zotero.org"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Acceder al sitio oficial de Zotero
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* EndNote */}
        <div className="p-6 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-800">
                Desarrollado por Clarivate · Estándar Científico
              </div>
              <h3 className="text-xl font-semibold text-slate-900">EndNote</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Suite profesional de gestión bibliográfica de alto rendimiento utilizada en
                universidades, laboratorios y centros de investigación científica.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Características Principales:
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cite While You Write (CWYW):</strong> Complemento avanzado para
                    Microsoft Word que inserta citas y da formato automático a la bibliografía
                    mientras escribes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Conexión con Web of Science y PubMed:</strong> Búsqueda e importación
                    directa desde catálogos científicos internacionales y descarga automática de
                    textos completos en PDF.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>EndNote Web / Basic:</strong> Ofrece una versión en línea gratuita para
                    organizar referencias, detectar duplicados y colaborar con equipos académicos.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <a
            href="https://endnote.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Acceder al sitio oficial de EndNote
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Tabla Comparativa de Orientación Pedagógica */}
      <section className="space-y-3 pt-2">
        <h4 className="text-base font-semibold text-slate-900">
          ¿Cuándo utilizar Cita Master frente a Mendeley, Zotero o EndNote?
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-semibold">Criterio</th>
                <th className="py-3 px-4 font-semibold text-violet-900">
                  Cita Master (Colegio Ekirayá)
                </th>
                <th className="py-3 px-4 font-semibold text-blue-900">Mendeley</th>
                <th className="py-3 px-4 font-semibold text-emerald-900">Zotero</th>
                <th className="py-3 px-4 font-semibold text-amber-900">EndNote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Uso recomendado</td>
                <td className="py-3 px-4">
                  Aprendizaje estructurado, ensayos escolares e informes (1 a 25 fuentes)
                </td>
                <td className="py-3 px-4">
                  Lectura intensiva de PDFs y trabajos universitarios en Word
                </td>
                <td className="py-3 px-4">
                  Monografías extensas, tesis y proyectos colaborativos en Google Docs / Word
                </td>
                <td className="py-3 px-4">
                  Investigación científica avanzada, posgrados y publicaciones indexadas
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Instalación y licencia</td>
                <td className="py-3 px-4">100% Web inmediato y gratuito sin registro</td>
                <td className="py-3 px-4">Freemium · Cuenta Elsevier + App de escritorio</td>
                <td className="py-3 px-4">Gratuito (Open Source) · App + Conector web</td>
                <td className="py-3 px-4">Licencia institucional / pago (con versión Web básica)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Citación de IA (ChatGPT)</td>
                <td className="py-3 px-4">Plantilla dedicada paso a paso para IA</td>
                <td className="py-3 px-4">Configuración manual como software/web</td>
                <td className="py-3 px-4">Configuración manual como software/programa</td>
                <td className="py-3 px-4">Configuración manual en plantilla de programa</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
