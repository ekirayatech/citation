import { jsPDF } from 'jspdf';
import { SavedReference } from '../types/citation';

const EKIRAYA_LOGO_URL = 'https://colegioekiraya.edu.co/wp-content/uploads/2024/09/LOGO-CEM-COLOR-02.png';

function loadLogoBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    const timeout = setTimeout(() => resolve(null), 2500);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = url;
  });
}

export interface WorkshopExercisePDFItem {
  title: string;
  answer: string;
  isCorrect: boolean | null;
  feedback: string;
}

export interface QuizAnswerPDFItem {
  questionNumber: number;
  questionText: string;
  selectedText: string;
  isCorrect: boolean;
}

export async function exportWorkshopToPDF(params: {
  firstName: string;
  lastName: string;
  gradeCourse?: string;
  exercises: WorkshopExercisePDFItem[];
  quizItems: QuizAnswerPDFItem[];
  quizScore: string;
  correctCount: number;
  savedReferences: SavedReference[];
}): Promise<void> {
  const {
    firstName,
    lastName,
    gradeCourse,
    exercises,
    quizItems,
    quizScore,
    correctCount,
    savedReferences,
  } = params;

  const doc = new jsPDF();
  const logoData = await loadLogoBase64(EKIRAYA_LOGO_URL);

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 20, 12, 28, 14);
    } catch {
      // Fallback if image format fails
    }
  }

  // Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(109, 40, 217); // Deep violet brand
  doc.text('COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI', 115, 17, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Cita Master — Reporte de Taller Práctico y Evaluación Académica', 115, 23, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.line(20, 29, 190, 29);

  // Student info
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.text('Estudiante:', 20, 37);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${firstName} ${lastName}${gradeCourse ? ` (${gradeCourse})` : ''}`, 42, 37);

  doc.setFont('Helvetica', 'bold');
  doc.text('Fecha:', 130, 37);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 144, 37);

  // Section 1: Exercises
  let y = 47;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text('1. Parte 1: Ejercicios Interactivos de Aplicación', 20, y);
  y += 6;

  doc.setFontSize(8.5);
  exercises.forEach((ex, idx) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const statusTag = ex.isCorrect === true ? '[Correcto]' : ex.isCorrect === false ? '[Por mejorar]' : '';
    doc.text(`${idx + 1}. ${ex.title} ${statusTag}`, 20, y);
    y += 4.5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const answerLines = doc.splitTextToSize(`Respuesta: ${ex.answer || 'Sin responder'}`, 165);
    doc.text(answerLines, 24, y);
    y += answerLines.length * 4 + 3;
  });

  // Section 2: Quiz
  y += 3;
  if (y > 245) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text(`2. Parte 2: Test de Conocimientos — Calificación: ${quizScore} / 5.0 (${correctCount}/5 aciertos)`, 20, y);
  y += 6;

  doc.setFontSize(8.5);
  quizItems.forEach((q) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const qLines = doc.splitTextToSize(`Pregunta ${q.questionNumber}: ${q.questionText}`, 168);
    doc.text(qLines, 20, y);
    y += qLines.length * 4;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(q.isCorrect ? 21 : 185, q.isCorrect ? 128 : 28, q.isCorrect ? 61 : 28);
    const ansLines = doc.splitTextToSize(
      `Selección: ${q.selectedText} (${q.isCorrect ? 'Correcta' : 'Incorrecta'})`,
      164
    );
    doc.text(ansLines, 24, y);
    y += ansLines.length * 4 + 3;
  });

  // Optional Section 3: Saved References if any
  if (savedReferences.length > 0) {
    y += 4;
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 217);
    doc.text(`3. Referencias Generadas en el Gestor (${savedReferences.length})`, 20, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    savedReferences.forEach((ref, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const refLines = doc.splitTextToSize(`[${i + 1}] (${ref.style.toUpperCase()}) ${ref.referencePlain}`, 165);
      doc.text(refLines, 20, y);
      y += refLines.length * 4 + 2.5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Plataforma Cita Master • Colegio Ekirayá — Excelencia y Probidad Académica', 105, 286, { align: 'center' });

  const safeLast = lastName.replace(/\s+/g, '_') || 'Estudiante';
  const safeFirst = firstName.replace(/\s+/g, '_') || '';
  doc.save(`Taller_CitaMaster_${safeLast}_${safeFirst}.pdf`);
}

export async function exportBibliographyToPDF(references: SavedReference[]): Promise<void> {
  if (references.length === 0) return;

  const doc = new jsPDF();
  const logoData = await loadLogoBase64(EKIRAYA_LOGO_URL);

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 20, 12, 28, 14);
    } catch {
      // Ignore
    }
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(109, 40, 217);
  doc.text('COLEGIO EKIRAYÁ — CITA MASTER', 115, 17, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Lista Oficial de Referencias Bibliográficas', 115, 23, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.line(20, 29, 190, 29);

  let y = 39;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Referencias', 105, y, { align: 'center' });
  y += 9;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  // Sort alphabetically by sortKey
  const sorted = [...references].sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'es'));

  sorted.forEach((ref) => {
    if (y > 268) {
      doc.addPage();
      y = 20;
    }
    // Simulate hanging indent: first line at x=20 (width 170), subsequent lines at x=30 (width 160)
    const firstLineCandidates = doc.splitTextToSize(ref.referencePlain, 170);
    if (firstLineCandidates.length === 1) {
      doc.text(firstLineCandidates[0], 20, y);
      y += 7;
    } else {
      const firstLine = firstLineCandidates[0];
      doc.text(firstLine, 20, y);
      y += 5;
      const remainingText = ref.referencePlain.slice(firstLine.length).trim();
      if (remainingText) {
        const indentedLines = doc.splitTextToSize(remainingText, 160);
        doc.text(indentedLines, 30, y);
        y += indentedLines.length * 5 + 3;
      } else {
        y += 3;
      }
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generado con Cita Master • Colegio Ekirayá • ${new Date().toLocaleDateString('es-CO')}`,
    105,
    286,
    { align: 'center' }
  );

  doc.save('Referencias_Bibliografia_Ekiraya.pdf');
}
