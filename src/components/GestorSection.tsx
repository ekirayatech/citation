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
} from 'lucide-react';
import {
  CitationFormData,
  CitationStyle,
  SavedReference,
  SourceType,
} from '../types/citation';
import {
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

  const generated = generateCitationOutput(formData);

  const handleFieldChange = <K extends keyof CitationFormData>(
    key: K,
    value: CitationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    showToast(`Ejemplo de ${SOURCE_TYPE_LABELS[formData.sourceType]} cargado`);
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
      formData: { ...formData, authors: formData.authors.map((a) => ({ ...a })) },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLUMNA IZQUIERDA: FORMULARIO DINÁMICO Y PREVISUALIZACIÓN */}
      <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-medium text-violet-700">
              Generador Inteligente Multi-Norma
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

        {/* Selectores Principales: Tipo de Fuente y Estilo Bibliográfico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sourceTypeSelect"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Tipo de Fuente / Recurso
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
        ) : (
          <div className="space-y-4 pt-1">
            {/* Selector Persona vs Institución + Lista de Autores */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  1. ¿Quién es el Autor / Creador?
                </span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('isInstitutionalAuthor', false)}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      !formData.isInstitutionalAuthor
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    Autor(es) Personal(es)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('isInstitutionalAuthor', true)}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      formData.isInstitutionalAuthor
                        ? 'bg-violet-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    Entidad / Institución
                  </button>
                </div>
              </div>

              {formData.isInstitutionalAuthor ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nombre de la Institución, Organización o Corporación
                  </label>
                  <input
                    type="text"
                    value={formData.institutionalName}
                    onChange={(e) =>
                      handleFieldChange('institutionalName', e.target.value)
                    }
                    placeholder="Ej. UNESCO, Ministerio de Educación Nacional, OMS"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formData.authors.map((author, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {index === 0 ? 'Nombre(s) del Autor' : `Nombre(s) Coautor ${index + 1}`}
                        </label>
                        <input
                          type="text"
                          value={author.firstName}
                          onChange={(e) =>
                            handleAuthorChange(index, 'firstName', e.target.value)
                          }
                          placeholder="Ej. Gabriel"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {index === 0
                            ? 'Apellido(s) del Autor'
                            : `Apellido(s) Coautor ${index + 1}`}
                        </label>
                        <input
                          type="text"
                          value={author.lastName}
                          onChange={(e) =>
                            handleAuthorChange(index, 'lastName', e.target.value)
                          }
                          placeholder="Ej. García Márquez"
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
                  <button
                    type="button"
                    onClick={addCoAuthor}
                    className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 pt-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Añadir coautor (para obras con 2 o más autores)
                  </button>
                </div>
              )}
            </div>

            {/* Títulos según tipo de fuente */}
            {sourceType === 'chapter' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Título del Capítulo
                  </label>
                  <input
                    type="text"
                    value={formData.chapterTitle}
                    onChange={(e) => handleFieldChange('chapterTitle', e.target.value)}
                    placeholder="Ej. La fundación de Macondo y la memoria oral"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Título del Libro / Obra Principal
                    </label>
                    <input
                      type="text"
                      value={formData.bookTitle}
                      onChange={(e) => handleFieldChange('bookTitle', e.target.value)}
                      placeholder="Ej. Antología literaria latinoamericana"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Editor o Compilador del Libro (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.bookEditor}
                      onChange={(e) => handleFieldChange('bookEditor', e.target.value)}
                      placeholder="Ej. E. Rodríguez"
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
                    : sourceType === 'website'
                    ? 'Título de la Página o Artículo Web'
                    : 'Título del Trabajo de Grado o Tesis'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder={
                    sourceType === 'book'
                      ? 'Ej. La mente absorbente del niño'
                      : sourceType === 'article'
                      ? 'Ej. Impacto de la IA en la educación escolar'
                      : sourceType === 'website'
                      ? 'Ej. Guía para el uso de IA generativa en la educación'
                      : 'Ej. Desarrollo del pensamiento crítico en educación media'
                  }
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            )}

            {/* Campos para Revista Científica o Sitio Web */}
            {(sourceType === 'article' || sourceType === 'website') && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className={sourceType === 'article' ? 'sm:col-span-6' : 'sm:col-span-12'}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {sourceType === 'article'
                      ? 'Nombre de la Revista Científica'
                      : 'Nombre del Sitio Web / Portal'}
                  </label>
                  <input
                    type="text"
                    value={formData.journalName}
                    onChange={(e) => handleFieldChange('journalName', e.target.value)}
                    placeholder={
                      sourceType === 'article'
                        ? 'Ej. Revista Digital de Educación'
                        : 'Ej. Portal Educativo UNESCO'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                {sourceType === 'article' && (
                  <>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Volumen
                      </label>
                      <input
                        type="text"
                        value={formData.volume}
                        onChange={(e) => handleFieldChange('volume', e.target.value)}
                        placeholder="Ej. 12"
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Número / Fascículo
                      </label>
                      <input
                        type="text"
                        value={formData.issue}
                        onChange={(e) => handleFieldChange('issue', e.target.value)}
                        placeholder="Ej. 3"
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Año, Edición y Páginas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Año de Publicación
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  placeholder="Ej. 2024 o s. f."
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              {(sourceType === 'book' || sourceType === 'chapter') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Edición (Opcional)
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

              {sourceType !== 'website' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Página(s) (p. / pp.)
                  </label>
                  <input
                    type="text"
                    value={formData.pages}
                    onChange={(e) => handleFieldChange('pages', e.target.value)}
                    placeholder="Ej. 45 o 45-58"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}
            </div>

            {/* Editorial y Lugar (para libros, capítulos y tesis) */}
            {(sourceType === 'book' ||
              sourceType === 'chapter' ||
              sourceType === 'thesis') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {sourceType === 'thesis'
                      ? 'Universidad o Institución Académica'
                      : 'Editorial'}
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleFieldChange('publisher', e.target.value)}
                    placeholder={
                      sourceType === 'thesis'
                        ? 'Ej. Universidad Nacional de Colombia'
                        : 'Ej. Editorial Trillas'
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lugar de Publicación (Ciudad, País)
                  </label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) => handleFieldChange('place', e.target.value)}
                    placeholder="Ej. Bogotá, Colombia"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              </div>
            )}

            {/* DOI, Fecha de Consulta y URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sourceType !== 'website' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Código DOI (Identificador de Objeto Digital)
                  </label>
                  <input
                    type="text"
                    value={formData.doi}
                    onChange={(e) => handleFieldChange('doi', e.target.value)}
                    placeholder="Ej. 10.1016/j.edu.2024.01"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fecha de Consulta (Web)
                  </label>
                  <input
                    type="date"
                    value={formData.accessDate}
                    onChange={(e) => handleFieldChange('accessDate', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL o Enlace Directo
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="Ej. https://www.ejemplo.com"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
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
              className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Guardar en mi Bibliografía
            </button>
          </div>

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
              <div className="font-mono text-xs sm:text-sm text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
                {generated.parenthetical}
              </div>
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
            </div>
          </div>

          {/* Referencia Bibliográfica con Sangría Francesa */}
          <div className="p-4 rounded-xl bg-[#FAF5FF] border border-violet-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-950">
                Referencia Bibliográfica Final (con Sangría Francesa)
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

      {/* COLUMNA DERECHA: GESTOR DE BIBLIOGRAFÍA GUARDADA */}
      <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5">
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

          {/* Lista de referencias guardadas */}
          <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
            {displayedReferences.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-medium text-slate-600">
                  Aún no hay referencias en esta vista.
                </p>
                <p className="text-xs text-slate-500">
                  Completa los datos a la izquierda y pulsa{' '}
                  <strong>"Guardar en mi Bibliografía"</strong> para acumular y ordenar tus
                  fuentes automáticamente.
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
                    {/* Encabezado de la tarjeta: Estilo, Tipo de Fuente y botón de edición opcional */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-violet-900 bg-violet-50 border border-violet-200/80 px-2 py-0.5 rounded-md">
                          {STYLE_LABELS[item.style]}
                        </span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-slate-600">
                          {SOURCE_TYPE_LABELS[item.sourceType].split(' (')[0]}
                        </span>
                      </div>

                      {item.formData && (
                        <button
                          type="button"
                          onClick={() => handleEditReference(item)}
                          className="text-xs font-medium text-slate-500 hover:text-violet-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-violet-50 transition-colors"
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
