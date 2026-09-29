import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  FileCheck2,
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

type ActiveTab = 'teoria' | 'apa2026' | 'taller' | 'gestor' | 'universitarios';

const STORAGE_KEY = 'ekiraya_citamaster_refs_v2';
const LEGACY_STORAGE_KEY = 'ekiraya_manager_refs';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('teoria');
  const [formData, setFormData] = useState<CitationFormData>({
    ...INITIAL_FORM_DATA,
    ...EXAMPLE_PRESETS.book,
    sourceType: 'book',
    style: 'apa7',
  });
  const [savedReferences, setSavedReferences] = useState<SavedReference[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navigation Bar following the 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#4C1D95] text-white border-b border-violet-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 lg:py-0 lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSwitchTab('teoria')}
              className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group min-w-0"
            >
              {!logoFailed ? (
                <img
                  src="https://colegioekiraya.edu.co/wp-content/uploads/2024/09/LOGO-CEM-COLOR-02.png"
                  alt="Logo Colegio Ekirayá"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-9 sm:h-10 w-auto object-contain bg-white px-2 py-1 rounded-lg shadow-xs shrink-0"
                />
              ) : (
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white text-violet-900 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  CE
                </div>
              )}
              <span className="font-display text-base sm:text-xl font-semibold tracking-tight text-white truncate">
                Colegio Ekirayá · Cita Master
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestor')}
              className="lg:hidden px-2.5 py-1.5 text-xs font-semibold bg-violet-950/70 hover:bg-violet-950 text-violet-100 border border-violet-600/50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              + Cita
            </button>
          </div>

          {/* Zone 2: Navigation Links (Responsive grid on mobile, row on sm+) */}
          <nav
            aria-label="Navegación principal"
            className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto"
          >
            <button
              type="button"
              onClick={() => handleSwitchTab('teoria')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                activeTab === 'teoria'
                  ? 'bg-white text-violet-950 font-semibold shadow-xs'
                  : 'bg-violet-900/40 sm:bg-transparent text-violet-100 hover:bg-violet-800/70 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Guía Teórica</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('apa2026')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                activeTab === 'apa2026'
                  ? 'bg-white text-violet-950 font-semibold shadow-xs'
                  : 'bg-violet-900/40 sm:bg-transparent text-violet-100 hover:bg-violet-800/70 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Normas APA 2026</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('taller')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                activeTab === 'taller'
                  ? 'bg-white text-violet-950 font-semibold shadow-xs'
                  : 'bg-violet-900/40 sm:bg-transparent text-violet-100 hover:bg-violet-800/70 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Ejercicios y Test</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestor')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                activeTab === 'gestor'
                  ? 'bg-white text-violet-950 font-semibold shadow-xs'
                  : 'bg-violet-900/40 sm:bg-transparent text-violet-100 hover:bg-violet-800/70 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Gestor ({savedReferences.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('universitarios')}
              className={`col-span-2 sm:col-span-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                activeTab === 'universitarios'
                  ? 'bg-white text-violet-950 font-semibold shadow-xs'
                  : 'bg-violet-900/40 sm:bg-transparent text-violet-100 hover:bg-violet-800/70 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Universitarios</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="hidden xl:flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchTab('gestor')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-violet-950/70 hover:bg-violet-950 text-violet-100 border border-violet-600/50 rounded-lg transition-colors whitespace-nowrap"
            >
              Nueva Cita / Referencia
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-x-hidden">
        {activeTab === 'teoria' && (
          <TeoriaSection
            onNavigateToGestor={handleNavigateToGestor}
            onNavigateToTaller={() => handleSwitchTab('taller')}
          />
        )}

        {activeTab === 'apa2026' && (
          <Apa2026Section
            onLoadExampleInGestor={handleLoadExampleInGestor}
            showToast={showToast}
          />
        )}

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
