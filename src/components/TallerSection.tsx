import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileDown,
  HelpCircle,
  ClipboardCheck,
  Award,
} from 'lucide-react';
import { SavedReference } from '../types/citation';
import {
  exportWorkshopToPDF,
  QuizAnswerPDFItem,
  WorkshopExercisePDFItem,
} from '../utils/pdfGenerator';

interface TallerSectionProps {
  savedReferences: SavedReference[];
  showToast: (msg: string) => void;
}

interface ExerciseItem {
  id: string;
  question: string;
  placeholder: string;
  expectedExample: string;
  validate: (input: string) => { isCorrect: boolean; feedback: string };
}

const EXERCISES: ExerciseItem[] = [
  {
    id: 'ex1',
    question:
      '1. Ordena los datos para formar la referencia completa de un libro en APA 7: (Montessori, M. / 2019 / La mente absorbente del niño / Editorial Trillas)',
    placeholder: 'Ej. Montessori, M. (2019). La mente absorbente del niño. Editorial Trillas.',
    expectedExample:
      'Montessori, M. (2019). La mente absorbente del niño. Editorial Trillas.',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Por favor escribe la referencia propuesta.' };
      }
      const hasAuthorFirst = /^montessori/i.test(clean);
      const hasYearParens = /\(\s*2019\s*\)/.test(clean);
      const hasTitle = /mente absorbente/i.test(clean);
      const hasPublisher = /trillas/i.test(clean);
      if (hasAuthorFirst && hasYearParens && hasTitle && hasPublisher) {
        return {
          isCorrect: true,
          feedback:
            'Excelente: Ordenaste correctamente Autor, (Año), Título de la obra y Editorial.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Revisa el orden APA 7: Apellido, Inicial. (Año). Título del libro. Editorial.',
      };
    },
  },
  {
    id: 'ex2',
    question:
      '2. Escribe la Cita Parentética correcta para el autor "López, C." en el año 2022 y en la página 45.',
    placeholder: 'Ej. (López, 2022, p. 45)',
    expectedExample: '(López, 2022, p. 45)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Por favor ingresa la cita parentética.' };
      }
      const hasParens = clean.startsWith('(') && clean.endsWith(')');
      const hasLast = /l[oó]pez/i.test(clean);
      const hasInitialInside = /l[oó]pez\s*,\s*c\./i.test(clean);
      const hasYear = /2022/.test(clean);
      const hasPage = /p\.\s*45/i.test(clean);

      if (hasInitialInside) {
        return {
          isCorrect: false,
          feedback:
            'Recuerda que en la cita dentro del texto NO se incluye la inicial del nombre (C.), solo el apellido: (López, 2022, p. 45).',
        };
      }
      if (hasParens && hasLast && hasYear && hasPage) {
        return {
          isCorrect: true,
          feedback:
            'Correcto: La cita parentética encierra entre paréntesis (Apellido, Año, p. #).',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Verifica que todo esté entre paréntesis con el formato: (López, 2022, p. 45).',
      };
    },
  },
  {
    id: 'ex3',
    question:
      '3. Escribe un ejemplo de Cita Narrativa para la herramienta de IA creada por "OpenAI" en el año 2024.',
    placeholder: 'Ej. Según OpenAI (2024)...',
    expectedExample: 'Según OpenAI (2024), ...',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe la cita narrativa.' };
      }
      const hasNarrativePattern = /openai\s*\(\s*2024\s*\)/i.test(clean);
      if (hasNarrativePattern) {
        return {
          isCorrect: true,
          feedback:
            'Muy bien: En la cita narrativa el autor (OpenAI) se integra en la oración y solo el año (2024) va entre paréntesis.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'En la cita narrativa el autor va fuera del paréntesis y el año dentro: Según OpenAI (2024)...',
      };
    },
  },
  {
    id: 'ex4',
    question:
      '4. ¿Qué descripción estandarizada va entre corchetes [...] al referenciar ChatGPT en APA 7?',
    placeholder: 'Ej. Modelo de lenguaje grande',
    expectedExample: '[Modelo de lenguaje grande]',
    validate: (val) => {
      const clean = val.trim().toLowerCase();
      if (!clean) {
        return { isCorrect: false, feedback: 'Ingresa la descripción que va entre corchetes.' };
      }
      if (
        clean.includes('modelo de lenguaje') ||
        clean.includes('large language model') ||
        clean.includes('inteligencia artificial')
      ) {
        return {
          isCorrect: true,
          feedback:
            'Exacto: En APA 7 se especifica [Modelo de lenguaje grande] (o [Large language model]) para describir la naturaleza del recurso.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'En APA 7 se utiliza la descripción [Modelo de lenguaje grande] después del nombre y versión de la IA.',
      };
    },
  },
  {
    id: 'ex5',
    question:
      '5. Corrige los dos errores presentes en esta cita parentética: (Pérez, página 12, 2021)',
    placeholder: 'Escribe la cita corregida...',
    expectedExample: '(Pérez, 2021, p. 12)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe la cita corregida.' };
      }
      const isCorrectOrder =
        /\(\s*p[eé]rez\s*,\s*2021\s*,\s*p\.\s*12\s*\)/i.test(clean);
      if (isCorrectOrder) {
        return {
          isCorrect: true,
          feedback:
            'Excelente corrección: El año (2021) va antes de la página, y "página" se abrevia como "p. 12".',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Recuerda que el orden correcto es (Apellido, Año, p. #) usando la abreviatura "p.": (Pérez, 2021, p. 12).',
      };
    },
  },
  {
    id: 'ex6',
    question:
      '6. Escribe la cita parentética desde la primera mención para un artículo publicado en 2019 por seis autores: Hoyos-Hernández, Sanabria, Orcasita, Valenzuela, González y Osorio.',
    placeholder: 'Ej. (Hoyos-Hernández et al., 2019)',
    expectedExample: '(Hoyos-Hernández et al., 2019)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe la cita parentética abreviada.' };
      }
      const hasFirstAuthor = /hoyos-hern[aá]ndez/i.test(clean);
      const hasEtAl = /et\s+al\./i.test(clean);
      const hasYear = /2019/.test(clean);
      const hasParens = clean.startsWith('(') && clean.endsWith(')');
      if (hasParens && hasFirstAuthor && hasEtAl && hasYear) {
        return {
          isCorrect: true,
          feedback:
            'Correcto: Cuando una obra tiene tres o más autores, desde la primera vez se cita el apellido del primer autor seguido de "et al." y el año.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Recuerda usar el primer autor seguido de "et al." (con punto) y el año entre paréntesis: (Hoyos-Hernández et al., 2019).',
      };
    },
  },
  {
    id: 'ex7',
    question:
      '7. Escribe en un solo paréntesis las citas de dos trabajos: Gastesi y Salceda (2019) y Cardozo (2020), aplicando el orden alfabético y la puntuación oficial APA.',
    placeholder: 'Ej. (Cardozo, 2020; Gastesi y Salceda, 2019)',
    expectedExample: '(Cardozo, 2020; Gastesi y Salceda, 2019)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe las dos citas dentro de un paréntesis.' };
      }
      const hasOrderAndSemicolon =
        /\(\s*cardozo\s*,\s*2020\s*;\s*gastesi\s+(y|&)\s+salceda\s*,\s*2019\s*\)/i.test(
          clean
        );
      if (hasOrderAndSemicolon) {
        return {
          isCorrect: true,
          feedback:
            'Muy bien: Al agrupar dos o más trabajos en un mismo paréntesis se ordenan alfabéticamente y se separan con punto y coma (;).',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Deben ir en orden alfabético (Cardozo antes que Gastesi) y separadas por punto y coma: (Cardozo, 2020; Gastesi y Salceda, 2019).',
      };
    },
  },
  {
    id: 'ex8',
    question:
      '8. Escribe la cita parentética para una publicación del autor "Pulido" en la que no se indica el año ni la fecha de publicación.',
    placeholder: 'Ej. (Pulido, s.f.)',
    expectedExample: '(Pulido, s.f.)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Ingresa la cita para publicación sin fecha.' };
      }
      const isValid = /\(\s*pulido\s*,\s*s\.\s*f\.\s*\)/i.test(clean);
      if (isValid) {
        return {
          isCorrect: true,
          feedback:
            'Exacto: Cuando no se indica el año de publicación, se utiliza la abreviatura "s.f." (sin fecha).',
        };
      }
      return {
        isCorrect: false,
        feedback: 'Usa la abreviatura "s.f." después del apellido: (Pulido, s.f.).',
      };
    },
  },
  {
    id: 'ex9',
    question:
      '9. Escribe la cita parentética para un fragmento textual de "Basu y Jones" del año 2007 tomado de una página web sin paginación, en el párrafo 4.',
    placeholder: 'Ej. (Basu y Jones, 2007, párr. 4)',
    expectedExample: '(Basu y Jones, 2007, párr. 4)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe la cita con número de párrafo.' };
      }
      const isValid =
        /\(\s*basu\s+(y|&)\s+jones\s*,\s*2007\s*,\s*p[aá]rr\.\s*4\s*\)/i.test(clean);
      if (isValid) {
        return {
          isCorrect: true,
          feedback:
            'Correcto: En material digital sin paginación fija se indica el número de párrafo con la abreviatura "párr. 4".',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Verifica el uso de la abreviatura "párr. 4": (Basu y Jones, 2007, párr. 4).',
      };
    },
  },
  {
    id: 'ex10',
    question:
      '10. Escribe el paréntesis de una "cita de una cita" cuando mencionas a Penrose en el texto, pero leíste su idea dentro de un libro de Hawking publicado en 2010.',
    placeholder: 'Ej. (como se citó en Hawking, 2010)',
    expectedExample: '(como se citó en Hawking, 2010)',
    validate: (val) => {
      const clean = val.trim();
      if (!clean) {
        return { isCorrect: false, feedback: 'Escribe la cita de fuente secundaria.' };
      }
      const isValid =
        /como\s+se\s+cit[oó]\s+en\s+hawking\s*,\s*2010/i.test(clean);
      if (isValid) {
        return {
          isCorrect: true,
          feedback:
            'Excelente: En la cita de una cita se emplea la fórmula "(como se citó en Hawking, 2010)" y en las referencias solo se incluye la fuente secundaria consultada (Hawking).',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Utiliza la expresión oficial: (como se citó en Hawking, 2010).',
      };
    },
  },
];

interface QuizQuestion {
  id: string;
  number: number;
  question: string;
  options: { value: 'A' | 'B' | 'C'; label: string }[];
  correctValue: 'A' | 'B' | 'C';
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz1',
    number: 1,
    question:
      '¿Cuál es la diferencia principal entre una Cita y una Referencia Bibliográfica?',
    options: [
      { value: 'A', label: 'La cita es más larga que la referencia.' },
      {
        value: 'B',
        label:
          'La cita es una mención breve dentro del párrafo y la referencia completa va al final del trabajo.',
      },
      { value: 'C', label: 'Ambas son exactamente lo mismo y se usan indistintamente.' },
    ],
    correctValue: 'B',
    explanation:
      'La cita identifica brevemente la fuente dentro del texto (Autor, año), mientras que la referencia detalla todos los datos al final del documento para localizarla.',
  },
  {
    id: 'quiz2',
    number: 2,
    question: '¿Cuándo es obligatorio agregar el número de página (p. o pp.) en la cita?',
    options: [
      {
        value: 'A',
        label: 'Al realizar una cita textual o directa (copia literal de las palabras del autor).',
      },
      { value: 'B', label: 'En todas las citas sin excepción, incluso cuando no tienen páginas.' },
      { value: 'C', label: 'Nunca se coloca el número de página en normas APA.' },
    ],
    correctValue: 'A',
    explanation:
      'Toda cita textual directa exige indicar el número de página (p. o pp.), número de párrafo (párr.) o marca de tiempo de donde se tomó el fragmento literal.',
  },
  {
    id: 'quiz3',
    number: 3,
    question:
      '¿Cómo se formatea el margen de cada entrada en la lista de Referencias al final del documento?',
    options: [
      { value: 'A', label: 'Texto centrado en toda la página.' },
      {
        value: 'B',
        label:
          'Sangría francesa de 1.27 cm (primera línea al margen izquierdo y líneas siguientes con sangría).',
      },
      { value: 'C', label: 'Alineación a la derecha con viñetas.' },
    ],
    correctValue: 'B',
    explanation:
      'La sangría francesa de 1.27 cm permite identificar visualmente y con rapidez el apellido de cada autor en la lista ordenada alfabéticamente.',
  },
  {
    id: 'quiz4',
    number: 4,
    question:
      'Al citar una herramienta de Inteligencia Artificial como ChatGPT, ¿quién figura como "Autor"?',
    options: [
      { value: 'A', label: 'El estudiante o investigador que redactó el prompt.' },
      {
        value: 'B',
        label: 'La organización o empresa creadora del modelo (ej. OpenAI, Google, Anthropic).',
      },
      { value: 'C', label: 'Se cita siempre como Autor Anónimo.' },
    ],
    correctValue: 'B',
    explanation:
      'Según APA 7, el autor de un modelo de lenguaje es la organización creadora de la herramienta (por ejemplo, OpenAI para ChatGPT).',
  },
  {
    id: 'quiz5',
    number: 5,
    question:
      '¿Cuál es la consecuencia ética y académica de NO citar las fuentes utilizadas en un trabajo?',
    options: [
      {
        value: 'A',
        label: 'Incurrir en plagio académico, vulnerar los derechos de autor y faltar a la probidad.',
      },
      { value: 'B', label: 'Únicamente que el archivo digital ocupe menos espacio.' },
      { value: 'C', label: 'Ninguna, ya que citar las fuentes es opcional en trabajos escolares.' },
    ],
    correctValue: 'A',
    explanation:
      'Omitir el crédito a las fuentes originales constituye plagio y contradice la probidad académica del Colegio Ekirayá.',
  },
  {
    id: 'quiz6',
    number: 6,
    question:
      '¿Cuáles son las medidas y ajustes obligatorios para el formato general de un documento en Normas APA 7.ª edición?',
    options: [
      {
        value: 'A',
        label:
          'Márgenes de 2,54 cm en los cuatro lados, interlineado doble (2.0), alineación a la izquierda sin justificar y sangría de 1.27 cm en la primera línea de cada párrafo.',
      },
      {
        value: 'B',
        label:
          'Márgenes de 3 cm a la izquierda, interlineado sencillo (1.0) y texto completamente justificado sin sangría.',
      },
      {
        value: 'C',
        label:
          'Numeración de página en el centro inferior y títulos escritos completamente en mayúscula sostenida.',
      },
    ],
    correctValue: 'A',
    explanation:
      'APA 7 establece papel tamaño carta, márgenes uniformes de 2,54 cm, interlineado 2.0, alineación a la izquierda sin justificar y sangría de primera línea de 1.27 cm.',
  },
  {
    id: 'quiz7',
    number: 7,
    question:
      'En una cita textual larga (de 40 o más palabras), ¿cuál de las siguientes reglas de formato y puntuación se aplica?',
    options: [
      {
        value: 'A',
        label:
          'Se encierra entre comillas dobles dentro del mismo párrafo y va en letra cursiva.',
      },
      {
        value: 'B',
        label:
          'Se escribe en un bloque o párrafo aparte con sangría izquierda de 1.27 cm, sin comillas, y el punto final se ubica antes del paréntesis.',
      },
      {
        value: 'C',
        label:
          'Se centra en la página con interlineado sencillo y sin mencionar el número de página.',
      },
    ],
    correctValue: 'B',
    explanation:
      'Las citas de 40 palabras o más van en párrafo aparte con sangría de 1.27 cm, sin comillas ni cursiva, y el punto va antes del paréntesis de la página.',
  },
  {
    id: 'quiz8',
    number: 8,
    question:
      'Respecto a la presentación de Tablas y Figuras en APA 7.ª edición, ¿cuál criterio es verdadero?',
    options: [
      {
        value: 'A',
        label:
          'Las tablas llevan bordes verticales y horizontales gruesos en todas las celdas y el título se coloca debajo de la tabla.',
      },
      {
        value: 'B',
        label:
          'Llevan etiqueta en negrita (Tabla 1 / Figura 1), título descriptivo en cursiva en la parte superior, solo líneas horizontales en las tablas y nota al pie con la fuente.',
      },
      {
        value: 'C',
        label:
          'No es necesario mencionarlas en el texto ni atribuir su autoría si fueron tomadas de internet.',
      },
    ],
    correctValue: 'B',
    explanation:
      'Tanto las tablas como las figuras se encabezan con su etiqueta en negrita y su título en cursiva; además, en las tablas solo se marcan las líneas horizontales.',
  },
  {
    id: 'quiz9',
    number: 9,
    question:
      '¿Qué sucede en la lista de Referencias con las comunicaciones personales (entrevistas no grabadas, correos, tradición oral) y con las obras de más de 20 autores?',
    options: [
      {
        value: 'A',
        label:
          'Las comunicaciones personales solo se citan en el texto (no van en las Referencias); y en obras de más de 20 autores se listan los primeros 19, puntos suspensivos (...) y el último autor.',
      },
      {
        value: 'B',
        label:
          'Las comunicaciones personales van primero en la lista de Referencias, y en obras de más de 20 autores solo se escribe el primer autor.',
      },
      {
        value: 'C',
        label:
          'Ninguna de las dos se puede citar dentro del texto académico.',
      },
    ],
    correctValue: 'A',
    explanation:
      'Al no ser recuperables por el lector, las comunicaciones personales solo se citan en el texto; mientras que las fuentes con más de 20 autores incluyen los primeros 19 seguidos de "..." y el autor final.',
  },
  {
    id: 'quiz10',
    number: 10,
    question:
      'De acuerdo con las adaptaciones oficiales de las Normas APA al español, ¿cómo se escriben los conectores, las fechas y los números ordinales de edición?',
    options: [
      {
        value: 'A',
        label:
          'Se usa siempre "and", fechas en inglés (2020, May 7) y edición como (2nd ed.).',
      },
      {
        value: 'B',
        label:
          'Se emplea la conjunción “y” para unir al último autor en obras en español, fechas como (2020, 23 de noviembre) con mes en minúscula y ordinales con punto antes de la letra volada (3.ª ed.).',
      },
      {
        value: 'C',
        label:
          'Todas las palabras del título de un libro deben llevar mayúscula inicial.',
      },
    ],
    correctValue: 'B',
    explanation:
      'En español se usa “y” entre autores, mayúscula únicamente al inicio del título y en nombres propios, meses en minúscula y punto antes de la letra volada en los ordinales (3.ª ed.).',
  },
];

export const TallerSection: React.FC<TallerSectionProps> = ({
  savedReferences,
  showToast,
}) => {
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [nameError, setNameError] = useState(false);

  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});

  const [exerciseValidation, setExerciseValidation] = useState<
    Record<string, { isCorrect: boolean; feedback: string } | null>
  >({});

  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  const [quizSelections, setQuizSelections] = useState<Record<string, 'A' | 'B' | 'C' | undefined>>({});
  const [quizGraded, setQuizGraded] = useState(false);

  const handleCheckExercises = () => {
    const results: Record<string, { isCorrect: boolean; feedback: string }> = {};
    let correctTotal = 0;
    EXERCISES.forEach((ex) => {
      const res = ex.validate(exerciseAnswers[ex.id] || '');
      results[ex.id] = res;
      if (res.isCorrect) correctTotal++;
    });
    setExerciseValidation(results);
    showToast(`Taller verificado: ${correctTotal} de ${EXERCISES.length} ejercicios correctos`);
  };

  const calculateQuizStats = () => {
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (quizSelections[q.id] === q.correctValue) {
        correctCount++;
      }
    });
    const finalScore = ((correctCount / QUIZ_QUESTIONS.length) * 5.0).toFixed(1);
    return { correctCount, finalScore };
  };

  const handleGradeQuiz = () => {
    setQuizGraded(true);
    const { finalScore } = calculateQuizStats();
    showToast(`Test calificado: ${finalScore} / 5.0`);
  };

  const handleExportPDF = async () => {
    if (!studentFirstName.trim() || !studentLastName.trim()) {
      setNameError(true);
      showToast('Por favor ingresa tus Nombres y Apellidos para generar el PDF');
      return;
    }
    setNameError(false);

    const exerciseItems: WorkshopExercisePDFItem[] = EXERCISES.map((ex) => {
      const val = exerciseAnswers[ex.id] || '';
      const check = val.trim() ? ex.validate(val) : null;
      return {
        title: ex.question.replace(/^\d+\.\s*/, ''),
        answer: val,
        isCorrect: check ? check.isCorrect : null,
        feedback: check ? check.feedback : '',
      };
    });

    const quizItems: QuizAnswerPDFItem[] = QUIZ_QUESTIONS.map((q) => {
      const sel = quizSelections[q.id];
      const opt = q.options.find((o) => o.value === sel);
      return {
        questionNumber: q.number,
        questionText: q.question,
        selectedText: opt ? `${opt.value}) ${opt.label}` : 'Sin responder',
        isCorrect: sel === q.correctValue,
      };
    });

    const { correctCount, finalScore } = calculateQuizStats();

    await exportWorkshopToPDF({
      firstName: studentFirstName.trim(),
      lastName: studentLastName.trim(),
      gradeCourse: studentGrade.trim(),
      exercises: exerciseItems,
      quizItems,
      quizScore: finalScore,
      correctCount,
      savedReferences,
    });

    showToast('Reporte PDF descargado exitosamente');
  };

  const { correctCount, finalScore } = calculateQuizStats();
  const numericScore = parseFloat(finalScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-violet-700 mb-1">
            Evaluación Práctica y Formativa · Guía Teórica y Normas APA 2026
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Taller Interactivo y Test de Conocimientos
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Resuelve los 10 ejercicios prácticos de citación y referenciación, responde las 10
            preguntas del test con retroalimentación inmediata y exporta tu reporte en PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          className="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm whitespace-nowrap"
        >
          <FileDown className="w-4 h-4" />
          Exportar Resultados a PDF
        </button>
      </div>

      {/* Registro del Estudiante */}
      <section
        className={`p-5 rounded-xl border transition-colors ${
          nameError
            ? 'bg-red-50/70 border-red-300'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Datos del Estudiante (Requeridos para el reporte PDF)
          </h3>
          {nameError && (
            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Completa tus nombres y apellidos antes de exportar
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombres *
            </label>
            <input
              type="text"
              value={studentFirstName}
              onChange={(e) => {
                setStudentFirstName(e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="Ej. María José"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              value={studentLastName}
              onChange={(e) => {
                setStudentLastName(e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="Ej. Rodríguez Pérez"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Curso / Taller (Opcional)
            </label>
            <input
              type="text"
              value={studentGrade}
              onChange={(e) => setStudentGrade(e.target.value)}
              placeholder="Ej. Taller IV / Grado 10°"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
        </div>
      </section>

      {/* PARTE 1: EJERCICIOS INTERACTIVOS DE APLICACIÓN */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="text-xs font-medium text-violet-700">
              Parte 1 · Práctica Escrita ({EXERCISES.length} ejercicios)
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Ejercicios Interactivos de Aplicación
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCheckExercises}
            className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <ClipboardCheck className="w-4 h-4 text-violet-700" />
            Verificar Taller ({EXERCISES.length} ejercicios)
          </button>
        </div>

        <div className="space-y-4">
          {EXERCISES.map((ex) => {
            const valResult = exerciseValidation[ex.id];
            return (
              <div
                key={ex.id}
                className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <label
                    htmlFor={ex.id}
                    className="block text-xs sm:text-sm font-semibold text-slate-900 leading-snug"
                  >
                    {ex.question}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowSolution((prev) => ({
                        ...prev,
                        [ex.id]: !prev[ex.id],
                      }))
                    }
                    className="text-xs font-medium text-violet-700 hover:text-violet-950 flex items-center gap-1 shrink-0"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showSolution[ex.id] ? 'Ocultar guía' : 'Ver guía'}
                  </button>
                </div>

                <input
                  id={ex.id}
                  type="text"
                  value={exerciseAnswers[ex.id] || ''}
                  onChange={(e) =>
                    setExerciseAnswers((prev) => ({
                      ...prev,
                      [ex.id]: e.target.value,
                    }))
                  }
                  placeholder={ex.placeholder}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-600"
                />

                {showSolution[ex.id] && (
                  <div className="text-xs bg-violet-50/80 text-violet-950 px-3 py-2 rounded-lg border border-violet-200 flex items-center justify-between">
                    <span>
                      <strong>Respuesta modelo:</strong>{' '}
                      <code className="font-mono">{ex.expectedExample}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExerciseAnswers((prev) => ({
                          ...prev,
                          [ex.id]: ex.expectedExample,
                        }))
                      }
                      className="text-xs font-semibold text-violet-700 hover:underline ml-2"
                    >
                      Usar ejemplo
                    </button>
                  </div>
                )}

                {valResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                      valResult.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {valResult.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{valResult.feedback}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PARTE 2: TEST DE CONOCIMIENTOS */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="text-xs font-medium text-violet-700">
              Parte 2 · Selección Múltiple ({QUIZ_QUESTIONS.length} preguntas)
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Test de Conocimientos (Escala 0.0 a 5.0)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleGradeQuiz}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <Award className="w-4 h-4 text-violet-300" />
            Calificar Test en Pantalla
          </button>
        </div>

        {/* Tarjeta de Calificación */}
        {quizGraded && (
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              numericScore >= 3.0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold uppercase tracking-wide">
                Resultado de la Evaluación
              </div>
              <div className="text-xl font-bold font-mono tabular-nums">
                Calificación Obtenida: {finalScore} / 5.0
              </div>
              <p className="text-xs opacity-90">
                Respuestas correctas: {correctCount} de {QUIZ_QUESTIONS.length} preguntas.
              </p>
            </div>
            <div className="text-xs font-semibold">
              {numericScore >= 4.5
                ? 'Desempeño Superior · Dominio sobresaliente de normas'
                : numericScore >= 3.5
                ? 'Desempeño Alto · Buen manejo de conceptos'
                : numericScore >= 3.0
                ? 'Desempeño Básico · Aprobado'
                : 'Por mejorar · Repasa la Guía Teórica y Normas APA 2026'}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {QUIZ_QUESTIONS.map((q) => {
            const selected = quizSelections[q.id];
            const isCorrect = selected === q.correctValue;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {q.number}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isChecked = selected === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-violet-50/90 border-violet-400 text-slate-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={isChecked}
                          onChange={() =>
                            setQuizSelections((prev) => ({
                              ...prev,
                              [q.id]: opt.value,
                            }))
                          }
                          className="mt-0.5 accent-violet-700"
                        />
                        <span>
                          <strong className="font-mono mr-1">{opt.value})</strong>
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {quizGraded && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong>
                        {isCorrect
                          ? 'Respuesta correcta.'
                          : `Respuesta incorrecta (La opción correcta es la ${q.correctValue}).`}
                      </strong>{' '}
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pie de exportación PDF */}
      <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          El reporte PDF incluye el membrete del Colegio Ekirayá, las respuestas de la Parte 1, la
          calificación de la Parte 2 y tus referencias guardadas en el Gestor.
        </p>
        <button
          type="button"
          onClick={handleExportPDF}
          className="px-6 py-3 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <FileDown className="w-4 h-4" />
          Exportar Resultados a PDF
        </button>
      </div>
    </div>
  );
};
