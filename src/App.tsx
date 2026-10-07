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
  ShieldCheck,
  UserCheck,
  LogIn,
  LogOut,
  Lock,
  AlertCircle,
  KeyRound,
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
import { CmsPageView } from './components/CmsPageView';
import { CmsAdminModal } from './components/CmsAdminModal';
import { CmsLoginModal } from './components/CmsLoginModal';
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
  const [cmsLoginModalOpen, setCmsLoginModalOpen] = useState<boolean>(false);
  const [isCmsAdminLoggedIn, setIsCmsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ekiraya_cms_admin_session') === 'true';
  });

  // Autenticación Institucional (@cem.edu.co / @est.cem.edu.co)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('ekiraya_user_email') || 'mebolanos@cem.edu.co';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const isInstitutionalEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    return clean.endsWith('@cem.edu.co') || clean.endsWith('@est.cem.edu.co');
  };

  const isAdminUser =
    isCmsAdminLoggedIn ||
    currentUserEmail.trim().toLowerCase() === 'mebolanos@cem.edu.co';

  const handleInstitutionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = loginEmailInput.trim().toLowerCase();

    if (!clean) {
      setAuthError('Por favor ingresa tu correo institucional.');
      return;
    }

    if (!isInstitutionalEmail(clean)) {
      setAuthError(
        'Acceso restringido: Solo se permiten correos de la comunidad @cem.edu.co (Docentes/Admin) o @est.cem.edu.co (Estudiantes).'
      );
      return;
    }

    try {
      setAuthLoading(true);
      const resp = await fetch('/api/auth/google-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        setAuthError(data.error || 'Error en la verificación del correo institucional.');
        return;
      }
      setCurrentUserEmail(clean);
      localStorage.setItem('ekiraya_user_email', clean);
      setIsAuthModalOpen(false);
      showToast(`Sesión institucional activa: ${clean}`);
    } catch {
      setAuthError('Error al comunicarse con el servidor de autenticación.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenCmsModal = () => {
    if (!isCmsAdminLoggedIn) {
      setCmsLoginModalOpen(true);
      return;
    }
    setCmsEditingPageId(null);
    setCmsModalOpen(true);
  };

  const handleCmsLoginSuccess = (adminEmail: string) => {
    setCurrentUserEmail(adminEmail);
    localStorage.setItem('ekiraya_user_email', adminEmail);
    localStorage.setItem('ekiraya_cms_admin_session', 'true');
    setIsCmsAdminLoggedIn(true);
    setCmsLoginModalOpen(false);
    setCmsModalOpen(true);
    showToast(`Acceso administrativo concedido: ${adminEmail}`);
  };

  const handleCmsLogout = () => {
    localStorage.removeItem('ekiraya_cms_admin_session');
    setIsCmsAdminLoggedIn(false);
    setCmsModalOpen(false);
    showToast('Sesión administrativa de CMS cerrada.');
  };

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
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navigation Bar — Organizada en 2 niveles claros y limpios sin superposiciones ni barras de desplazamiento incómodas */}
      <header className="sticky top-0 z-40 bg-[#664d88] text-white border-b border-[#533e6f] shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Fila 1: Marca Institucional + Acciones de Usuario / CMS */}
          <div className="py-2.5 sm:py-3 flex items-center justify-between gap-3 border-b border-white/10">
            {/* Logotipo y Título Principal */}
            <button
              type="button"
              onClick={() => handleSwitchTab('teoria')}
              className="flex items-center gap-3 text-left focus:outline-none group select-none cursor-pointer"
              title="Ir al inicio - Colegio Ekirayá Cita Master"
            >
              {!logoFailed ? (
                <div className="bg-white p-1.5 sm:p-2 rounded-xl shadow-xs ring-1 ring-white/30 shrink-0 transition-transform group-hover:scale-105">
                  <img
                    src="https://colegioekiraya.edu.co/wp-content/uploads/2024/09/LOGO-CEM-COLOR-02.png"
                    alt="Logo Colegio Ekirayá"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-white text-[#664d88] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 ring-1 ring-white/30">
                  CEM
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white leading-tight group-hover:text-[#f8c62e] transition-colors">
                    Colegio Ekirayá
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#f8c62e] text-slate-950 font-black text-[10px] tracking-wide uppercase shadow-xs">
                    Cita Master
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-violet-200/90 font-medium tracking-normal truncate mt-0.5">
                  Portal Académico &amp; Gestor Bibliográfico
                </span>
              </div>
            </button>

            {/* Acciones de Administración CMS / Menú Móvil */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenCmsModal}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isCmsAdminLoggedIn
                    ? 'bg-[#f8c62e] text-slate-950 border-[#eab308] hover:bg-[#f3bc20] hover:shadow-md'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white hover:border-white/30'
                }`}
                title="Administración CMS - Panel y Login"
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${isCmsAdminLoggedIn ? 'text-slate-950' : 'text-[#f8c62e]'}`} />
                <span>Administración CMS</span>
                {isCmsAdminLoggedIn && (
                  <span className="hidden xl:inline text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-900/15 text-slate-900">
                    Activo
                  </span>
                )}
              </button>

              {/* Si el administrador tiene sesión abierta, botón para cerrar sesión */}
              {isCmsAdminLoggedIn && (
                <button
                  type="button"
                  onClick={handleCmsLogout}
                  className="hidden md:flex p-1.5 text-xs text-violet-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar sesión de Administración CMS"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Toggle Menú Móvil */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-xl text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors cursor-pointer md:hidden"
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

          {/* Fila 2 (Desktop & Tablet): Pestañas de Navegación limpias, espaciosas y centradas/distribuidas */}
          <div className="hidden md:flex items-center justify-between py-2">
            <nav aria-label="Navegación principal" className="flex items-center gap-2 flex-wrap">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSwitchTab(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#664d88] shadow-sm font-bold ring-1 ring-black/5'
                        : 'text-white/90 hover:text-white hover:bg-white/15'
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

            <div className="hidden lg:flex items-center gap-2 text-xs text-violet-200/80">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Portal Académico Activo</span>
            </div>
          </div>
        </div>

        {/* Menú Desplegable en Móviles (< md) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#533e6f] bg-[#533e6f] px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
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

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenCmsModal();
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isCmsAdminLoggedIn
                    ? 'bg-[#f8c62e] text-slate-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 ${isCmsAdminLoggedIn ? 'text-slate-950' : 'text-[#f8c62e]'}`} />
                  <span>Administración CMS</span>
                </div>
                {isCmsAdminLoggedIn && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/20 text-slate-950">
                    Activo
                  </span>
                )}
              </button>
            </div>
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

        {activeTab === 'universitarios' && <UniversitariosSection />}

        {/* Renderizado de páginas dinámicas CMS */}
        {cmsPages.some((p) => p.id === activeTab) && (
          <CmsPageView
            page={cmsPages.find((p) => p.id === activeTab)!}
            isAdmin={isCmsAdminLoggedIn}
            onEditPage={(p) => {
              if (!isCmsAdminLoggedIn) {
                setCmsEditingPageId(p.id);
                setCmsLoginModalOpen(true);
                return;
              }
              setCmsEditingPageId(p.id);
              setCmsModalOpen(true);
            }}
          />
        )}
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

      {/* Modal de Inicio de Sesión de Administrador CMS */}
      <CmsLoginModal
        isOpen={cmsLoginModalOpen}
        onClose={() => setCmsLoginModalOpen(false)}
        onLoginSuccess={handleCmsLoginSuccess}
        currentEmail={currentUserEmail}
      />

      {/* Modal de Gestión CMS */}
      {cmsModalOpen && isCmsAdminLoggedIn && (
        <CmsAdminModal
          isOpen={cmsModalOpen}
          onClose={() => setCmsModalOpen(false)}
          pages={cmsPages}
          onSavePage={handleSaveCmsPage}
          onDeletePage={handleDeleteCmsPage}
          initialEditPageId={cmsEditingPageId}
          showToast={showToast}
          onLogout={handleCmsLogout}
        />
      )}

      {/* Modal de Validación Institucional y Cambio de Cuenta */}
      {isAuthModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#664d88] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Acceso Institucional</h3>
                  <p className="text-[11px] text-violet-200">Colegio Ekirayá · @cem.edu.co / @est.cem.edu.co</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInstitutionalLogin} className="p-5 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                El acceso a las monografías, gestor bibliográfico y herramientas de probidad académica está protegido y restringido exclusivamente a miembros de la comunidad con correo <strong>@cem.edu.co</strong> (Docentes y Administradores) o <strong>@est.cem.edu.co</strong> (Estudiantes).
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Institucional (@cem.edu.co o @est.cem.edu.co)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmailInput}
                    onChange={(e) => setLoginEmailInput(e.target.value)}
                    placeholder="ej: mebolanos@cem.edu.co o tu-nombre@est.cem.edu.co"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <span className="font-bold text-slate-700 block">Acceso rápido para verificación:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setLoginEmailInput('mebolanos@cem.edu.co')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-[#664d88] hover:text-white transition-colors cursor-pointer"
                  >
                    mebolanos@cem.edu.co (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginEmailInput('estudiante@est.cem.edu.co')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-[#664d88] hover:text-white transition-colors cursor-pointer"
                  >
                    estudiante@est.cem.edu.co
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#664d88] hover:bg-[#533e6f] text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span>{authLoading ? 'Validando...' : 'Verificar y Continuar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
