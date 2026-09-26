import { jsPDF } from 'jspdf';
import { SavedReference } from '../types/citation';
import { SOURCE_TYPE_LABELS, STYLE_LABELS } from './citationEngine';

const EKIRAYA_LOGO_URL =
  'https://colegioekiraya.edu.co/wp-content/uploads/2024/09/LOGO-CEM-COLOR-02.png';

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

function addPageFooters(doc: jsPDF, footerText: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 280, 190, 280);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(footerText, 20, 286);
    doc.text(`Página ${i} de ${pageCount}`, 190, 286, { align: 'right' });
  }
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

  // A4 portrait: width = 210mm, height = 297mm. Safe horizontal margins: 20mm to 190mm (width = 170mm).
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoBase64(EKIRAYA_LOGO_URL);

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 20, 12, 26, 13);
    } catch {
      // Fallback if image format fails
    }
  }

  // Header (centered in available space to the right of the logo: x=50 to x=190 -> center=120, max width=136)
  const headerCenterX = logoData ? 120 : 105;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59);
  doc.text('COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI', headerCenterX, 17, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Cita Master — Reporte de Taller Práctico y Evaluación Académica',
    headerCenterX,
    23,
    { align: 'center' }
  );

  doc.setDrawColor(203, 213, 225);
  doc.line(20, 29, 190, 29);

  // Student info box (wrapped safely within 170mm)
  let y = 36;
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const studentFull = `${firstName} ${lastName}${gradeCourse ? ` — Curso: ${gradeCourse}` : ''}`;
  const dateFull = `${new Date().toLocaleDateString('es-CO')} • ${new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  doc.setFont('Helvetica', 'bold');
  doc.text('Estudiante:', 20, y);
  doc.setFont('Helvetica', 'normal');
  const studentLines = doc.splitTextToSize(studentFull, 145);
  doc.text(studentLines, 40, y);
  y += studentLines.length * 4.5 + 1;

  doc.setFont('Helvetica', 'bold');
  doc.text('Fecha de presentación:', 20, y);
  doc.setFont('Helvetica', 'normal');
  doc.text(dateFull, 58, y);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);
  y += 7;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > 272) {
      doc.addPage();
      y = 20;
    }
  };

  // Section 1: Exercises
  ensureSpace(15);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text('1. Parte 1: Ejercicios Interactivos de Aplicación', 20, y);
  y += 6.5;

  exercises.forEach((ex, idx) => {
    const statusTag =
      ex.isCorrect === true
        ? ' [Correcto]'
        : ex.isCorrect === false
        ? ' [Por mejorar]'
        : '';

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    // Strict width: 170mm (from x=20 to x=190)
    const questionLines: string[] = doc.splitTextToSize(
      `${idx + 1}. ${ex.title}${statusTag}`,
      170
    );

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    // Strict width for indented answer: 166mm (from x=24 to x=190)
    const answerLines: string[] = doc.splitTextToSize(
      `Respuesta: ${ex.answer || 'Sin responder'}`,
      166
    );

    const feedbackLines: string[] =
      ex.feedback && ex.answer
        ? doc.splitTextToSize(`Retroalimentación: ${ex.feedback}`, 166)
        : [];

    const blockHeight =
      questionLines.length * 4.2 +
      answerLines.length * 4.2 +
      (feedbackLines.length > 0 ? feedbackLines.length * 4 + 1.5 : 0) +
      4;

    ensureSpace(blockHeight);

    // Render Exercise Question
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(questionLines, 20, y);
    y += questionLines.length * 4.2 + 0.5;

    // Render Exercise Answer
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(answerLines, 24, y);
    y += answerLines.length * 4.2;

    // Render Feedback if present
    if (feedbackLines.length > 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(
        ex.isCorrect ? 21 : 180,
        ex.isCorrect ? 128 : 83,
        ex.isCorrect ? 61 : 9
      );
      doc.text(feedbackLines, 24, y);
      y += feedbackLines.length * 4;
    }

    y += 3.5;
  });

  // Section 2: Quiz
  y += 2;
  ensureSpace(18);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  const quizHeaderLines = doc.splitTextToSize(
    `2. Parte 2: Test de Conocimientos — Calificación: ${quizScore} / 5.0 (${correctCount} de 5 aciertos)`,
    170
  );
  doc.text(quizHeaderLines, 20, y);
  y += quizHeaderLines.length * 5 + 2.5;

  quizItems.forEach((q) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    // Strict width 170mm (x=20 to x=190)
    const qLines: string[] = doc.splitTextToSize(
      `Pregunta ${q.questionNumber}: ${q.questionText}`,
      170
    );

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    // Strict width 166mm (x=24 to x=190)
    const ansLines: string[] = doc.splitTextToSize(
      `Selección: ${q.selectedText} (${q.isCorrect ? 'Correcta' : 'Incorrecta'})`,
      166
    );

    const itemHeight = qLines.length * 4.2 + ansLines.length * 4.2 + 3.5;
    ensureSpace(itemHeight);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(qLines, 20, y);
    y += qLines.length * 4.2 + 0.5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(
      q.isCorrect ? 21 : 185,
      q.isCorrect ? 128 : 28,
      q.isCorrect ? 61 : 28
    );
    doc.text(ansLines, 24, y);
    y += ansLines.length * 4.2 + 3;
  });

  // Optional Section 3: Saved References & Citations if any
  if (savedReferences.length > 0) {
    y += 3;
    ensureSpace(16);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 217);
    doc.text(
      `3. Citas y Referencias Guardadas en el Gestor (${savedReferences.length})`,
      20,
      y
    );
    y += 6.5;

    savedReferences.forEach((ref, i) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      const labelLine = `[${i + 1}] ${STYLE_LABELS[ref.style] || ref.style.toUpperCase()} — ${
        SOURCE_TYPE_LABELS[ref.sourceType] || ref.sourceType
      }`;
      const labelLines: string[] = doc.splitTextToSize(labelLine, 170);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      const refLines: string[] = doc.splitTextToSize(
        `Referencia: ${ref.referencePlain}`,
        166
      );
      const citesLine = `Cita Parentética: ${ref.parenthetical}   |   Cita Narrativa: ${ref.narrative}`;
      const citeLines: string[] = doc.splitTextToSize(citesLine, 166);

      const totalH =
        labelLines.length * 4.2 +
        refLines.length * 4.2 +
        citeLines.length * 4.2 +
        4;
      ensureSpace(totalH);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(109, 40, 217);
      doc.text(labelLines, 20, y);
      y += labelLines.length * 4.2 + 0.5;

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(refLines, 24, y);
      y += refLines.length * 4.2 + 0.5;

      doc.setFont('Helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(citeLines, 24, y);
      y += citeLines.length * 4.2 + 3.5;
    });
  }

  addPageFooters(
    doc,
    'Plataforma Cita Master • Colegio Ekirayá — Excelencia y Probidad Académica'
  );

  const safeLast = lastName.replace(/\s+/g, '_') || 'Estudiante';
  const safeFirst = firstName.replace(/\s+/g, '_') || '';
  doc.save(`Taller_CitaMaster_${safeLast}_${safeFirst}.pdf`);
}

/**
 * Renders a single reference paragraph with authentic hanging indentation (sangría francesa)
 * strictly contained within x=20mm and x=190mm (170mm total width).
 */
function renderHangingIndentParagraph(
  doc: jsPDF,
  text: string,
  startX: number,
  startY: number,
  fullWidth: number,
  indentOffset: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return startY;

  const lines: { text: string; x: number }[] = [];
  let currentLine = '';
  let isFirstLine = true;

  for (const word of words) {
    const maxWidth = isFirstLine ? fullWidth : fullWidth - indentOffset;
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = doc.getTextWidth(candidate);

    if (candidateWidth <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push({
          text: currentLine,
          x: isFirstLine ? startX : startX + indentOffset,
        });
        isFirstLine = false;
      }
      // If a single word (like a very long URL) exceeds maxWidth, split it safely
      const currentMax = isFirstLine ? fullWidth : fullWidth - indentOffset;
      if (doc.getTextWidth(word) > currentMax) {
        const chunks: string[] = doc.splitTextToSize(word, currentMax);
        for (let c = 0; c < chunks.length - 1; c++) {
          lines.push({
            text: chunks[c],
            x: isFirstLine ? startX : startX + indentOffset,
          });
          isFirstLine = false;
        }
        currentLine = chunks[chunks.length - 1] || '';
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push({
      text: currentLine,
      x: isFirstLine ? startX : startX + indentOffset,
    });
  }

  let y = startY;
  for (const line of lines) {
    doc.text(line.text, line.x, y);
    y += lineHeight;
  }
  return y;
}

export async function exportBibliographyToPDF(
  references: SavedReference[]
): Promise<void> {
  if (references.length === 0) return;

  // A4 portrait: 210mm x 297mm. Margins: left=20mm, right=190mm (170mm printable width)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoBase64(EKIRAYA_LOGO_URL);

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 20, 12, 26, 13);
    } catch {
      // Ignore
    }
  }

  const headerCenterX = logoData ? 120 : 105;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(109, 40, 217);
  doc.text('COLEGIO EKIRAYÁ — CITA MASTER', headerCenterX, 17, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Reporte Oficial de Citas en el Texto y Referencias Bibliográficas',
    headerCenterX,
    23,
    { align: 'center' }
  );

  doc.setDrawColor(203, 213, 225);
  doc.line(20, 29, 190, 29);

  let y = 38;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Lista de Referencias y Citas Correspondientes', 105, y, {
    align: 'center',
  });
  y += 8;

  // Sort alphabetically by sortKey
  const sorted = [...references].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey, 'es')
  );

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > 272) {
      doc.addPage();
      y = 20;
    }
  };

  sorted.forEach((ref, index) => {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    const estRefLines = doc.splitTextToSize(ref.referencePlain, 160);
    const parLines = doc.splitTextToSize(
      `• Cita Parentética (en el párrafo): ${ref.parenthetical}`,
      160
    );
    const narLines = doc.splitTextToSize(
      `• Cita Narrativa (en el párrafo): ${ref.narrative}`,
      160
    );

    const estimatedBlockHeight =
      6 +
      estRefLines.length * 4.8 +
      parLines.length * 4.5 +
      narLines.length * 4.5 +
      10;

    ensureSpace(estimatedBlockHeight);

    // 1. Metadata header for the entry
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(109, 40, 217);
    const metaLabel = `${index + 1}. Norma: ${
      STYLE_LABELS[ref.style] || ref.style.toUpperCase()
    }  •  Tipo: ${SOURCE_TYPE_LABELS[ref.sourceType] || ref.sourceType}`;
    doc.text(doc.splitTextToSize(metaLabel, 170), 20, y);
    y += 5;

    // 2. Full Reference with Hanging Indent (Sangría Francesa)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    y = renderHangingIndentParagraph(
      doc,
      ref.referencePlain,
      20,
      y,
      170,
      10,
      4.8
    );
    y += 1.5;

    // 3. Box with Parenthetical and Narrative In-Text Citations
    const boxTop = y;
    const boxContentHeight =
      parLines.length * 4.4 + narLines.length * 4.4 + 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(24, boxTop, 166, boxContentHeight, 1.5, 1.5, 'FD');

    let boxY = boxTop + 4.2;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(parLines, 27, boxY);
    boxY += parLines.length * 4.4;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(narLines, 27, boxY);

    y = boxTop + boxContentHeight + 6;
  });

  addPageFooters(
    doc,
    `Generado con Cita Master • Colegio Ekirayá • ${new Date().toLocaleDateString('es-CO')}`
  );

  doc.save('Citas_y_Referencias_Ekiraya.pdf');
}
