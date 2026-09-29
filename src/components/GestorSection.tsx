import React, { useState } from 'react';
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Download,
  FileText,
  RotateCcw,
  Sparkles,
  UserPlus,
  Building2,
  User,
  ArrowUpDown,
  Pencil,
  Quote,
  BookOpen,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AudiovisualSubtype,
  AuthorMode,
  BookSubtype,
  CitationFormData,
  CitationStyle,
  LegalSubtype,
  LocatorType,
  NewspaperSubtype,
  SavedReference,
  SocialMediaSubtype,
  SourceType,
  ThesisSubtype,
} from '../types/citation';
import {
  APA_DOCUMENT_EXAMPLES,
  EXAMPLE_PRESETS,
  generateCitationOutput,
  INITIAL_FORM_DATA,
  SOURCE_TYPE_LABELS,
  STYLE_LABELS,
} from '../utils/citationEngine';
import { exportBibliographyToPDF } from '../utils/pdfGenerator';
import { exportBibliographyToDocx } from '../utils/docxGenerator';

interface GestorSectionProps {
  formData: CitationFormData;
  setFormData: React.Dispatch<React.SetStateAction<CitationFormData>>;
  savedReferences: SavedReference[];
  onAddReference: (ref: SavedReference) => void;
  onRemoveReference: (id: string) => void;
  onClearReferences: () => void;
  showToast: (msg: string) => void;
}

export const GestorSection: React.FC<GestorSectionProps> = ({
  formData,
  setFormData,
  savedReferences,
  onAddReference,
  onRemoveReference,
  onClearReferences,
  showToast,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState<boolean>(true);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [selectedDocExampleId, setSelectedDocExampleId] = useState<string>(
    APA_DOCUMENT_EXAMPLES[0].id
  );
  const [showSpecialCases, setShowSpecialCases] = useState<boolean>(false);

  const generated = generateCitationOutput(formData);

  const handleFieldChange = <K extends keyof CitationFormData>(
    key: K,
    value: CitationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuthorModeChange = (mode: AuthorMode) => {
    setFormData((prev) => ({
      ...prev,
      authorMode: mode,
      isInstitutionalAuthor: mode === 'institutional',
    }));
  };

  const handleAuthorChange = (
    index: number,
    field: 'firstName' | 'lastName',
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.authors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, authors: updated };
    });
  };

  const addCoAuthor = () => {
    setFormData((prev) => ({
      ...prev,
      authors: [...prev.authors, { firstName: '', lastName: '' }],
    }));
  };

  const removeCoAuthor = (index: number) => {
    if (formData.authors.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
    }));
  };

  const loadPresetExample = () => {
    const preset = EXAMPLE_PRESETS[formData.sourceType];
    setFormData((prev) => ({
      ...INITIAL_FORM_DATA,
      sourceType: prev.sourceType,
      style: prev.style,
      ...preset,
    }));
    showToast(`Ejemplo de ${SOURCE_TYPE_LABELS[formData.sourceType].split(' (')[0]} cargado`);
  };

  const loadOfficialDocumentExample = (exampleId: string) => {
    const found = APA_DOCUMENT_EXAMPLES.find((e) => e.id === exampleId);
    if (!found) return;
    setFormData({
      ...INITIAL_FORM_DATA,
      ...found.formData,
    });
    showToast(`Plantilla cargada: ${found.title}`);
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...INITIAL_FORM_DATA,
      sourceType: prev.sourceType,
      style: prev.style,
    }));
    showToast('Formulario limpiado');
  };

  const copyText = async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedField(id);
    showToast(`${label} copiada al portapapeles`);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSaveToBibliography = () => {
    if (!generated.requiresReferenceList) {
      showToast(
        'Las comunicaciones personales solo se citan en el texto y no van en la lista de referencias'
      );
      return;
    }
    const newRef: SavedReference = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceType: formData.sourceType,
      style: formData.style,
      referenceHtml: generated.referenceHtml,
      referencePlain: generated.referencePlain,
      parenthetical: generated.parenthetical,
      narrative: generated.narrative,
      sortKey: generated.sortKey,
      createdAt: new Date().toISOString(),
      formData: {
        ...formData,
        authors: formData.authors.map((a) => ({ ...a })),
      },
    };
    onAddReference(newRef);
    showToast('Referencia guardada en tu lista bibliográfica');
  };

  const handleEditReference = (ref: SavedReference) => {
    if (ref.formData) {
      setFormData(ref.formData);
      showToast('Datos cargados en el formulario para edición');
    }
  };

  const displayedReferences = [...savedReferences]
    .filter((r) => (styleFilter === 'all' ? true : r.style === styleFilter))
    .sort((a, b) =>
      sortAlphabetically
        ? a.sortKey.localeCompare(b.sortKey, 'es')
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleCopyAllReferences = () => {
    if (displayedReferences.length === 0) {
      showToast('No hay referencias en la lista para copiar');
      return;
    }
    const text = displayedReferences.map((r) => r.referencePlain).join('\n\n');
    copyText(text, 'copy-all', 'Bibliografía completa');
  };

  const handleDownloadTxt = () => {
    if (displayedReferences.length === 0) {
      showToast('La lista está vacía');
      return;
    }
    const header =
      'COLEGIO EKIRAYÁ — CITA MASTER\nLISTA DE REFERENCIAS BIBLIOGRÁFICAS\n==================================================\n\n';
    const body = displayedReferences
      .map(
        (r, i) =>
          `[${i + 1}] (${r.style.toUpperCase()})\nReferencia: ${r.referencePlain}\nCita Parentética: ${r.parenthetical} | Cita Narrativa: ${r.narrative}`
      )
      .join('\n\n--------------------------------------------------\n\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Referencias_Ekiraya.txt';
    link.click();
    showToast('Archivo Referencias_Ekiraya.txt descargado');
  };

  const handleDownloadPdf = async () => {
    if (displayedReferences.length === 0) {
      showToast('La lista está vacía');
      return;
    }
    await exportBibliographyToPDF(displayedReferences);
    showToast('Citas y referencias exportadas a PDF');
  };

  const handleDownloadDocx = async () => {
    if (displayedReferences.length === 0) {
      showToast('La lista está vacía');
      return;
    }
    await exportBibliographyToDocx(displayedReferences);
    showToast('Archivo Word (.docx) con sangría francesa descargado');
  };

  const { sourceType } = formData;
  const currentAuthorMode: AuthorMode =
    formData.authorMode || (formData.isInstitutionalAuthor ? 'institutional' : 'personal');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLUMNA IZQUIERDA: FORMULARIO DINÁMICO ROBUSTECIDO (PÁGS. 20–36) */}
      <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-medium text-violet-700">
              Generador Inteligente Multi-Norma · Normas APA 7.ª Edición
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Cita Master — Datos de la Fuente
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPresetExample}
              className="px-3 py-1.5 text-xs font-semibold text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar ejemplo
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Barra Rápida: Catálogo de 23 Ejemplos Reales del Documento APA (Págs. 20 a 35) */}
        <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-violet-200/90 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="docExampleSelect"
              className="text-xs font-semibold text-violet-950 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-700 shrink-0" />
              <span>Plantillas y Ejemplos Reales del Manual APA:</span>
            </label>
            <span className="text-[11px] font-medium text-violet-700">23 casos oficiales</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              id="docExampleSelect"
              value={selectedDocExampleId}
              onChange={(e) => {
                setSelectedDocExampleId(e.target.value);
                loadOfficialDocumentExample(e.target.value);
              }}
              className="flex-1 rounded-lg border border-violet-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              {APA_DOCUMENT_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.categoryLabel} — {ex.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadOfficialDocumentExample(selectedDocExampleId)}
              className="px-3 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Aplicar plantilla
            </button>
          </div>
        </div>

        {/* Selectores Principales: Tipo de Fuente (12 categorías) y Estilo Bibliográfico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sourceTypeSelect"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Tipo de Fuente / Recurso (12 Categorías)
            </label>
            <select
              id="sourceTypeSelect"
              value={formData.sourceType}
              onChange={(e) =>
                handleFieldChange('sourceType', e.target.value as SourceType)
              }
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-600 bg-white"
            >
              {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((key) => (
                <option key={key} value={key}>
                  {SOURCE_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="styleSelect"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Estilo Bibliográfico
            </label>
            <select
              id="styleSelect"
              value={formData.style}
              onChange={(e) =>
                handleFieldChange('style', e.target.value as CitationStyle)
              }
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm font-semibold text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-600 bg-violet-50/40"
            >
              {(Object.keys(STYLE_LABELS) as CitationStyle[]).map((key) => (
                <option key={key} value={key}>
                  {STYLE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUBTIPOS ESPECÍFICOS SEGÚN LA CATEGORÍA (PÁGS. 25-35) */}
        {sourceType === 'book' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Modalidad de Libro:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'authored' as BookSubtype, label: 'Libro con autor' },
                  { id: 'edited' as BookSubtype, label: 'Libro con editor (Ed.)' },
                  { id: 'electronic' as BookSubtype, label: 'Versión electrónica' },
                  { id: 'translated' as BookSubtype, label: 'Libro con traducción' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleFieldChange('bookSubtype', sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (formData.bookSubtype || 'authored') === sub.id
                        ? 'bg-violet-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.bookSubtype === 'translated' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre del Traductor (Trad.)
                  </label>
                  <input
                    type="text"
                    value={formData.translator || ''}
                    onChange={(e) => handleFieldChange('translator', e.target.value)}
                    placeholder="Ej. H. Weaver"
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Año de Publicación Original (ej. 1966)
                  </label>
                  <input
                    type="text"
                    value={formData.originalYear || ''}
                    onChange={(e) => handleFieldChange('originalYear', e.target.value)}
                    placeholder="Ej. 1966 (genera cita 1966/1969)"
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {sourceType === 'newspaper' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Tipo de Publicación Periódica:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'newspaper_print' as NewspaperSubtype, label: 'Periódico impreso' },
                { id: 'newspaper_online' as NewspaperSubtype, label: 'Periódico en línea' },
                { id: 'magazine_print' as NewspaperSubtype, label: 'Revista (Magazine) impresa' },
                { id: 'magazine_online' as NewspaperSubtype, label: 'Revista (Magazine) en línea' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleFieldChange('newspaperSubtype', sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    (formData.newspaperSubtype || 'newspaper_online') === sub.id
                      ? 'bg-violet-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {sourceType === 'thesis' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modalidad de Publicación
              </label>
              <select
                value={formData.thesisSubtype || 'online_archive'}
                onChange={(e) =>
                  handleFieldChange('thesisSubtype', e.target.value as ThesisSubtype)
                }
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
              >
                <option value="online_archive">Publicada en línea (Archivo digital)</option>
                <option value="database">Publicada en una base de datos en línea</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nivel Académico
              </label>
              <select
                value={formData.thesisLevel || 'Tesis de pregrado'}
                onChange={(e) => handleFieldChange('thesisLevel', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
              >
                <option value="Tesis de pregrado">Tesis de pregrado</option>
                <option value="Tesis de maestría">Tesis de maestría</option>
                <option value="Tesis de doctorado">Tesis de doctorado</option>
                <option value="Trabajo de grado">Trabajo de grado</option>
              </select>
            </div>
            {formData.thesisSubtype === 'database' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Base de Datos
                </label>
                <input
                  type="text"
                  value={formData.databaseName || ''}
                  onChange={(e) => handleFieldChange('databaseName', e.target.value)}
                  placeholder="Ej. Dissertations & Theses A&I"
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
                />
              </div>
            )}
          </div>
        )}

        {sourceType === 'audiovisual' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Formato Audiovisual:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'film' as AudiovisualSubtype, label: 'Película', role: 'Director' },
                  {
                    id: 'tv_series' as AudiovisualSubtype,
                    label: 'Serie de TV',
                    role: 'Productora',
                  },
                  { id: 'video' as AudiovisualSubtype, label: 'Video (YouTube)', role: '' },
                  {
                    id: 'webinar' as AudiovisualSubtype,
                    label: 'Seminario web grabado',
                    role: '',
                  },
                  { id: 'podcast' as AudiovisualSubtype, label: 'Podcast', role: '' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      handleFieldChange('audiovisualSubtype', sub.id);
                      if (sub.role) handleFieldChange('mediaRole', sub.role);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (formData.audiovisualSubtype || 'video') === sub.id
                        ? 'bg-violet-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {sourceType === 'social_media' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Red Social
              </label>
              <select
                value={formData.socialSubtype || 'tweet'}
                onChange={(e) =>
                  handleFieldChange('socialSubtype', e.target.value as SocialMediaSubtype)
                }
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
              >
                <option value="tweet">X / Twitter ([Tweet])</option>
                <option value="facebook">Facebook ([Publicación])</option>
                <option value="instagram">Instagram ([Fotografía])</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usuario [@handle] (Para Twitter e Instagram)
              </label>
              <input
                type="text"
                value={formData.socialHandle || ''}
                onChange={(e) => handleFieldChange('socialHandle', e.target.value)}
                placeholder="Ej. @fundeu o @centrodescritura"
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>
        )}

        {sourceType === 'legal' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Tipo de Referencia Jurídica / Legal:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'sentence' as LegalSubtype, label: '4.5.1 Sentencia Judicial' },
                  { id: 'law' as LegalSubtype, label: '4.5.2 Ley de la República' },
                  {
                    id: 'treaty' as LegalSubtype,
                    label: '4.5.3 Tratado o Convención Internacional',
                  },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleFieldChange('legalSubtype', sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (formData.legalSubtype || 'sentence') === sub.id
                        ? 'bg-violet-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CAMPOS DINÁMICOS SEGÚN EL TIPO DE FUENTE */}
        {sourceType === 'ai' ? (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Empresa / Desarrollador Creador
                </label>
                <input
                  type="text"
                  value={formData.aiCompany}
                  onChange={(e) => handleFieldChange('aiCompany', e.target.value)}
                  placeholder="Ej. OpenAI, Google, Anthropic"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre del Modelo / IA
                </label>
                <input
                  type="text"
                  value={formData.aiModel}
                  onChange={(e) => handleFieldChange('aiModel', e.target.value)}
                  placeholder="Ej. ChatGPT, Gemini, Claude"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Versión o Edición del Modelo
                </label>
                <input
                  type="text"
                  value={formData.aiVersion}
                  onChange={(e) => handleFieldChange('aiVersion', e.target.value)}
                  placeholder="Ej. GPT-4o / Versión marzo 2026"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Año de la Versión / Consulta
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  placeholder="Ej. 2026"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descripción del Prompt o Tema Consultado (Opcional pero recomendado)
              </label>
              <input
                type="text"
                value={formData.aiPromptDescription}
                onChange={(e) => handleFieldChange('aiPromptDescription', e.target.value)}
                placeholder="Ej. Explicación sobre las causas del cambio climático"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fecha de Consulta
                </label>
                <input
                  type="date"
                  value={formData.accessDate}
                  onChange={(e) => handleFieldChange('accessDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL de la Herramienta o Conversación
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="Ej. https://chatgpt.com"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>
          </div>
        ) : sourceType === 'legal' ? (
          /* Formulario específico para Referencias Legales (Págs. 34-35) */
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {formData.legalSubtype === 'sentence'
                  ? 'Título o Número de la Sentencia'
                  : formData.legalSubtype === 'law'
                  ? 'Nombre y Número de la Ley'
                  : 'Nombre del Tratado o Convención Internacional'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder={
                  formData.legalSubtype === 'sentence'
                    ? 'Ej. Sentencia T-006/20'
                    : formData.legalSubtype === 'law'
                    ? 'Ej. Ley 1090 de 2006'
                    : 'Ej. Pacto Internacional de Derechos Económicos, Sociales y Culturales'
                }
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Año de Expedición
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  placeholder="Ej. 2020 o 2006"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Día y Mes Exacto
                </label>
                <input
                  type="text"
                  value={formData.exactDate || ''}
                  onChange={(e) => handleFieldChange('exactDate', e.target.value)}
                  placeholder="Ej. 17 de enero / 6 de septiembre"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            {formData.legalSubtype !== 'treaty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {formData.legalSubtype === 'sentence'
                      ? 'Corte o Tribunal que publica'
                      : 'Entidad que promulga la ley (Fuente)'}
                  </label>
                  <input
                    type="text"
                    value={formData.legalCourtOrBody || ''}
                    onChange={(e) => handleFieldChange('legalCourtOrBody', e.target.value)}
                    placeholder={
                      formData.legalSubtype === 'sentence'
                        ? 'Ej. Corte Constitucional'
                        : 'Ej. Congreso de la República'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {formData.legalSubtype === 'sentence'
                      ? 'Magistrado Ponente (M.P.)'
                      : 'Diario Oficial / Sección o Artículo'}
                  </label>
                  <input
                    type="text"
                    value={formData.legalJudgeOrSection || ''}
                    onChange={(e) => handleFieldChange('legalJudgeOrSection', e.target.value)}
                    placeholder={
                      formData.legalSubtype === 'sentence'
                        ? 'Ej. Cristina Pardo, M.P.'
                        : 'Ej. Diario Oficial No 46.383'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Oficial (Relatoría, Secretaría del Senado, ONU, etc.)
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleFieldChange('url', e.target.value)}
                placeholder="Ej. https://www.corteconstitucional.gov.co/..."
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* 1. ¿QUIÉN ES EL AUTOR? (Persona, Institución con Sigla, Sin Autor o Anónimo - Págs. 18, 20 y 23) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  1. ¿Quién es el Autor / Responsable?
                </span>
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleAuthorModeChange('personal')}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      currentAuthorMode === 'personal'
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthorModeChange('institutional')}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      currentAuthorMode === 'institutional'
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    Corporativo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthorModeChange('anonymous_title')}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      currentAuthorMode === 'anonymous_title'
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Pág. 20: Cuando la fuente no tiene autor, se citan las primeras palabras del título"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Sin autor (Título)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthorModeChange('anonymous_literal')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      currentAuthorMode === 'anonymous_literal'
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Pág. 20: Solo cuando la obra está firmada explícitamente como 'Anónimo'"
                  >
                    “Anónimo”
                  </button>
                </div>
              </div>

              {currentAuthorMode === 'institutional' && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nombre Completo de la Organización o Entidad
                    </label>
                    <input
                      type="text"
                      value={formData.institutionalName}
                      onChange={(e) =>
                        handleFieldChange('institutionalName', e.target.value)
                      }
                      placeholder="Ej. Organización Mundial de la Salud / Policía Nacional"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Sigla Oficial (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.institutionalAbbreviation || ''}
                      onChange={(e) =>
                        handleFieldChange('institutionalAbbreviation', e.target.value)
                      }
                      placeholder="Ej. OMS, ONU, PONAL"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                </div>
              )}

              {currentAuthorMode === 'personal' && (
                <div className="space-y-2.5">
                  {formData.authors.map((author, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {index === 0 ? 'Nombre(s) o Iniciales' : `Nombre(s) Coautor ${index + 1}`}
                        </label>
                        <input
                          type="text"
                          value={author.firstName}
                          onChange={(e) =>
                            handleAuthorChange(index, 'firstName', e.target.value)
                          }
                          placeholder="Ej. Luz Stella"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {index === 0
                            ? 'Apellido(s) (con guion si aplica)'
                            : `Apellido(s) Coautor ${index + 1}`}
                        </label>
                        <input
                          type="text"
                          value={author.lastName}
                          onChange={(e) =>
                            handleAuthorChange(index, 'lastName', e.target.value)
                          }
                          placeholder="Ej. Ramírez Osorio o Hoyos-Hernández"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        {formData.authors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCoAuthor(index)}
                            title="Eliminar coautor"
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={addCoAuthor}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Añadir coautor ({formData.authors.length} registrado
                      {formData.authors.length > 1 ? 's' : ''})
                    </button>

                    {formData.authors.length > 1 && formData.style === 'apa7' && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">Conector:</span>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('useSpanishAnd', true)}
                          className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                            formData.useSpanishAnd !== false
                              ? 'bg-violet-100 text-violet-900 border-violet-300 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Español (“y”)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('useSpanishAnd', false)}
                          className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                            formData.useSpanishAnd === false
                              ? 'bg-violet-100 text-violet-900 border-violet-300 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Inglés (“&amp;”)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(currentAuthorMode === 'anonymous_title' ||
                currentAuthorMode === 'anonymous_literal') && (
                <p className="text-xs text-violet-900 bg-violet-100/60 p-2.5 rounded-lg border border-violet-200">
                  {currentAuthorMode === 'anonymous_title'
                    ? 'Regla APA 7: Cuando una obra no tiene autor, la referencia inicia directamente con el título y en la cita del texto se usan las primeras palabras del título.'
                    : 'Regla APA 7: Úsese únicamente cuando la fuente esté firmada explícitamente con la palabra “Anónimo”.'}
                </p>
              )}
            </div>

            {/* Títulos según tipo de fuente */}
            {sourceType === 'chapter' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Título del Capítulo o Entrada
                  </label>
                  <input
                    type="text"
                    value={formData.chapterTitle}
                    onChange={(e) => handleFieldChange('chapterTitle', e.target.value)}
                    placeholder="Ej. La literacidad entendida como práctica social"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Título del Libro (En cursiva)
                    </label>
                    <input
                      type="text"
                      value={formData.bookTitle}
                      onChange={(e) => handleFieldChange('bookTitle', e.target.value)}
                      placeholder="Ej. Escritura y sociedad. Nuevas perspectivas..."
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Editor(es) del Libro (En A. Apellido, Ed. / Eds.)
                    </label>
                    <input
                      type="text"
                      value={formData.bookEditor}
                      onChange={(e) => handleFieldChange('bookEditor', e.target.value)}
                      placeholder="Ej. V. Zavala, M. Niño-Murcia y P. Ames"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {sourceType === 'book'
                    ? 'Título del Libro'
                    : sourceType === 'article'
                    ? 'Título del Artículo Científico'
                    : sourceType === 'newspaper'
                    ? 'Título de la Noticia o Artículo de Prensa'
                    : sourceType === 'report'
                    ? 'Título del Informe Gubernamental o Técnico'
                    : sourceType === 'conference'
                    ? 'Título de la Ponencia o Conferencia'
                    : sourceType === 'audiovisual'
                    ? 'Título de la Película, Serie, Video, Webinar o Podcast'
                    : sourceType === 'social_media'
                    ? 'Contenido o Descripción de la Publicación (máx. 20 palabras)'
                    : sourceType === 'website'
                    ? 'Título de la Página o Entrada Web'
                    : 'Título de la Tesis o Trabajo de Grado'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Escribe el título completo respetando mayúsculas solo al inicio y en nombres propios"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            )}

            {/* Campos específicos para Simposios / Conferencias (Pág. 31) */}
            {sourceType === 'conference' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tipo de Contribución
                  </label>
                  <input
                    type="text"
                    value={formData.conferenceType || ''}
                    onChange={(e) => handleFieldChange('conferenceType', e.target.value)}
                    placeholder="Ej. conferencia, ponencia"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Título del Simposio o Congreso
                  </label>
                  <input
                    type="text"
                    value={formData.conferenceName || ''}
                    onChange={(e) => handleFieldChange('conferenceName', e.target.value)}
                    placeholder="Ej. IV Simposio Internacional sobre Acoso Escolar"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Campos para Revista Científica, Periódico o Sitio Web */}
            {(sourceType === 'article' ||
              sourceType === 'newspaper' ||
              sourceType === 'website') && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div
                  className={
                    sourceType === 'article' ||
                    (sourceType === 'newspaper' &&
                      formData.newspaperSubtype?.startsWith('magazine'))
                      ? 'sm:col-span-6'
                      : 'sm:col-span-12'
                  }
                >
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {sourceType === 'article'
                      ? 'Nombre de la Revista Científica (En cursiva)'
                      : sourceType === 'newspaper'
                      ? 'Nombre del Periódico o Revista (Ej. El País, Apuntes)'
                      : 'Nombre del Sitio Web (Omitir si es igual al autor institucional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.journalName}
                    onChange={(e) => handleFieldChange('journalName', e.target.value)}
                    placeholder={
                      sourceType === 'article'
                        ? 'Ej. Revista Colombiana de Sociología'
                        : sourceType === 'newspaper'
                        ? 'Ej. El País'
                        : 'Dejar vacío si el autor ya es la entidad dueña del sitio (ej. OMS)'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                {(sourceType === 'article' ||
                  (sourceType === 'newspaper' &&
                    formData.newspaperSubtype?.startsWith('magazine'))) && (
                  <>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Volumen
                      </label>
                      <input
                        type="text"
                        value={formData.volume}
                        onChange={(e) => handleFieldChange('volume', e.target.value)}
                        placeholder="Ej. 39"
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.issue}
                        onChange={(e) => handleFieldChange('issue', e.target.value)}
                        placeholder="Ej. 1"
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Año, Fecha Exacta y Localizador de Cita (Página / Párrafo / Marca de Tiempo - Pág. 20) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Año de Publicación
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('year', 's.f.')}
                    className="text-[11px] font-semibold text-violet-700 hover:underline"
                    title="Pág. 20: Usar s.f. cuando no se indica fecha de publicación"
                  >
                    Usar s.f.
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  placeholder="Ej. 2020 o s.f."
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              {(sourceType === 'newspaper' ||
                sourceType === 'conference' ||
                sourceType === 'website' ||
                sourceType === 'audiovisual' ||
                sourceType === 'social_media') && (
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Día y Mes
                  </label>
                  <input
                    type="text"
                    value={formData.exactDate || ''}
                    onChange={(e) => handleFieldChange('exactDate', e.target.value)}
                    placeholder="Ej. 2 de enero / 1 de abril"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}

              {(sourceType === 'book' || sourceType === 'chapter') && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Edición
                  </label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => handleFieldChange('edition', e.target.value)}
                    placeholder="Ej. 2.ª ed."
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}

              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Localizador en Cita
                  </label>
                  <select
                    aria-label="Tipo de localizador"
                    value={formData.locatorType || 'page'}
                    onChange={(e) =>
                      handleFieldChange('locatorType', e.target.value as LocatorType)
                    }
                    className="text-[11px] font-semibold text-violet-800 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5"
                  >
                    <option value="page">Página (p. / pp.)</option>
                    <option value="paragraph">Párrafo (párr.)</option>
                    <option value="timestamp">Tiempo (mm:ss)</option>
                    <option value="section">Sección</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={formData.pages}
                  onChange={(e) => handleFieldChange('pages', e.target.value)}
                  placeholder={
                    formData.locatorType === 'paragraph'
                      ? 'Ej. 4 (genera párr. 4)'
                      : formData.locatorType === 'timestamp'
                      ? 'Ej. 25:36'
                      : 'Ej. 111 o 109-139'
                  }
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            {/* Editorial, Productora, Institución o Número de Informe */}
            {(sourceType === 'book' ||
              sourceType === 'chapter' ||
              sourceType === 'thesis' ||
              sourceType === 'audiovisual' ||
              sourceType === 'report' ||
              sourceType === 'conference') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {sourceType === 'thesis'
                      ? 'Universidad o Institución que otorga el título'
                      : sourceType === 'audiovisual'
                      ? 'Compañía Productora, Canal o Plataforma (Ej. Atresmedia, CBC, YouTube)'
                      : sourceType === 'report'
                      ? 'Número de la Publicación (Opcional)'
                      : 'Editorial'}
                  </label>
                  <input
                    type="text"
                    value={
                      sourceType === 'report'
                        ? formData.reportNumber || ''
                        : formData.publisher
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        sourceType === 'report' ? 'reportNumber' : 'publisher',
                        e.target.value
                      )
                    }
                    placeholder={
                      sourceType === 'thesis'
                        ? 'Ej. Universidad Complutense de Madrid'
                        : sourceType === 'audiovisual'
                        ? 'Ej. Atresmedia Cine / CBC / YouTube'
                        : sourceType === 'report'
                        ? 'Ej. Publicación No. 14'
                        : 'Ej. Sello Editorial Javeriano'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>

                {(sourceType === 'conference' ||
                  formData.style !== 'apa7' ||
                  sourceType === 'book') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {sourceType === 'conference'
                        ? 'Ciudad y País del Simposio (Obligatorio en APA 7)'
                        : 'Ciudad / Lugar (Omitido en libros APA 7)'}
                    </label>
                    <input
                      type="text"
                      value={formData.place}
                      onChange={(e) => handleFieldChange('place', e.target.value)}
                      placeholder="Ej. Medellín, Colombia"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* DOI y URL (Pág. 32: sin "Recuperado de" ni "DOI:") */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enlace DOI (Se formatea como https://doi.org/...)
                </label>
                <input
                  type="text"
                  value={formData.doi}
                  onChange={(e) => handleFieldChange('doi', e.target.value)}
                  placeholder="Ej. 10.1590/s0104-12902019180586"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL Directa (Sin “Recuperado de”)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="Ej. https://www.who.int/es/..."
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            {/* PANEL DESPLEGABLE DE CASOS ESPECIALES DE CITACIÓN (PÁGS. 20 Y 21) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSpecialCases(!showSpecialCases)}
                className="w-full px-4 py-2.5 text-left flex items-center justify-between text-xs font-semibold text-violet-950 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-700" />
                  <span>
                    Opciones de Citación Especial (Cita de una cita, Reedición, Comunicación
                    personal)
                  </span>
                </span>
                <span className="text-violet-700">
                  {showSpecialCases ? 'Ocultar ▲' : 'Configurar ▼'}
                </span>
              </button>

              {showSpecialCases && (
                <div className="p-4 pt-2 border-t border-slate-200 space-y-3 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        3.4.9 Cita de una cita / Fuente secundaria
                      </label>
                      <input
                        type="text"
                        value={formData.secondarySourceAuthorYear || ''}
                        onChange={(e) =>
                          handleFieldChange('secondarySourceAuthorYear', e.target.value)
                        }
                        placeholder="Ej. Hawking, 2010 (genera: como se citó en Hawking, 2010)"
                        className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        3.4.5 Año original por reedición o traducción
                      </label>
                      <input
                        type="text"
                        value={formData.originalYear || ''}
                        onChange={(e) => handleFieldChange('originalYear', e.target.value)}
                        placeholder="Ej. 1966 (genera: Piaget, 1966/2000)"
                        className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!formData.isPersonalCommunication}
                      onChange={(e) =>
                        handleFieldChange('isPersonalCommunication', e.target.checked)
                      }
                      className="rounded border-slate-300 text-violet-700 focus:ring-violet-600"
                    />
                    <span>
                      <strong>3.5.2 Es una comunicación personal:</strong> Entrevista
                      personal, correo, clase no grabada o tradición oral (genera{' '}
                      <code>M. González (comunicación personal, fecha)</code>; no requiere entrada
                      en las referencias).
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL DE RESULTADO GENERADO EN TIEMPO REAL */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-900">
              <span>Previsualización Instantánea</span>
              <span aria-hidden="true">·</span>
              <span>{STYLE_LABELS[formData.style]}</span>
            </div>
            <button
              type="button"
              onClick={handleSaveToBibliography}
              disabled={!generated.requiresReferenceList}
              className="px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Guardar en mi Bibliografía
            </button>
          </div>

          {generated.specialNote && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
              {generated.specialNote}
            </div>
          )}

          {/* Cita Parentética y Cita Narrativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Cita Parentética (En el texto)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(generated.parenthetical, 'par', 'Cita parentética')
                  }
                  className="text-xs font-medium text-violet-700 hover:text-violet-950 flex items-center gap-1"
                >
                  {copiedField === 'par' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar
                </button>
              </div>
              <div
                className={`font-mono text-xs sm:text-sm text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all ${
                  sourceType === 'legal' && formData.legalSubtype === 'sentence'
                    ? 'italic'
                    : ''
                }`}
              >
                {generated.parenthetical}
              </div>
              {generated.subsequentParenthetical && (
                <div className="text-[11px] font-mono text-violet-800 pt-0.5">
                  Siguientes citas: <strong>{generated.subsequentParenthetical}</strong>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Cita Narrativa (En el texto)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(generated.narrative, 'nar', 'Cita narrativa')}
                  className="text-xs font-medium text-violet-700 hover:text-violet-950 flex items-center gap-1"
                >
                  {copiedField === 'nar' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar
                </button>
              </div>
              <div className="font-mono text-xs sm:text-sm text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
                {generated.narrative}
              </div>
              {generated.subsequentNarrative && (
                <div className="text-[11px] font-mono text-violet-800 pt-0.5">
                  Siguientes citas: <strong>{generated.subsequentNarrative}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Referencia Bibliográfica con Sangría Francesa */}
          <div className="p-4 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-950">
                Referencia Bibliográfica Final (con Sangría Francesa de 1.27 cm)
              </span>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    generated.referencePlain,
                    'ref',
                    'Referencia bibliográfica'
                  )
                }
                className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedField === 'ref' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copiar Referencia
              </button>
            </div>
            <div
              className="bg-white p-4 rounded-lg border border-violet-200/80 font-mono text-xs sm:text-sm text-slate-900 hanging-indent leading-relaxed select-all"
              dangerouslySetInnerHTML={{ __html: generated.referenceHtml }}
            />
          </div>
        </div>
      </section>

      {/* COLUMNA DERECHA: GESTOR DE BIBLIOGRAFÍA GUARDADA EN TARJETAS LIMPIAS */}
      <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-medium text-violet-700">
                Repositorio Personal del Estudiante
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Referencias Guardadas ({savedReferences.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSortAlphabetically(!sortAlphabetically)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Cambiar orden de la bibliografía"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-violet-700" />
              {sortAlphabetically ? 'Orden A–Z (APA)' : 'Más recientes'}
            </button>
          </div>

          {/* Filtro rápido por estilo si hay varias referencias */}
          {savedReferences.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'apa7', label: 'APA 7.ª' },
                { id: 'mla9', label: 'MLA 9.ª' },
                { id: 'chicago17', label: 'Chicago' },
                { id: 'icontec', label: 'Icontec' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStyleFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    styleFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Lista de referencias guardadas en tarjetas limpias */}
          <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
            {displayedReferences.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-medium text-slate-600">
                  Aún no hay referencias en esta vista.
                </p>
                <p className="text-xs text-slate-500">
                  Completa los datos a la izquierda o selecciona una plantilla del Manual APA y
                  pulsa <strong>&quot;Guardar en mi Bibliografía&quot;</strong>.
                </p>
              </div>
            ) : (
              displayedReferences.map((item) => {
                const isCiteCopied = copiedField === `${item.id}-cite`;
                const isNarCopied = copiedField === `${item.id}-nar`;
                const isRefCopied = copiedField === `${item.id}-ref`;

                return (
                  <article
                    key={item.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-sm transition-all space-y-3"
                  >
                    {/* Encabezado de la tarjeta: Estilo, Tipo de Fuente y botón de edición */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <span className="font-semibold text-violet-900 bg-violet-50 border border-violet-200/80 px-2 py-0.5 rounded-md shrink-0">
                          {STYLE_LABELS[item.style].split(' ·')[0]}
                        </span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-slate-600 truncate">
                          {(SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType).split(' (')[0]}
                        </span>
                      </div>

                      {item.formData && (
                        <button
                          type="button"
                          onClick={() => handleEditReference(item)}
                          className="text-xs font-medium text-slate-500 hover:text-violet-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-violet-50 transition-colors shrink-0"
                          title="Cargar datos en el formulario para editar"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>

                    {/* Cuerpo de la Referencia Bibliográfica */}
                    <div
                      className="font-mono text-xs text-slate-900 bg-slate-50/90 p-3.5 rounded-lg border border-slate-200/80 hanging-indent leading-relaxed select-all"
                      dangerouslySetInnerHTML={{ __html: item.referenceHtml }}
                    />

                    {/* Vista previa de Cita en el Texto (Parentética y Narrativa) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50/60 border border-slate-100 text-[11px] text-slate-600 font-mono">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong className="font-sans font-semibold text-slate-700">
                            Cita parentética:
                          </strong>{' '}
                          {item.parenthetical}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          |
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              item.narrative,
                              `${item.id}-nar`,
                              'Cita narrativa'
                            )
                          }
                          className="hover:text-violet-800 transition-colors text-left"
                          title="Clic para copiar cita narrativa"
                        >
                          <strong className="font-sans font-semibold text-slate-700">
                            Narrativa:
                          </strong>{' '}
                          {isNarCopied ? '¡Copiada!' : item.narrative}
                        </button>
                      </div>
                    </div>

                    {/* Botones de acción rápidos */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              item.parenthetical,
                              `${item.id}-cite`,
                              'Cita en el texto'
                            )
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                            isCiteCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-violet-50 hover:text-violet-800 hover:border-violet-200'
                          }`}
                          title={`Copiar cita: ${item.parenthetical}`}
                        >
                          {isCiteCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Quote className="w-3.5 h-3.5 text-violet-600" />
                          )}
                          <span>{isCiteCopied ? 'Cita copiada' : 'Copiar cita'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              item.referencePlain,
                              `${item.id}-ref`,
                              'Referencia bibliográfica'
                            )
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                            isRefCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-violet-50 hover:text-violet-800 hover:border-violet-200'
                          }`}
                          title="Copiar referencia bibliográfica completa"
                        >
                          {isRefCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-violet-600" />
                          )}
                          <span>
                            {isRefCopied ? 'Referencia copiada' : 'Copiar referencia'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveReference(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors flex items-center gap-1.5 ml-auto"
                        title="Eliminar referencia de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Barra de Exportación de Bibliografía */}
        <div className="pt-4 border-t border-slate-200 space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleCopyAllReferences}
              disabled={savedReferences.length === 0}
              className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Copiar todas las referencias al portapapeles"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span>Copiar Todas</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={savedReferences.length === 0}
              className="py-2 px-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Exportar bibliografía en formato Microsoft Word (.docx) con sangría francesa"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Word (.docx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={savedReferences.length === 0}
              className="py-2 px-2.5 bg-violet-700 hover:bg-violet-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Exportar reporte en formato PDF con sangría francesa"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Exportar PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={savedReferences.length === 0}
              className="py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Descargar archivo de texto plano (.txt)"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Texto (.txt)</span>
            </button>
          </div>

          {savedReferences.length > 0 && (
            <div className="flex items-center justify-center pt-1">
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Vaciar lista de referencias
                </button>
              ) : (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-700 font-medium">
                    ¿Confirmas vaciar toda la lista?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearReferences();
                      setConfirmClear(false);
                      showToast('Lista bibliográfica vaciada');
                    }}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
