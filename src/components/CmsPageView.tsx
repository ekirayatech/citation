import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  GraduationCap,
  FolderGit2,
  Globe,
  Sparkles,
  Star,
  HelpCircle,
  Award,
  Compass,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle,
  Pencil,
  PlusCircle,
} from 'lucide-react';
import { CmsPage, CmsBlock, CmsIconName } from '../types/cms';

interface CmsPageViewProps {
  page: CmsPage;
  isAdmin?: boolean;
  onEditPage?: (page: CmsPage) => void;
}

export const CmsPageView: React.FC<CmsPageViewProps> = ({
  page,
  isAdmin = false,
  onEditPage,
}) => {
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderIcon = (name?: CmsIconName) => {
    const className = 'w-6 h-6 text-[#f8c62e] shrink-0';
    switch (name) {
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'FolderGit2':
        return <FolderGit2 className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'HelpCircle':
        return <HelpCircle className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'FileText':
      default:
        return <FileText className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Encabezado Institucional */}
      <div className="bg-gradient-to-r from-[#44345c] via-[#664d88] to-[#533e6f] rounded-2xl p-6 sm:p-8 text-white border border-violet-800/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold">
              {renderIcon(page.iconName)}
              <span>Página Institucional · Colegio Ekirayá</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#f8c62e]">Publicada</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-violet-100 text-sm sm:text-base leading-relaxed">
                {page.subtitle}
              </p>
            )}
          </div>

          {isAdmin && onEditPage && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditPage(page)}
                className="px-4 py-2.5 rounded-xl bg-[#f8c62e] hover:bg-[#e5b320] text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md"
                title="Editar los contenidos de esta página en el CMS"
              >
                <Pencil className="w-4 h-4 text-slate-950" />
                <span>Editar página (CMS)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bloques de Contenido Dinámicos */}
      <div className="space-y-6">
        {page.blocks.map((block) => {
          switch (block.type) {
            case 'alert':
              return (
                <div
                  key={block.id}
                  className={`p-5 rounded-2xl border text-sm leading-relaxed flex items-start gap-3.5 shadow-xs ${
                    block.alertType === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : block.alertType === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : block.alertType === 'institucional'
                          ? 'bg-violet-50/80 border-violet-200 text-violet-950'
                          : 'bg-blue-50 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {block.alertType === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    {block.alertType === 'success' && (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                    {block.alertType === 'institucional' && (
                      <Sparkles className="w-5 h-5 text-[#664d88]" />
                    )}
                    {(!block.alertType || block.alertType === 'info') && (
                      <Info className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    {block.title && <h3 className="font-bold text-base">{block.title}</h3>}
                    <div className="whitespace-pre-line text-xs sm:text-sm">{block.content}</div>
                  </div>
                </div>
              );

            case 'header':
              return (
                <div key={block.id} className="pt-2 border-b border-slate-200 pb-3">
                  {block.title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {block.title}
                    </h2>
                  )}
                  {block.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{block.subtitle}</p>
                  )}
                </div>
              );

            case 'paragraph':
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3"
                >
                  {block.title && (
                    <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
                  )}
                  {block.content && (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {block.content}
                    </div>
                  )}
                </div>
              );

            case 'cards':
              return (
                <div key={block.id} className="space-y-3">
                  {block.title && (
                    <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {block.items?.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-violet-300 hover:shadow-sm transition-all space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.linkUrl && item.linkUrl !== '#' && (
                          <div className="pt-2">
                            <a
                              href={item.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-950 underline"
                            >
                              <span>{item.linkText || 'Ver más información'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'accordion':
              return (
                <div key={block.id} className="space-y-3">
                  {block.title && (
                    <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
                  )}
                  <div className="space-y-2.5">
                    {block.items?.map((item) => {
                      const isOpen = openAccordions[item.id] !== false; // Abierto por defecto
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleAccordion(item.id)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-semibold text-sm sm:text-base text-slate-900">
                              {item.title}
                            </span>
                            <span className="text-slate-500 shrink-0">
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-violet-700" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </button>
                          {isOpen && item.description && (
                            <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                              {item.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case 'download_links':
              return (
                <div key={block.id} className="space-y-3">
                  {block.title && (
                    <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {block.items?.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-white border border-slate-200 hover:border-violet-300 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <a
                          href={item.linkUrl || '#'}
                          download={item.linkUrl && item.linkUrl !== '#' ? true : undefined}
                          className="shrink-0 px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{item.linkText || 'Descargar'}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}

        {page.blocks.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <p className="text-slate-600 font-medium">Esta página aún no contiene bloques de texto.</p>
            {isAdmin && onEditPage && (
              <button
                type="button"
                onClick={() => onEditPage(page)}
                className="px-4 py-2 bg-[#664d88] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#533e6f]"
              >
                <PlusCircle className="w-4 h-4 text-[#f8c62e]" />
                <span>Agregar contenido con el CMS</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
