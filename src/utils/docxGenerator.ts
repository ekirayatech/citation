import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { SavedReference } from '../types/citation';
import { SOURCE_TYPE_LABELS, STYLE_LABELS } from './citationEngine';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Parses an HTML reference string containing <i>...</i> or <em>...</em> tags
 * into an array of docx TextRun objects preserving italics.
 */
function parseReferenceHtmlToRuns(
  html: string,
  fontSizeHalfPts = 24,
  fontFamily = 'Times New Roman'
): TextRun[] {
  const runs: TextRun[] = [];
  const normalized = html.replace(/<(\/?)em>/gi, '<$1i>');
  const parts = normalized.split(/(<i>.*?<\/i>)/gi);

  for (const part of parts) {
    if (!part) continue;
    const isItalic =
      part.toLowerCase().startsWith('<i>') &&
      part.toLowerCase().endsWith('</i>');
    const rawContent = isItalic ? part.slice(3, -4) : part;
    const cleanText = decodeHtmlEntities(rawContent.replace(/<[^>]+>/g, ''));

    if (cleanText) {
      runs.push(
        new TextRun({
          text: cleanText,
          italics: isItalic,
          size: fontSizeHalfPts,
          font: fontFamily,
          color: '0F172A',
        })
      );
    }
  }

  return runs;
}

/**
 * Exports all saved references to a .docx Word file preserving authentic
 * hanging indentation (sangría francesa: 1.27 cm / 0.5 in = 720 twips)
 * and italic formatting.
 */
export async function exportBibliographyToDocx(
  references: SavedReference[]
): Promise<void> {
  if (references.length === 0) return;

  const sorted = [...references].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey, 'es')
  );

  const dateStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Pure References list with authentic Hanging Indent (Sangría Francesa)
  const referenceParagraphs: Paragraph[] = sorted.map((ref) => {
    const runs = ref.referenceHtml
      ? parseReferenceHtmlToRuns(ref.referenceHtml, 24, 'Times New Roman')
      : [
          new TextRun({
            text: ref.referencePlain,
            size: 24,
            font: 'Times New Roman',
            color: '0F172A',
          }),
        ];

    return new Paragraph({
      children: runs,
      indent: {
        left: 720, // 0.5 inches (1.27 cm) standard hanging indent
        hanging: 720,
      },
      spacing: {
        line: 480, // Double spacing (2.0) standard in APA / academic bibliographies
        after: 160,
      },
    });
  });

  // 2. Detailed table/list of In-Text Citations (Parenthetical & Narrative) per source
  const citationDetailParagraphs: Paragraph[] = [];
  sorted.forEach((ref, idx) => {
    const styleName = STYLE_LABELS[ref.style] || ref.style.toUpperCase();
    const typeName = SOURCE_TYPE_LABELS[ref.sourceType] || ref.sourceType;

    citationDetailParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${idx + 1}. ${styleName} — ${typeName}`,
            bold: true,
            size: 20,
            font: 'Arial',
            color: '5B21B6',
          }),
        ],
        spacing: { before: 160, after: 60 },
      })
    );

    citationDetailParagraphs.push(
      new Paragraph({
        children: ref.referenceHtml
          ? parseReferenceHtmlToRuns(ref.referenceHtml, 21, 'Times New Roman')
          : [
              new TextRun({
                text: ref.referencePlain,
                size: 21,
                font: 'Times New Roman',
              }),
            ],
        indent: {
          left: 720,
          hanging: 720,
        },
        spacing: { line: 320, after: 80 },
      })
    );

    citationDetailParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Cita parentética: ',
            bold: true,
            size: 19,
            font: 'Arial',
            color: '334155',
          }),
          new TextRun({
            text: `${ref.parenthetical}     |     `,
            size: 19,
            font: 'Arial',
            color: '0F172A',
          }),
          new TextRun({
            text: 'Cita narrativa: ',
            bold: true,
            size: 19,
            font: 'Arial',
            color: '334155',
          }),
          new TextRun({
            text: ref.narrative,
            size: 19,
            font: 'Arial',
            color: '0F172A',
          }),
        ],
        indent: { left: 360 },
        spacing: { after: 180 },
      })
    );
  });

  const doc = new Document({
    creator: 'Cita Master — Colegio Ekirayá Educación Montessori',
    title: 'Referencias Bibliográficas — Cita Master',
    description:
      'Lista de referencias bibliográficas con sangría francesa y guía de citas en el texto',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (2.54 cm) margins on all sides
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Institutional Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'COLEGIO EKIRAYÁ EDUCACIÓN MONTESSORI',
                bold: true,
                size: 24,
                font: 'Arial',
                color: '5B21B6',
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Cita Master — Lista de Referencias Bibliográficas (${dateStr})`,
                size: 19,
                font: 'Arial',
                color: '64748B',
              }),
            ],
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 8,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { after: 360 },
          }),

          // Main Bibliography Heading (APA/Academic Centered Bold Title)
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Referencias',
                bold: true,
                size: 24,
                font: 'Times New Roman',
                color: '0F172A',
              }),
            ],
            spacing: { before: 120, after: 240 },
          }),

          // References with Hanging Indent
          ...referenceParagraphs,

          // Divider & Section 2: Quick Reference for In-Text Citations
          new Paragraph({
            border: {
              top: {
                color: 'E2E8F0',
                space: 12,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { before: 480, after: 200 },
            children: [
              new TextRun({
                text: 'Anexo: Guía de Citas en el Texto (Parentéticas y Narrativas)',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '5B21B6',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Utiliza las siguientes formas abreviadas dentro de los párrafos de tu trabajo académico según corresponda:',
                italics: true,
                size: 19,
                font: 'Arial',
                color: '475569',
              }),
            ],
            spacing: { after: 160 },
          }),
          ...citationDetailParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Referencias_Ekiraya.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
