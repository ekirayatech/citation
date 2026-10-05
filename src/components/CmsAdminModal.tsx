import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Pencil,
  Eye,
  CheckCircle2,
  Layers,
  FileText,
  AlertTriangle,
  HelpCircle,
  Download,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
  BookOpen,
  GraduationCap,
  FolderGit2,
  Star,
  Award,
  Compass,
} from 'lucide-react';
import { CmsPage, CmsBlock, CmsBlockType, CmsIconName, CmsBlockItem } from '../types/cms';

interface CmsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: CmsPage[];
  onSavePage: (page: CmsPage) => Promise<void>;
  onDeletePage: (pageId: string) => Promise<void>;
  initialEditPageId?: string | null;
  showToast: (msg: string) => void;
}

const AVAILABLE_ICONS: { name: CmsIconName; label: string }[] = [
  { name: 'FileText', label: 'Documento' },
  { name: 'BookOpen', label: 'Libro' },
  { name: 'Award', label: 'Insignia / Hito' },
  { name: 'Compass', label: 'Brújula / Líneas' },
  { name: 'GraduationCap', label: 'Académico' },
  { name: 'FolderGit2', label: 'Carpeta / Repo' },
  { name: 'Sparkles', label: 'Destacado' },
  { name: 'Globe', label: 'Mundo / Web' },
  { name: 'Star', label: 'Estrella' },
  { name: 'HelpCircle', label: 'Ayuda / FAQ' },
];

export const CmsAdminModal: React.FC<CmsAdminModalProps> = ({
  isOpen,
  onClose,
  pages,
  onSavePage,
  onDeletePage,
  initialEditPageId,
  showToast,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string>(
    initialEditPageId || (pages[0]?.id ?? 'new')
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(!initialEditPageId && pages.length === 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Formulario de edición de página
  const activePage = pages.find((p) => p.id === selectedPageId);

  const [formData, setFormData] = useState<Partial<CmsPage>>(() => {
    if (activePage) return JSON.parse(JSON.stringify(activePage));
    return {
      id: `cms-${Date.now()}`,
      slug: 'nueva-seccion',
      title: 'Título de la Nueva Sección',
      navLabel: 'Nueva Sección',
      subtitle: 'Descripción breve para los estudiantes y docentes.',
      iconName: 'FileText',
      published: true,
      order: (pages.length + 1) * 10,
      blocks: [],
    };
  });

  const handleSelectPage = (page: CmsPage) => {
    setIsCreatingNew(false);
    setSelectedPageId(page.id);
    setFormData(JSON.parse(JSON.stringify(page)));
  };

  const handleStartNewPage = () => {
    setIsCreatingNew(true);
    const newId = `cms-${Date.now()}`;
    setSelectedPageId(newId);
    setFormData({
      id: newId,
      slug: `seccion-${pages.length + 1}`,
      title: 'Nueva Sección Académica',
      navLabel: `Pestaña ${pages.length + 1}`,
      subtitle: 'Contenido administrado por el equipo docente de Ekirayá.',
      iconName: 'FileText',
      published: true,
      order: (pages.length + 1) * 10,
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'header',
          title: 'Información Institucional',
          subtitle: 'Presentación general de los lineamientos.',
        },
        {
          id: `blk-${Date.now()}-2`,
          type: 'paragraph',
          title: 'Objetivos y Alcance',
          content: 'Escribe aquí la descripción de esta nueva sección. Puedes editar este texto directamente en cualquier momento.',
        },
      ],
    });
  };

  const handleAddBlock = (type: CmsBlockType) => {
    const newBlock: CmsBlock = {
      id: `blk-${Date.now()}`,
      type,
      title:
        type === 'alert'
          ? 'Aviso Importante'
          : type === 'header'
            ? 'Nuevo Encabezado de Sección'
            : type === 'cards'
              ? 'Módulos o Pasos'
              : type === 'accordion'
                ? 'Preguntas Frecuentes / Secciones Desplegables'
                : type === 'download_links'
                  ? 'Formatos y Recursos Descargables'
                  : 'Texto Informativo',
      content:
        type === 'alert'
          ? 'Escribe aquí el aviso o recordatorio para los estudiantes.'
          : type === 'paragraph'
            ? 'Redacta los detalles, normas o directrices correspondientes.'
            : '',
      alertType: type === 'alert' ? 'institucional' : undefined,
      items:
        type === 'cards' || type === 'accordion' || type === 'download_links'
          ? [
              {
                id: `item-${Date.now()}-1`,
                title: 'Elemento 1',
                description: 'Descripción o detalles del primer elemento.',
                badge: type === 'cards' ? 'Paso 1' : undefined,
                linkText: type === 'download_links' ? 'Descargar Archivo' : undefined,
                linkUrl: '#',
              },
            ]
          : undefined,
    };

    setFormData((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock],
    }));
  };

  const handleUpdateBlock = (index: number, updated: Partial<CmsBlock>) => {
    setFormData((prev) => {
      const copy = [...(prev.blocks || [])];
      copy[index] = { ...copy[index], ...updated };
      return { ...prev, blocks: copy };
    });
  };

  const handleRemoveBlock = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddItemToBlock = (blockIndex: number) => {
    setFormData((prev) => {
      const copy = [...(prev.blocks || [])];
      const target = copy[blockIndex];
      const newItem: CmsBlockItem = {
        id: `item-${Date.now()}`,
        title: `Nuevo Elemento ${(target.items?.length || 0) + 1}`,
        description: 'Detalle o descripción.',
        badge: target.type === 'cards' ? 'Nuevo' : undefined,
        linkText: target.type === 'download_links' ? 'Descargar' : undefined,
        linkUrl: '#',
      };
      target.items = [...(target.items || []), newItem];
      return { ...prev, blocks: copy };
    });
  };

  const handleRemoveItemFromBlock = (blockIndex: number, itemIndex: number) => {
    setFormData((prev) => {
      const copy = [...(prev.blocks || [])];
      const target = copy[blockIndex];
      target.items = (target.items || []).filter((_, i) => i !== itemIndex);
      return { ...prev, blocks: copy };
    });
  };

  const handleSaveCurrentPage = async () => {
    if (!formData.title?.trim() || !formData.navLabel?.trim()) {
      showToast('Por favor asigna un título y un nombre de pestaña válido.');
      return;
    }

    const pageToSave: CmsPage = {
      id: formData.id || `cms-${Date.now()}`,
      slug: (formData.slug || 'seccion')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-'),
      title: formData.title.trim(),
      navLabel: formData.navLabel.trim(),
      subtitle: formData.subtitle?.trim() || '',
      iconName: formData.iconName || 'FileText',
      published: Boolean(formData.published !== false),
      order: Number(formData.order) || 10,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'mebolanos@cem.edu.co',
      blocks: formData.blocks || [],
    };

    setIsSaving(true);
    try {
      await onSavePage(pageToSave);
      setIsCreatingNew(false);
      setSelectedPageId(pageToSave.id);
      showToast(`Pestaña "${pageToSave.navLabel}" guardada y sincronizada para todos los dispositivos`);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la página en el CMS');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentPage = async () => {
    if (!formData.id) return;
    if (confirm(`¿Estás seguro de eliminar la pestaña "${formData.navLabel}"? Esta acción se aplicará en todos los equipos.`)) {
      try {
        await onDeletePage(formData.id);
        showToast(`Pestaña eliminada.`);
        if (pages.length > 1) {
          const next = pages.find((p) => p.id !== formData.id);
          if (next) handleSelectPage(next);
          else handleStartNewPage();
        } else {
          handleStartNewPage();
        }
      } catch (err: any) {
        showToast(err.message || 'Error al eliminar');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Cabecera del CMS */}
        <div className="p-4 sm:p-5 bg-[#664d88] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f8c62e] text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Panel de Gestión de Contenidos (CMS)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f8c62e] text-slate-950 uppercase">
                  Administrador
                </span>
              </div>
              <p className="text-xs text-violet-100">
                Agrega nuevas pestañas o edita contenidos directamente sin necesidad de programar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-violet-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Principal del CMS: Dos Columnas (Lista de Pestañas a la izquierda, Editor a la derecha) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Columna Izquierda: Gestión de Pestañas */}
          <div className="md:col-span-4 bg-slate-50/60 p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pestañas del CMS ({pages.length})
              </span>
              <button
                type="button"
                onClick={handleStartNewPage}
                className="px-2.5 py-1 rounded-lg bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#f8c62e]" />
                <span>Nueva Pestaña</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {pages.map((p) => {
                const isSelected = !isCreatingNew && selectedPageId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPage(p)}
                    className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white text-violet-950 border-[#664d88] shadow-xs ring-1 ring-[#664d88]/20'
                        : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-semibold text-xs sm:text-sm truncate">
                        {p.navLabel}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{p.title}</div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        p.published
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.published ? 'Visible' : 'Oculta'}
                    </span>
                  </button>
                );
              })}

              {isCreatingNew && (
                <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-300 text-violet-900 text-xs font-semibold flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-violet-700" />
                  <span>Creando nueva pestaña...</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-700" />
                <span>Sincronización en vivo</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Al guardar una pestaña, aparecerá de inmediato en la barra superior de todos los dispositivos conectados (más de 50 terminales simultáneas).
              </p>
            </div>
          </div>

          {/* Columna Derecha: Editor de Contenidos */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 bg-white">
            <div className="space-y-4 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-violet-700" />
                  <span>Configuración General de la Pestaña</span>
                </h4>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.published !== false)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, published: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-[#664d88] focus:ring-[#664d88]"
                    />
                    <span>Mostrar en navegación</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título Principal de la Página (aparece en el banner)
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej. Convocatoria y Fechas Clave 2026"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Corto (Botón Menú)
                  </label>
                  <input
                    type="text"
                    value={formData.navLabel || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, navLabel: e.target.value }))}
                    placeholder="Ej. Convocatoria"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Icono para la barra superior
                  </label>
                  <select
                    value={formData.iconName || 'FileText'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, iconName: e.target.value as CmsIconName }))
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88] bg-white"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label} ({ic.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identificador de enlace (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="convocatoria-2026"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88] font-mono text-slate-600"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtítulo o descripción breve (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Resumen o propósito para los estudiantes..."
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                  />
                </div>
              </div>
            </div>

            {/* Editor de Bloques */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Bloques de Contenido ({formData.blocks?.length || 0})
                </h4>

                {/* Botones para agregar bloques */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddBlock('paragraph')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Párrafo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('header')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Título</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('alert')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Aviso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('cards')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Tarjetas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('accordion')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Acordeón</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('download_links')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#664d88]" />
                    <span>+ Descargas</span>
                  </button>
                </div>
              </div>

              {/* Lista de bloques en edición */}
              <div className="space-y-4">
                {formData.blocks?.map((block, bIdx) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-900 text-xs font-bold flex items-center justify-center">
                          {bIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Bloque: {block.type}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(bIdx)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar este bloque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Campos según el tipo de bloque */}
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Título del bloque
                        </label>
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => handleUpdateBlock(bIdx, { title: e.target.value })}
                          placeholder="Título del bloque..."
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      {block.type === 'header' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Subtítulo
                          </label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) => handleUpdateBlock(bIdx, { subtitle: e.target.value })}
                            placeholder="Subtítulo complementario..."
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      )}

                      {(block.type === 'paragraph' || block.type === 'alert') && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Contenido del texto
                          </label>
                          <textarea
                            rows={3}
                            value={block.content || ''}
                            onChange={(e) => handleUpdateBlock(bIdx, { content: e.target.value })}
                            placeholder="Escribe el texto aquí..."
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      )}

                      {block.type === 'alert' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Tipo de Alerta
                          </label>
                          <select
                            value={block.alertType || 'institucional'}
                            onChange={(e) =>
                              handleUpdateBlock(bIdx, { alertType: e.target.value as any })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="institucional">Institucional (Morado Ekirayá)</option>
                            <option value="info">Informativo (Azul)</option>
                            <option value="warning">Advertencia (Ámbar)</option>
                            <option value="success">Aprobado / Éxito (Verde)</option>
                          </select>
                        </div>
                      )}

                      {/* Sub-elementos para tarjetas, acordeones o descargas */}
                      {(block.type === 'cards' ||
                        block.type === 'accordion' ||
                        block.type === 'download_links') && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Elementos ({block.items?.length || 0})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddItemToBlock(bIdx)}
                              className="text-[11px] font-semibold text-violet-700 hover:text-violet-950 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Agregar elemento</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {block.items?.map((item, iIdx) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const nextItems = [...(block.items || [])];
                                      nextItems[iIdx].title = e.target.value;
                                      handleUpdateBlock(bIdx, { items: nextItems });
                                    }}
                                    placeholder="Título del elemento..."
                                    className="flex-1 font-semibold text-xs px-2 py-1 rounded border border-slate-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemFromBlock(bIdx, iIdx)}
                                    className="text-slate-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <textarea
                                  rows={2}
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const nextItems = [...(block.items || [])];
                                    nextItems[iIdx].description = e.target.value;
                                    handleUpdateBlock(bIdx, { items: nextItems });
                                  }}
                                  placeholder="Descripción o contenido..."
                                  className="w-full text-xs px-2 py-1 rounded border border-slate-200"
                                />

                                {(block.type === 'download_links' || block.type === 'cards') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={item.linkText || ''}
                                      onChange={(e) => {
                                        const nextItems = [...(block.items || [])];
                                        nextItems[iIdx].linkText = e.target.value;
                                        handleUpdateBlock(bIdx, { items: nextItems });
                                      }}
                                      placeholder="Texto del botón (ej. Descargar Word)"
                                      className="text-xs px-2 py-1 rounded border border-slate-200"
                                    />
                                    <input
                                      type="text"
                                      value={item.linkUrl || ''}
                                      onChange={(e) => {
                                        const nextItems = [...(block.items || [])];
                                        nextItems[iIdx].linkUrl = e.target.value;
                                        handleUpdateBlock(bIdx, { items: nextItems });
                                      }}
                                      placeholder="URL o enlace (Google Drive o web)"
                                      className="text-xs px-2 py-1 rounded border border-slate-200 font-mono"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!formData.blocks || formData.blocks.length === 0) && (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Usa los botones superiores para agregar párrafos, títulos, tarjetas o enlaces a esta página.
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción de Guardado y Eliminación */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentPage}
                    className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Pestaña</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCurrentPage}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#f8c62e]" />
                  <span>
                    {isSaving
                      ? 'Publicando en 50+ equipos...'
                      : 'Guardar y Publicar en Todos los Dispositivos'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
