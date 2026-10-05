import { CmsPage } from '../types/cms';

export const DEFAULT_CMS_PAGES: CmsPage[] = [
  {
    id: 'cms-cronograma-2026',
    slug: 'cronograma-2026',
    title: 'Cronograma Académico y Fechas Clave Monografías 2026',
    navLabel: 'Cronograma',
    subtitle: 'Hitos institucionales de formulación, asesorías metodológicas, comités de bioética y sustentación final.',
    iconName: 'Award',
    published: true,
    order: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'mebolanos@cem.edu.co',
    blocks: [
      {
        id: 'blk-1',
        type: 'alert',
        title: 'Aviso Importante para Grado 11 y Asesores',
        content:
          'Todos los protocolos de investigación que involucren seres vivos, sustancias químicas o encuestas a menores de edad deben contar con la aprobación previa del Comité Institucional de Bioética antes del inicio de la fase experimental.',
        alertType: 'institucional',
      },
      {
        id: 'blk-2',
        type: 'header',
        title: 'Hitos del Calendario Académico 2026',
        subtitle: 'Revisa las fechas límite y los requisitos de entrega de cada etapa del proyecto.',
      },
      {
        id: 'blk-3',
        type: 'cards',
        title: 'Fases de la Investigación',
        items: [
          {
            id: 'item-1',
            title: 'Fase 1: Planteamiento del Problema',
            description:
              'Definición de pregunta problema, justificación teórica y objetivos general y específicos. Registro formal en el Repositorio.',
            badge: 'Febrero 2026',
          },
          {
            id: 'item-2',
            title: 'Fase 2: Marco Teórico y Estado del Arte',
            description:
              'Mínimo 15 fuentes académicas indexadas y formateadas con el Gestor de Citas Master bajo normas APA 7.ª edición.',
            badge: 'Abril 2026',
          },
          {
            id: 'item-3',
            title: 'Fase 3: Metodología y Resultados',
            description:
              'Diseño experimental, análisis cuantitativo/cualitativo y elaboración del primer borrador completo.',
            badge: 'Julio 2026',
          },
          {
            id: 'item-4',
            title: 'Fase 4: Sustentación Pública',
            description:
              'Presentación ante terna evaluadora y depósito del documento final aprobado en Google Drive y repositorio escolar.',
            badge: 'Septiembre 2026',
          },
        ],
      },
      {
        id: 'blk-4',
        type: 'download_links',
        title: 'Documentos Oficiales y Formatos Descargables',
        items: [
          {
            id: 'dl-1',
            title: 'Plantilla Oficial Monografía 2026 (.docx)',
            description: 'Formato Word con tipografía, márgenes, portada estudiantil y sangría francesa preconfigurados.',
            linkUrl: '#',
            linkText: 'Descargar Plantilla Word',
          },
          {
            id: 'dl-2',
            title: 'Rúbrica Institucional de Evaluación de Monografías (.pdf)',
            description: 'Criterios de rigor investigativo, citación ética, originalidad y sustentación oral.',
            linkUrl: '#',
            linkText: 'Ver Rúbrica de Evaluación',
          },
        ],
      },
    ],
  },
  {
    id: 'cms-lineas-investigacion',
    slug: 'lineas-investigacion',
    title: 'Líneas Institucionales de Investigación Ekirayá',
    navLabel: 'Líneas de Investigación',
    subtitle: 'Campos temáticos y núcleos de indagación respaldados por los docentes y asesores de cada unidad académica.',
    iconName: 'Compass',
    published: true,
    order: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'mebolanos@cem.edu.co',
    blocks: [
      {
        id: 'lin-1',
        type: 'paragraph',
        title: 'Marco General de Investigación Escolar',
        content:
          'En el Colegio Ekirayá concebimos la investigación formativa como un proceso reflexivo, riguroso y transformador. Cada estudiante selecciona un tema enmarcado en las líneas de indagación aprobadas, garantizando el acompañamiento de un asesor especialista.',
      },
      {
        id: 'lin-2',
        type: 'accordion',
        title: 'Líneas Activas por Departamento Académico',
        items: [
          {
            id: 'acc-1',
            title: 'Ciencias Naturales, Biotecnología y Medio Ambiente',
            description:
              'Ecosistemas altoandinos, fitoquímica y medicina tradicional, calidad del agua, energías limpias y conservación de biodiversidad en la sabana de Bogotá.',
          },
          {
            id: 'acc-2',
            title: 'Humanidades, Literatura, Filosofía e Historia',
            description:
              'Memoria histórica colombiana, análisis del discurso, literatura latinoamericana contemporánea, ética aplicada y pensamiento crítico.',
          },
          {
            id: 'acc-3',
            title: 'Ciencias Sociales, Psicología y Convivencia',
            description:
              'Procesos psicosociales y bienestar estudiantil, salud mental en jóvenes, participación ciudadana y dinámicas de inclusión comunitaria.',
          },
          {
            id: 'acc-4',
            title: 'Tecnología, Inteligencia Artificial y Matemáticas Aplicadas',
            description:
              'Modelamiento matemático, ética en algoritmos generativos, robótica educativa y ciencia de datos aplicada a problemáticas sociales.',
          },
        ],
      },
    ],
  },
];
