import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  FileCheck2,
  FolderGit2,
  Menu,
  X,
  Layers,
  Award,
  Compass,
  FileText,
  Globe,
  Star,
  HelpCircle,
} from 'lucide-react';
import {
  CitationFormData,
  CitationStyle,
  SavedReference,
  SourceType,
} from './types/citation';
import {
  EXAMPLE_PRESETS,
  INITIAL_FORM_DATA,
} from './utils/citationEngine';
import { TeoriaSection } from './components/TeoriaSection';
import { Apa2026Section } from './components/Apa2026Section';
import { GestorSection } from './components/GestorSection';
import { TallerSection } from './components/TallerSection';
import { UniversitariosSection } from './components/UniversitariosSection';
import { RepositorioSection } from './components/RepositorioSection';
import { CmsPageView } from './components/CmsPageView';
import { CmsAdminModal } from './components/CmsAdminModal';
import { CmsPage, CmsIconName } from './types/cms';
import { DEFAULT_CMS_PAGES } from './data/defaultCmsPages';

const STORAGE_KEY = 'ekiraya_citamaster_refs_v2';
const LEGACY_STORAGE_KEY = 'ekiraya_manager_refs';
const CMS_PAGES_STORAGE_KEY = 'ekiraya_cms_pages_cache_v2';

const isForbiddenCmsPage = (p: CmsPage | null | undefined): boolean => {
  if (!p) return true;
  const str = `${p.id || ''} ${p.title || ''} ${p.navLabel || ''} ${p.slug || ''}`.toLowerCase();
  return (
    str.includes('crono') ||
    str.includes('línea') ||
    str.includes('linea') ||
    str.includes('investiga')
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('teoria');
  const [formData, setFormData] = useState<CitationFormData>({
    ...INITIAL_FORM_DATA,
    ...EXAMPLE_PRESETS.book,
    sourceType: 'book',
    style: 'apa7',
  });
  const [savedReferences, setSavedReferences] = useState<SavedReference[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Estado del CMS (Content Management System)
  const [cmsPages, setCmsPages] = useState<CmsPage[]>(() => {
    try {
      const stored = localStorage.getItem(CMS_PAGES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p) => !isForbiddenCmsPage(p));
          localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_CMS_PAGES.filter((p) => !isForbiddenCmsPage(p));
  });
  const [cmsModalOpen, setCmsModalOpen] = useState<boolean>(false);
  const [cmsEditingPageId, setCmsEditingPageId] = useState<string | null>(null);

  // Carga inicial y sincronización de páginas CMS
  useEffect(() => {
    fetch('/api/cms/pages')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const cleaned = data.filter((p) => !isForbiddenCmsPage(p));
          setCmsPages(cleaned);
          try {
            localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(cleaned));
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {});
  }, []);

  // Escuchar stream SSE para sincronización en tiempo real de páginas CMS entre terminales
  useEffect(() => {
    let es: EventSource | null = null;
    let timer: number | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        es = new EventSource('/api/repo/events');
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data?.cmsPages)) {
              const cleaned = data.cmsPages.filter((p: CmsPage) => !isForbiddenCmsPage(p));
              setCmsPages(cleaned);
              try {
                localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(cleaned));
              } catch {}
            } else if (Array.isArray(data?.pages)) {
              const cleaned = data.pages.filter((p: CmsPage) => !isForbiddenCmsPage(p));
              setCmsPages(cleaned);
              try {
                localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(cleaned));
              } catch {}
            }
          } catch {}
        };
        es.onerror = () => {
          es?.close();
          if (!cancelled) {
            timer = window.setTimeout(connect, 6000);
          }
        };
      } catch {}
    };

    connect();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      es?.close();
    };
  }, []);

  // Load saved references from localStorage (including legacy key migration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedReferences(parsed);
          return;
        }
      }
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const migrated: SavedReference[] = parsedLegacy.map(
            (item: { text?: string; style?: string; citPar?: string; citNar?: string }, idx: number) => ({
              id: `legacy-${idx}-${Date.now()}`,
              sourceType: 'book',
              style: 'apa7',
              referenceHtml: item.text || '',
              referencePlain: (item.text || '').replace(/<[^>]*>/g, ''),
              parenthetical: item.citPar || '',
              narrative: item.citNar || '',
              sortKey: (item.text || 'a').replace(/<[^>]*>/g, '').trim().toLowerCase(),
              createdAt: new Date().toISOString(),
            })
          );
          setSavedReferences(migrated);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist saved references
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedReferences));
    } catch {
      // Ignore storage errors
    }
  }, [savedReferences]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleNavigateToGestor = (
    presetType?: SourceType,
    presetStyle?: CitationStyle
  ) => {
    if (presetType) {
      const preset = EXAMPLE_PRESETS[presetType];
      setFormData({
        ...INITIAL_FORM_DATA,
        sourceType: presetType,
        style: presetStyle || formData.style,
        ...preset,
      });
    } else if (presetStyle) {
      setFormData((prev) => ({ ...prev, style: presetStyle }));
    }
    setActiveTab('gestor');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadExampleInGestor = (
    exampleData: Partial<CitationFormData>,
    label: string
  ) => {
    setFormData({
      ...INITIAL_FORM_DATA,
      ...exampleData,
    });
    setActiveTab('gestor');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Cargado en el Gestor: ${label}`);
  };

  const handleAddReference = (ref: SavedReference) => {
    setSavedReferences((prev) => [ref, ...prev]);
  };

  const handleRemoveReference = (id: string) => {
    setSavedReferences((prev) => prev.filter((r) => r.id !== id));
    showToast('Referencia eliminada de tu bibliografía');
  };

  const handleClearReferences = () => {
    setSavedReferences([]);
  };

  const renderCmsIcon = (name?: CmsIconName) => {
    const className = 'w-4 h-4 shrink-0';
    switch (name) {
      case 'Award':
        return <Award className={className} />;
      case 'Compass':
        return <Compass className={className} />;
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
      case 'FileText':
      default:
        return <FileText className={className} />;
    }
  };

  const handleSaveCmsPage = async (page: CmsPage) => {
    const resp = await fetch('/api/cms/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || 'Error al guardar la página');
    }
    const data = await resp.json();
    if (Array.isArray(data?.pages)) {
      setCmsPages(data.pages);
      try {
        localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(data.pages));
      } catch {
        // Ignore
      }
    }
  };

  const handleDeleteCmsPage = async (pageId: string) => {
    const resp = await fetch(`/api/cms/pages/${encodeURIComponent(pageId)}`, {
      method: 'DELETE',
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || 'Error al eliminar la página');
    }
    const data = await resp.json();
    if (Array.isArray(data?.pages)) {
      setCmsPages(data.pages);
      try {
        localStorage.setItem(CMS_PAGES_STORAGE_KEY, JSON.stringify(data.pages));
      } catch {
        // Ignore
      }
    }
    if (activeTab === pageId) {
      setActiveTab('teoria');
    }
  };

  const navItems: { id: string; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'teoria', label: 'Guía Teórica', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
    { id: 'apa2026', label: 'Normas APA 2026', icon: <FileCheck2 className="w-4 h-4 shrink-0" /> },
    {
      id: 'gestor',
      label: 'Gestor',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      count: savedReferences.length,
    },
    { id: 'universitarios', label: 'Universitarios', icon: <GraduationCap className="w-4 h-4 shrink-0" /> },
    ...cmsPages
      .filter((p) => p.published && !isForbiddenCmsPage(p))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((p) => ({
        id: p.id,
        label: p.navLabel || p.title,
        icon: renderCmsIcon(p.iconName),
      })),
    { id: 'repositorio', label: 'Repositorio', icon: <FolderGit2 className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navigation Bar — Con color institucional #664d88, mayor tamaño visual y totalmente responsive */}
      <header className="sticky top-0 z-40 bg-[#664d88] text-white border-b border-[#533e6f] shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4 lg:py-4.5 min-h-[4.75rem] lg:min-h-[5.5rem] flex flex-col justify-center">
          <div className="flex items-center justify-between gap-3 lg:gap-6">
            {/* Zone 1: Identidad Institucional y Logotipo */}
            <button
              type="button"
              onClick={() => handleSwitchTab('teoria')}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left focus:outline-none group min-w-0 flex-1 lg:flex-initial"
              title="Ir al inicio - Colegio Ekirayá Cita Master"
            >
              {!logoFailed ? (
                <div className="bg-white/95 p-1.5 sm:p-2 rounded-xl shadow-xs ring-1 ring-white/30 shrink-0 transition-transform group-hover:scale-105">
                  <img
                    src="https://colegioekiraya.edu.co/wp-content/uploads/2024/09/LOGO-CEM-COLOR-02.png"
                    alt="Logo Colegio Ekirayá"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="h-9 sm:h-11 lg:h-13 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-9 w-9 sm:h-11 sm:w-11 lg:h-13 lg:w-13 rounded-xl bg-white text-[#664d88] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 ring-1 ring-white/30">
                  CEM
                </div>
              )}
              <div className="min-w-0">
                <span className="font-display text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white block truncate leading-tight group-hover:text-[#f8c62e] transition-colors">
                  Colegio Ekirayá · Cita Master
                </span>
                <span className="text-[11px] sm:text-xs text-violet-200/90 font-medium tracking-normal hidden xs:block truncate mt-0.5">
                  Portal Académico &amp; Gestor Bibliográfico · Educación Montessori
                </span>
              </div>
            </button>

            {/* Zone 2 (Desktop): Pestañas de Navegación con altura visual generosa */}
            <nav
              aria-label="Navegación principal"
              className="hidden lg:flex items-center gap-1.5 xl:gap-2"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSwitchTab(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#664d88] shadow-sm ring-1 ring-black/5'
                        : 'text-white/85 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#664d88] text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Botón de Acción Principal y Toggle Móvil */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchTab('gestor')}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold bg-[#f8c62e] hover:bg-[#e8b524] text-slate-950 border border-[#f8c62e] rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-950 shrink-0" />
                <span className="hidden sm:inline">Nueva Cita</span>
                <span className="sm:hidden">Citar</span>
              </button>

              {/* Botón de Menú Móvil */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Barra de navegación secundaria en móviles: Desplazamiento horizontal fluido (1-tap access) */}
          <div className="lg:hidden mt-2.5 pt-2 border-t border-white/15">
            <nav
              aria-label="Navegación móvil rápida"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 scroll-smooth"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSwitchTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#664d88] shadow-xs'
                        : 'bg-white/10 text-white/90 hover:bg-white/20'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-[#664d88] text-white'
                            : 'bg-white/25 text-white'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Menú Desplegable Completo en Móviles (al pulsar el ícono de menú) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#533e6f] bg-[#533e6f] px-4 py-3 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSwitchTab(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-white text-[#664d88] shadow-xs'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#664d88] text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-x-hidden">
        {activeTab === 'teoria' && (
          <TeoriaSection
            onNavigateToGestor={handleNavigateToGestor}
            onNavigateToTaller={() => handleSwitchTab('taller')}
            onLoadExampleInGestor={handleLoadExampleInGestor}
            showToast={showToast}
          />
        )}

        {activeTab === 'apa2026' && <Apa2026Section />}

        {activeTab === 'taller' && (
          <TallerSection
            savedReferences={savedReferences}
            showToast={showToast}
          />
        )}

        {activeTab === 'gestor' && (
          <GestorSection
            formData={formData}
            setFormData={setFormData}
            savedReferences={savedReferences}
            onAddReference={handleAddReference}
            onRemoveReference={handleRemoveReference}
            onClearReferences={handleClearReferences}
            showToast={showToast}
          />
        )}

        {activeTab === 'repositorio' && (
          <RepositorioSection
            onCiteMonographInGestor={handleLoadExampleInGestor}
            showToast={showToast}
          />
        )}

        {activeTab === 'universitarios' && <UniversitariosSection />}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            Colegio Ekirayá Educación Montessori · Cita Master — Gestor Bibliográfico y Portal Académico
          </p>
          <p>Probidad Académica · APA 7.ª · MLA 9.ª · Chicago 17.ª · Icontec</p>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-lg flex items-center justify-center sm:justify-start gap-2 border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
