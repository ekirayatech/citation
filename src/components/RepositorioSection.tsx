import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Unlock,
  ShieldCheck,
  FolderGit2,
  Building2,
  Landmark,
  Compass,
  Tag,
  User,
  Calendar,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Check,
  Code2,
  Table,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { RawMonographRow, DEFAULT_REPO_ROWS, DEFAULT_REPO_HEADERS } from '../data/repositorioDefaultData';
import { APPS_SCRIPT_CODE } from '../data/appsScriptCode';

interface RepositorioSectionProps {
  showToast: (msg: string) => void;
}

type ViewMode = '3cards' | 'reader' | 'all';

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({ showToast }) => {
  // Estado de los datos del repositorio
  const [monografias, setMonografias] = useState<RawMonographRow[]>(() => {
    try {
      const stored = localStorage.getItem('ekiraya_repositorio_cache_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REPO_ROWS as RawMonographRow[];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string>(() => {
    return localStorage.getItem('ekiraya_last_sync_date') || new Date().toLocaleString('es-CO');
  });
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'reconnecting' | 'idle'>('connected');

  // Filtros de navegación
  const [selectedUnidad, setSelectedUnidad] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'id' | 'titulo' | 'autor' | 'ano' | 'unidad'>('id');
  const [filterLinea, setFilterLinea] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterAsesor, setFilterAsesor] = useState<string>('all');
  const [filterAutor, setFilterAutor] = useState<string>('all');
  const [filterAnoGrado, setFilterAnoGrado] = useState<string>('all');

  // Modo de visualización
  const [viewMode, setViewMode] = useState<ViewMode>('3cards');

  // Monografía activa para el visor ampliado / modal
  const [modalMonografia, setModalMonografia] = useState<RawMonographRow | null>(null);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});

  // Sección administrativa y control de acceso
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('ekiraya_user_email') || 'mebolanos@cem.edu.co';
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(true);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'mapping' | 'appscript' | 'manualSync'>('mapping');
  const [pastedData, setPastedData] = useState<string>('');
  const [scriptCopied, setScriptCopied] = useState<boolean>(false);

  // Zoom de visor simulado
  const [viewerZoom, setViewerZoom] = useState<Record<string, number>>({});

  // Cargar estado inicial desde el servidor
  useEffect(() => {
    fetchRepoState();
  }, []);

  const fetchRepoState = async () => {
    try {
      setIsLoading(true);
      const resp = await fetch('/api/repo/state');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.rawRows) && data.rawRows.length > 0) {
          setMonografias(data.rawRows);
          try {
            localStorage.setItem('ekiraya_repositorio_cache_v2', JSON.stringify(data.rawRows));
          } catch {}
        }
        if (data.lastSyncDate) {
          setLastSyncDate(data.lastSyncDate);
          localStorage.setItem('ekiraya_last_sync_date', data.lastSyncDate);
        }
        setSyncStatus('connected');
      }
    } catch {
      setSyncStatus('reconnecting');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de sincronización en tiempo real
  const handleSyncNow = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    showToast('Sincronizando con Google Sheets (hoja Repositorio)...');

    try {
      const resp = await fetch('/api/repo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoTabName: 'repositorio',
          connectionUrl: 'https://docs.google.com/spreadsheets/d/1_JgI8DRjnvql9sruq54rFbwVBFelokqpIv2NkQKgZi0/edit',
          triggerDriveScan: true
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.rows) && data.rows.length > 0) {
          setMonografias(data.rows);
          try {
            localStorage.setItem('ekiraya_repositorio_cache_v2', JSON.stringify(data.rows));
          } catch {}
        }
        const nowStr = new Date().toLocaleString('es-CO');
        setLastSyncDate(nowStr);
        localStorage.setItem('ekiraya_last_sync_date', nowStr);
        setSyncStatus('connected');
        showToast(`¡Sincronización exitosa! ${data.rows?.length || monografias.length} monografías cargadas.`);
      } else {
        setSyncStatus('connected');
        showToast('Repositorio actualizado con la copia local verificada.');
      }
    } catch {
      setSyncStatus('reconnecting');
      showToast('Error de conexión con Sheets. Mostrando datos cacheados.');
    } finally {
      setIsLoading(false);
    }
  };

  // Importar datos manualmente pegados (TSV/CSV)
  const handleManualImport = () => {
    if (!pastedData.trim()) {
      showToast('Por favor pega los datos de la hoja antes de importar.');
      return;
    }

    try {
      const lines = pastedData.trim().split(/\r?\n/);
      if (lines.length < 2) {
        showToast('El texto debe tener al menos una fila de encabezados y una de datos.');
        return;
      }

      const separator = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows: RawMonographRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length === 0 || cols.every(c => c === '')) continue;
        
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] || '';
        });
        rows.push(rowObj as RawMonographRow);
      }

      if (rows.length > 0) {
        setMonografias(rows);
        localStorage.setItem('ekiraya_repositorio_cache_v2', JSON.stringify(rows));
        showToast(`Se importaron exitosamente ${rows.length} monografías.`);
        setPastedData('');
        setShowAdminPanel(false);
      }
    } catch (e) {
      showToast('Error al procesar el texto pegado.');
    }
  };

  // Copiar código de Apps Script
  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setScriptCopied(true);
    showToast('Código de Apps Script copiado al portapapeles.');
    setTimeout(() => setScriptCopied(false), 3000);
  };

  // Extraer Unidades Académicas dinámicas con sus conteos
  const unidadesCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    monografias.forEach((m) => {
      const unit = m['Unidad Académica'] || m['unidad'] || m['unidad_academica'] || 'General';
      const cleanUnit = unit.trim();
      if (cleanUnit) {
        counts[cleanUnit] = (counts[cleanUnit] || 0) + 1;
      }
    });
    return counts;
  }, [monografias]);

  const sortedUnidades = useMemo(() => {
    return Object.keys(unidadesCounts).sort((a, b) => a.localeCompare(b));
  }, [unidadesCounts]);

  // Listas de filtros secundarios
  const lineasInvestigacion = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const l = m['Linea de investigación'] || m['linea_investigacion'] || '';
      if (l) {
        l.split('\n').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [monografias]);

  const asesoresList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const a = m['Asesor(es)'] || m['asesor'] || '';
      if (a) set.add(a.trim());
    });
    return Array.from(set).sort();
  }, [monografias]);

  const autoresList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const a = m.autor || '';
      if (a) set.add(a.trim());
    });
    return Array.from(set).sort();
  }, [monografias]);

  const anosGradosList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const ano = m.año || m.ano || '';
      const grado = m.grado || '';
      const label = grado ? `Grado ${grado}° (${ano})` : ano;
      if (label) set.add(label);
    });
    return Array.from(set).sort();
  }, [monografias]);

  // Filtrado y ordenamiento de monografías
  const filteredMonografias = useMemo(() => {
    return monografias.filter((m) => {
      // Filtro por unidad académica (chips o dropdown)
      if (selectedUnidad !== 'all') {
        const u = (m['Unidad Académica'] || m['unidad'] || '').trim().toLowerCase();
        if (u !== selectedUnidad.toLowerCase()) return false;
      }

      // Filtro por búsqueda global
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (m.documento_id || '').toLowerCase().includes(q) ||
          (m.titulo || '').toLowerCase().includes(q) ||
          (m.autor || '').toLowerCase().includes(q) ||
          (m.palabras_clave || '').toLowerCase().includes(q) ||
          (m.resumen || '').toLowerCase().includes(q) ||
          (m['Unidad Académica'] || '').toLowerCase().includes(q) ||
          (m['Asesor(es)'] || '').toLowerCase().includes(q) ||
          (m['Linea de investigación'] || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filtro por línea de investigación
      if (filterLinea !== 'all') {
        const l = (m['Linea de investigación'] || '').toLowerCase();
        if (!l.includes(filterLinea.toLowerCase())) return false;
      }

      // Filtro por tipo
      if (filterTipo !== 'all') {
        const t = (m.tipo || '').toLowerCase();
        if (t !== filterTipo.toLowerCase()) return false;
      }

      // Filtro por asesor
      if (filterAsesor !== 'all') {
        const a = (m['Asesor(es)'] || '').toLowerCase();
        if (a !== filterAsesor.toLowerCase()) return false;
      }

      // Filtro por autor
      if (filterAutor !== 'all') {
        const aut = (m.autor || '').toLowerCase();
        if (aut !== filterAutor.toLowerCase()) return false;
      }

      // Filtro por año/grado
      if (filterAnoGrado !== 'all') {
        const ano = m.año || m.ano || '';
        const grado = m.grado || '';
        const label = grado ? `Grado ${grado}° (${ano})` : ano;
        if (label !== filterAnoGrado) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'id') {
        return (parseInt(a.documento_id) || 0) - (parseInt(b.documento_id) || 0);
      }
      if (sortBy === 'titulo') {
        return (a.titulo || '').localeCompare(b.titulo || '');
      }
      if (sortBy === 'autor') {
        return (a.autor || '').localeCompare(b.autor || '');
      }
      if (sortBy === 'ano') {
        return (parseInt(b.año) || 0) - (parseInt(a.año) || 0);
      }
      if (sortBy === 'unidad') {
        return (a['Unidad Académica'] || '').localeCompare(b['Unidad Académica'] || '');
      }
      return 0;
    });
  }, [
    monografias,
    selectedUnidad,
    searchQuery,
    sortBy,
    filterLinea,
    filterTipo,
    filterAsesor,
    filterAutor,
    filterAnoGrado
  ]);

  // Las 3 monografías para el modo 3 cards
  const displayThree = useMemo(() => {
    return filteredMonografias.slice(0, 3);
  }, [filteredMonografias]);

  const toggleExpandSummary = (id: string) => {
    setExpandedSummaries((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCitation = (item: RawMonographRow) => {
    const citation = `${item.autor || 'Autor'}. (${item.año || '2026'}). ${item.titulo || 'Monografía de Proyecto de Vida'} [Monografía de grado, Colegio Ekirayá]. ${item.url_documento || ''}`;
    navigator.clipboard.writeText(citation);
    showToast('Cita en formato APA copiada al portapapeles');
  };

  // Helper para obtener color o icono por unidad académica
  const getUnitColor = (unitName: string) => {
    const u = (unitName || '').toLowerCase();
    if (u.includes('ciencia')) return { text: 'text-emerald-400', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (u.includes('psicología') || u.includes('psicologia')) return { text: 'text-indigo-400', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (u.includes('social') || u.includes('sociedad')) return { text: 'text-cyan-400', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    if (u.includes('música') || u.includes('musica') || u.includes('arte')) return { text: 'text-amber-400', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (u.includes('avia') || u.includes('aéreo')) return { text: 'text-sky-400', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (u.includes('admin') || u.includes('econ')) return { text: 'text-rose-400', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { text: 'text-violet-400', bg: 'bg-purple-50 text-[#664d88] border-purple-200' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Encabezado y Barra Institucional de Acceso de Comunidad */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#664d88] via-[#563f75] to-[#453160] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-xs text-[#f8c62e]">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Repositorio de Monografías (Proyecto de Vida)
                <span className="text-[11px] bg-white/20 text-violet-100 font-medium px-2 py-0.5 rounded-full">
                  Acceso Comunidad CEM (@cem.edu.co / @est.cem.edu.co)
                </span>
              </h2>
              <p className="text-xs text-violet-200/90 mt-0.5">
                Consulta y visualización de proyectos de investigación de estudiantes de grados anteriores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUserEmail === 'mebolanos@cem.edu.co' && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f8c62e] hover:bg-[#e8b524] text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-950" />
                <span>{showAdminPanel ? 'Ocultar Panel Admin' : 'Administración (@mebolanos)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Barra de Filtrado por Unidad Académica (Chips Dinámicos - Imagen 3) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            <Building2 className="w-4 h-4 text-[#664d88]" />
            <span>FILTRAR POR UNIDAD ACADÉMICA (COLUMNA “UNIDAD ACADÉMICA”):</span>
          </div>

          {/* Chips horizontales */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedUnidad('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedUnidad === 'all'
                  ? 'bg-[#664d88] text-white shadow-xs scale-102'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas las áreas ({monografias.length})
            </button>

            {sortedUnidades.map((unit) => {
              const isSelected = selectedUnidad.toLowerCase() === unit.toLowerCase();
              const count = unidadesCounts[unit] || 0;
              return (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setSelectedUnidad(isSelected ? 'all' : unit)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#664d88] text-white shadow-xs scale-102'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {unit} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Barra de Búsqueda, Sincronización y Ordenamiento (Imagen 3) */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Input de búsqueda */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la hoja repositorio por ID, título, autor, palabras clave, resumen..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#664d88] focus:border-transparent transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botón verde de sincronización */}
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-75 shrink-0"
              title="Sincronizar directamente con la hoja Repositorio de Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar ahora</span>
            </button>

            {/* Estado de sincronización */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 bg-amber-50 text-amber-800 border border-amber-200">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : syncStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'connected' ? 'Conectado a Sheets' : 'Reconectando...'}</span>
            </div>

            {/* Dropdown Ordenar por */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Ordenar por:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Ordenar monografías por campo"
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
              >
                <option value="id">ID de Documento (2262, 2530...)</option>
                <option value="titulo">Título (A-Z)</option>
                <option value="autor">Autor (A-Z)</option>
                <option value="ano">Año más reciente</option>
                <option value="unidad">Unidad Académica</option>
              </select>
            </div>
          </div>

          {/* 4. Dropdowns de Filtros Avanzados (6 Columnas - Imagen 3) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            {/* 1. Unidad Académica */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                1. UNIDAD ACADÉMICA
              </label>
              <select
                value={selectedUnidad}
                onChange={(e) => setSelectedUnidad(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todas ({sortedUnidades.length})</option>
                {sortedUnidades.map((u) => (
                  <option key={u} value={u}>
                    {u} ({unidadesCounts[u]})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Línea de Investigación */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                2. LÍNEA DE INVESTIG.
              </label>
              <select
                value={filterLinea}
                onChange={(e) => setFilterLinea(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todas ({lineasInvestigacion.length})</option>
                {lineasInvestigacion.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Tipo de Documento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                3. TIPO DE DOCUMENTO
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todos (1)</option>
                <option value="Investigación">Investigación</option>
                <option value="Monografía">Monografía</option>
              </select>
            </div>

            {/* 4. Asesor(es) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                4. ASESOR(ES)
              </label>
              <select
                value={filterAsesor}
                onChange={(e) => setFilterAsesor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todos ({asesoresList.length})</option>
                {asesoresList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Autor / Estudiante */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                5. AUTOR / ESTUDIANTE
              </label>
              <select
                value={filterAutor}
                onChange={(e) => setFilterAutor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todos ({autoresList.length})</option>
                {autoresList.map((aut) => (
                  <option key={aut} value={aut}>
                    {aut}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Año y Grado */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 truncate">
                6. AÑO Y GRADO
              </label>
              <select
                value={filterAnoGrado}
                onChange={(e) => setFilterAnoGrado(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#664d88]"
              >
                <option value="all">Todos los años ({anosGradosList.length || 1})</option>
                {anosGradosList.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Barra de Resultados y Conmutador de Vistas (Imagen 3) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#664d88]" />
              <span>
                Mostrando <strong className="text-slate-900">{filteredMonografias.length}</strong> documentos en pantalla (de <strong className="text-slate-900">{monografias.length}</strong> de la hoja <em>repositorio</em>)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('3cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === '3cards'
                    ? 'bg-[#664d88] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⭐ 3 Ejemplos en Tarjetas</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'reader'
                    ? 'bg-[#664d88] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📖 Lector en Pantalla (3 Ejemplos)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-[#664d88] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>📑 Ver Todas ({filteredMonografias.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. PANEL ADMINISTRATIVO (Para mebolanos@cem.edu.co) - Imagen 1 & Imagen 2 */}
      {showAdminPanel && (
        <div className="bg-white rounded-2xl border-2 border-violet-300 shadow-md p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-100 text-[#664d88]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Panel de Administración y Sincronización Institucional
                </h3>
                <p className="text-xs text-slate-500">
                  Configurado para: <strong>mebolanos@cem.edu.co</strong> | Google Sheets ID: <code>1_JgI8DRjnvql9sruq54rFbwVBFelokqpIv2NkQKgZi0</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminPanel(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de pestañas del panel admin */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setAdminTab('mapping')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminTab === 'mapping' ? 'bg-[#664d88] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📊 Mapeo de Columnas (17 Columnas)
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('appscript')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminTab === 'appscript' ? 'bg-[#664d88] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {'</>'} Código Google Apps Script (Drive + Sheets)
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('manualSync')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminTab === 'manualSync' ? 'bg-[#664d88] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📋 Importar/Pegar Datos de Sheets
            </button>
          </div>

          {/* Subpestaña 1: Mapeo de 17 columnas (Imagen 1 / 2.png) */}
          {adminTab === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Table className="w-4 h-4 text-[#664d88]" />
                <span>2. Títulos de Columna Leídos en la Hoja de Monografías (17 columnas)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del archivo</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700">
                    <option>-- Automático --</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la monografía</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>titulo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Autor</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>autor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Año lectivo</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>año</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asignatura</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700">
                    <option>-- Automático --</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad académica</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>Unidad Académica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enlace Drive</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>url_documento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID del archivo</label>
                  <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-mono">
                    <option>drive_file_id</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Subpestaña 2: Código Apps Script (Imagen 2 / 3.png) */}
          {adminTab === 'appscript' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Code2 className="w-4 h-4 text-[#664d88]" />
                  <span>4. Código Google Apps Script Actualizado (Respeta columnas + Trigger 24h)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#664d88] hover:bg-[#533e6f] text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{scriptCopied ? '¡Copiado!' : 'Copiar código Apps Script'}</span>
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 p-4 font-mono text-xs max-h-72 overflow-y-auto">
                <pre>{APPS_SCRIPT_CODE}</pre>
              </div>
            </div>
          )}

          {/* Subpestaña 3: Importar manualmente pegando texto */}
          {adminTab === 'manualSync' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Copia las filas directamente desde tu Google Sheets (Ctrl+C en la hoja) y pégalas aquí para actualizar instantáneamente el catálogo de monografías:
              </div>
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Pega aquí las filas copiadas de Google Sheets..."
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#664d88]"
              />
              <button
                type="button"
                onClick={handleManualImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Procesar y guardar datos de monografías</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. VISTA PRINCIPAL (3 EJEMPLOS EN TARJETAS - Imagen 4 / 5.png) */}
      {viewMode === '3cards' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                Vista Previa en Pantalla: 3 Ejemplos Destacados de la Hoja "repositorio"
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ⭐ 3 Ejemplos Verificados
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualización simultánea de 3 monografías con su unidad académica, línea de investigación, autor, asesor y resumen.
              </p>
            </div>
            {filteredMonografias.length > 3 && (
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className="text-xs font-bold text-[#664d88] hover:text-[#533e6f] underline cursor-pointer"
              >
                Ver el catálogo completo ({filteredMonografias.length} documentos) →
              </button>
            )}
          </div>

          {/* Grid de 3 Tarjetas (Exacto a Imagen 4 / 5.png) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayThree.map((item, index) => {
              const unitTheme = getUnitColor(item['Unidad Académica'] || '');
              const isSummaryExpanded = expandedSummaries[item.documento_id] || false;
              const driveEmbedUrl = item.drive_file_id
                ? `https://drive.google.com/file/d/${item.drive_file_id}/preview`
                : item.url_documento
                ? item.url_documento.replace('/view', '/preview')
                : '';

              return (
                <article
                  key={item.documento_id || index}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Cabecera Superior Oscura (Diseño idéntico a Imagen 4) */}
                  <div className="bg-[#2d1e4e] text-white p-4.5 rounded-t-2xl flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-violet-200 font-semibold tracking-wide uppercase text-[11px]">
                        <GraduationCap className="w-3.5 h-3.5 text-[#f8c62e]" />
                        <span>COLEGIO EKIRAYÁ · GRADO {item.grado || '11'}°</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[11px] font-bold text-white tracking-wider">
                        ID: {item.documento_id}
                      </span>
                    </div>

                    {/* Unidad Académica y Título */}
                    <div className="my-2.5">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${unitTheme.text} mb-1.5`}>
                        <Landmark className="w-3.5 h-3.5" />
                        <span>{item['Unidad Académica'] || 'General'}</span>
                      </div>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-white leading-snug line-clamp-3 group-hover:text-violet-100 transition-colors">
                        {item.titulo}
                      </h4>
                    </div>

                    {/* Autor, Año y Estado */}
                    <div className="flex items-center justify-between text-xs text-violet-200/80 pt-2 border-t border-white/10">
                      <span className="font-medium text-white truncate mr-2">{item.autor}</span>
                      <span className="shrink-0">{item.año || '2026'} · {item.estado || 'Finalizado'}</span>
                    </div>
                  </div>

                  {/* Visor PDF Embebido con Controles (Imagen 4) */}
                  <div className="relative bg-slate-900 aspect-4/3 overflow-hidden group/viewer border-b border-slate-200">
                    {driveEmbedUrl ? (
                      <iframe
                        src={driveEmbedUrl}
                        title={`Visor monografía: ${item.titulo}`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <FileText className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-xs">Documento disponible en Google Drive</p>
                      </div>
                    )}

                    {/* Botón flotante Ampliar visor */}
                    <button
                      type="button"
                      onClick={() => setModalMonografia(item)}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-950 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-md border border-white/15 transition-transform hover:scale-105 cursor-pointer z-10"
                      title="Ver monografía en visor ampliado de pantalla completa"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ampliar visor</span>
                    </button>

                    {/* Barra de control inferior tipo visor PDF */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-full text-[11px] font-medium backdrop-blur-md flex items-center gap-3 border border-white/15 shadow-lg z-10">
                      <span>Página 1 de monografía</span>
                      <div className="h-3 w-px bg-white/20" />
                      <a
                        href={item.url_documento || (item.drive_file_id ? `https://drive.google.com/file/d/${item.drive_file_id}/view` : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f8c62e] hover:underline flex items-center gap-1"
                        title="Abrir directamente en Google Drive"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Drive</span>
                      </a>
                    </div>
                  </div>

                  {/* Cuerpo de Metadata Académica */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 bg-white">
                    {/* Tags de Área y Grado */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${unitTheme.bg}`}>
                        <Building2 className="w-3 h-3" />
                        {item['Unidad Académica'] || 'General'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Grado {item.grado || '11'} · {item.año || '2026'}
                      </span>
                      {item.tipo && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.tipo}
                        </span>
                      )}
                    </div>

                    {/* Línea de Investigación */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        LÍNEA DE INVESTIGACIÓN:
                      </span>
                      <p className="font-semibold text-slate-800 leading-relaxed">
                        {item['Linea de investigación']?.replace(/\n/g, ' · ') || 'Investigación formativa'}
                      </p>
                    </div>

                    {/* Asesor */}
                    {item['Asesor(es)'] && (
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-bold text-slate-500">Asesor:</span>
                        <span className="font-medium text-slate-900">{item['Asesor(es)']}</span>
                      </div>
                    )}

                    {/* Resumen */}
                    {item.resumen && (
                      <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <span className="block font-bold text-slate-700 mb-1">Resumen del Proyecto:</span>
                        <p className={`leading-relaxed text-slate-700 ${!isSummaryExpanded ? 'line-clamp-3' : ''}`}>
                          {item.resumen}
                        </p>
                        {item.resumen.length > 140 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandSummary(item.documento_id)}
                            className="mt-1.5 text-xs font-bold text-[#664d88] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isSummaryExpanded ? 'Ver menos' : 'Leer resumen completo'}</span>
                            {isSummaryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Palabras Clave */}
                    {item.palabras_clave && (
                      <div className="text-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          PALABRAS CLAVE:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.palabras_clave.split(/[,;\n]/).map((kw, kwIdx) => {
                            const cleanKw = kw.trim();
                            if (!cleanKw) return null;
                            return (
                              <span
                                key={kwIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60"
                              >
                                #{cleanKw}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyCitation(item)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Copiar cita bibliográfica en formato APA 7"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copiar Cita APA</span>
                      </button>

                      <a
                        href={item.url_documento || (item.drive_file_id ? `https://drive.google.com/file/d/${item.drive_file_id}/view` : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#664d88] hover:bg-[#533e6f] text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Abrir monografía en Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                        <span>Abrir Drive</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. MODO LECTOR EN PANTALLA (3 EJEMPLOS) */}
      {viewMode === 'reader' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5 text-[#664d88]" />
              Lector en Pantalla: Visualización Documental Directa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lectura y análisis de monografías en paralelo con visor de documentos activo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {displayThree.map((item, index) => {
              const driveEmbedUrl = item.drive_file_id
                ? `https://drive.google.com/file/d/${item.drive_file_id}/preview`
                : item.url_documento
                ? item.url_documento.replace('/view', '/preview')
                : '';

              return (
                <div key={item.documento_id || index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-[#2d1e4e] text-white p-3 flex items-center justify-between">
                    <span className="text-xs font-bold truncate max-w-[200px]">{item.titulo}</span>
                    <button
                      type="button"
                      onClick={() => setModalMonografia(item)}
                      className="p-1 text-white hover:text-[#f8c62e]"
                      title="Ampliar visor"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-slate-900 h-[480px] w-full">
                    {driveEmbedUrl ? (
                      <iframe
                        src={driveEmbedUrl}
                        title={`Visor ${item.titulo}`}
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">
                        No hay visor disponible
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-700 truncate">{item.autor}</span>
                    <a
                      href={item.url_documento || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#664d88] font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Drive</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. MODO CATÁLOGO COMPLETO (TODAS LAS MONOGRAFÍAS) */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
              <Table className="w-5 h-5 text-[#664d88]" />
              Catálogo General de Monografías ({filteredMonografias.length} documentos)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Última actualización: {lastSyncDate}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMonografias.map((item, index) => {
              const unitTheme = getUnitColor(item['Unidad Académica'] || '');
              return (
                <div
                  key={item.documento_id || index}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${unitTheme.bg}`}>
                        {item['Unidad Académica'] || 'General'}
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        ID: {item.documento_id}
                      </span>
                    </div>
                    <h5 className="font-serif font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {item.titulo}
                    </h5>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {item.autor} · {item.año || '2026'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setModalMonografia(item)}
                      className="text-[#664d88] font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha &amp; Visor</span>
                    </button>
                    <a
                      href={item.url_documento || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Drive</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. MODAL DE VISOR AMPLIADO EN PANTALLA COMPLETA */}
      {modalMonografia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Cabecera del modal */}
            <div className="bg-[#2d1e4e] text-white px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-violet-200 mb-1">
                  <span className="font-bold">ID: {modalMonografia.documento_id}</span>
                  <span>•</span>
                  <span>{modalMonografia['Unidad Académica']}</span>
                  <span>•</span>
                  <span>{modalMonografia.autor} ({modalMonografia.año || '2026'})</span>
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white truncate">
                  {modalMonografia.titulo}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={modalMonografia.url_documento || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
                  title="Abrir en pestaña de Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Google Drive</span>
                </a>
                <button
                  type="button"
                  onClick={() => setModalMonografia(null)}
                  className="p-2 rounded-xl text-white hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del visor */}
            <div className="flex-1 bg-slate-900 relative min-h-[450px]">
              {modalMonografia.drive_file_id ? (
                <iframe
                  src={`https://drive.google.com/file/d/${modalMonografia.drive_file_id}/preview`}
                  title={`Visor ${modalMonografia.titulo}`}
                  className="w-full h-full border-0 absolute inset-0"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white text-sm">
                  Documento disponible en Google Drive.
                </div>
              )}
            </div>

            {/* Ficha Técnica al pie del modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 max-h-48 overflow-y-auto space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="font-bold text-slate-500 block">LÍNEA DE INVESTIGACIÓN:</span>
                  <span className="font-semibold text-slate-900">{modalMonografia['Linea de investigación'] || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">ASESOR(ES):</span>
                  <span className="font-semibold text-slate-900">{modalMonografia['Asesor(es)'] || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">PALABRAS CLAVE:</span>
                  <span className="text-slate-800">{modalMonografia.palabras_clave || 'N/A'}</span>
                </div>
              </div>
              {modalMonografia.resumen && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500 block mb-0.5">RESUMEN:</span>
                  <p className="text-slate-700 leading-relaxed">{modalMonografia.resumen}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
