import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Eye,
  X,
  Copy,
  Users,
  Plus,
  Trash2,
  Layers,
  FileCode,
  Globe,
  Lock,
  ArrowRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { MonografiaItem, UsuarioItem, RepositorioStats, UserPerfilRole } from '../types/repositorio';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/gasScriptCode';
import { DEFAULT_REPO_ROWS, DEFAULT_AUTHORIZED_USERS } from '../data/repositorioDefaultData';

interface RepositorioSectionProps {
  showToast: (msg: string) => void;
  currentUserEmail?: string;
  isAdminLoggedIn?: boolean;
}

export const RepositorioSection: React.FC<RepositorioSectionProps> = ({
  showToast,
  currentUserEmail = 'mebolanos@cem.edu.co',
  isAdminLoggedIn = false,
}) => {
  // Estado principal de datos
  const [monografias, setMonografias] = useState<MonografiaItem[]>(() => {
    try {
      const cached = localStorage.getItem('ekiraya_monografias_cache_v3');
      if (cached) return JSON.parse(cached);
    } catch {
      // Fallback
    }
    return (DEFAULT_REPO_ROWS as unknown as MonografiaItem[]) || [];
  });

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(() => {
    return (DEFAULT_AUTHORIZED_USERS as unknown as UsuarioItem[]) || [];
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState('TODAS');
  const [selectedAnio, setSelectedAnio] = useState('TODOS');
  const [selectedGrado, setSelectedGrado] = useState('TODOS');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Modales
  const [previewDoc, setPreviewDoc] = useState<MonografiaItem | null>(null);
  const [isGasCodeModalOpen, setIsGasCodeModalOpen] = useState(false);
  const [isGasUrlModalOpen, setIsGasUrlModalOpen] = useState(false);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedGasCode, setCopiedGasCode] = useState(false);

  // Configuración de Web App de Apps Script
  const [gasWebAppUrl, setGasWebAppUrl] = useState<string>(() => {
    return localStorage.getItem('ekiraya_gas_webapp_url') || '';
  });
  const [tempGasUrl, setTempGasUrl] = useState(gasWebAppUrl);
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testConnectionMessage, setTestConnectionMessage] = useState<string>('');
  const [csvPasteText, setCsvPasteText] = useState<string>('');

  // Formulario para nuevo usuario
  const [newUser, setNewUser] = useState<Partial<UsuarioItem>>({
    Nombres: '',
    Curso: '11',
    Correo: '',
    Sección: 'Bachillerato',
    Perfil: 'Estudiante',
  });
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // Verificación de autenticación y rol
  const cleanEmail = currentUserEmail.trim().toLowerCase();
  const isAllowedDomain =
    cleanEmail.endsWith('@cem.edu.co') ||
    cleanEmail.endsWith('@est.cem.edu.co') ||
    cleanEmail.endsWith('@ekiraya.edu.co');

  const isAdmin = Boolean(isAdminLoggedIn);

  const userRole: UserPerfilRole = isAdmin
    ? 'Administrador'
    : cleanEmail.endsWith('@est.cem.edu.co')
    ? 'Estudiante'
    : 'Docente';

  // Cargar datos al montar y escuchar actualizaciones en tiempo real entre terminales
  useEffect(() => {
    fetchMonografias();
    fetchUsuarios();

    const handleRepoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (Array.isArray(customEvent.detail)) {
        setMonografias(customEvent.detail);
        localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(customEvent.detail));
        showToast('¡Repositorio actualizado en tiempo real desde el servidor!');
      }
    };
    window.addEventListener('ekiraya_repo_update', handleRepoUpdate);
    return () => {
      window.removeEventListener('ekiraya_repo_update', handleRepoUpdate);
    };
  }, []);

  const fetchMonografias = async () => {
    // 1. Si hay una URL de Google Apps Script configurada, consultar directamente al servidor de Google
    const activeGasUrl = (gasWebAppUrl || localStorage.getItem('ekiraya_gas_webapp_url') || '').trim();
    if (activeGasUrl && activeGasUrl.includes('script.google.com')) {
      try {
        const getMonoUrl = `${activeGasUrl}${activeGasUrl.includes('?') ? '&' : '?'}action=getMonografias&_t=${Date.now()}`;
        const monoResp = await fetch(getMonoUrl, { method: 'GET', redirect: 'follow' });
        if (monoResp.ok) {
          const result = await monoResp.json();
          if (result?.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
            setMonografias(result.data);
            localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(result.data));
            return;
          }
        }
      } catch (err) {
        console.warn('Error leyendo directamente de Google Apps Script:', err);
      }
    }

    // 2. Si no hay GAS o falló, intentar desde el backend local si existe
    try {
      const resp = await fetch('/api/repositorio/monografias');
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          setMonografias(result.data);
          localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(result.data));
        }
      }
    } catch {
      // Mantener datos locales/cacheados
    }
  };

  const fetchUsuarios = async () => {
    // Si hay Google Apps Script, consultar usuarios directamente
    const activeGasUrl = (gasWebAppUrl || localStorage.getItem('ekiraya_gas_webapp_url') || '').trim();
    if (activeGasUrl && activeGasUrl.includes('script.google.com')) {
      try {
        const getUsersUrl = `${activeGasUrl}${activeGasUrl.includes('?') ? '&' : '?'}action=getUsers&_t=${Date.now()}`;
        const usersResp = await fetch(getUsersUrl, { method: 'GET', redirect: 'follow' });
        if (usersResp.ok) {
          const result = await usersResp.json();
          if (result?.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
            setUsuarios(result.data);
            return;
          }
        }
      } catch {
        // Fallback a backend
      }
    }

    try {
      const resp = await fetch('/api/repositorio/users');
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          setUsuarios(result.data);
        }
      }
    } catch {
      // Mantener lista local
    }
  };

  // Sincronización en vivo con Google Drive y Google Sheets
  const handleSyncDrive = async (overrideUrl?: string) => {
    const activeUrl = (overrideUrl || gasWebAppUrl || localStorage.getItem('ekiraya_gas_webapp_url') || '').trim();

    // Si aún no se ha configurado la URL de la Web App de Google, abrir el modal de conexión
    if (!activeUrl || !activeUrl.includes('script.google.com')) {
      setTempGasUrl(activeUrl);
      setIsGasUrlModalOpen(true);
      showToast('Por favor conecta la URL de tu Google Apps Script para sincronizar en vivo con Drive y Sheets.');
      return;
    }

    setIsSyncing(true);
    let liveSyncedFromGoogle = false;

    try {
      // 1. Invocar sincronización directamente contra el servidor de Google Apps Script (compatible con Vercel)
      const syncQueryUrl = `${activeUrl}${activeUrl.includes('?') ? '&' : '?'}action=syncDrive&userEmail=${encodeURIComponent(currentUserEmail)}&_t=${Date.now()}`;

      try {
        const gasResp = await fetch(syncQueryUrl, {
          method: 'GET',
          redirect: 'follow',
        });
        if (gasResp.ok) {
          const gasData = await gasResp.json();
          if (gasData?.status === 'success') {
            liveSyncedFromGoogle = true;
          }
        }
      } catch (gasErr) {
        console.warn('Fallo en sincronización directa GAS, intentando lectura:', gasErr);
      }

      // 2. Leer las monografías actualizadas desde Google Sheets mediante Google Apps Script
      try {
        const getMonoUrl = `${activeUrl}${activeUrl.includes('?') ? '&' : '?'}action=getMonografias&_t=${Date.now()}`;
        const monoResp = await fetch(getMonoUrl, {
          method: 'GET',
          redirect: 'follow',
        });
        if (monoResp.ok) {
          const monoResult = await monoResp.json();
          if (monoResult?.status === 'success' && Array.isArray(monoResult.data)) {
            setMonografias(monoResult.data);
            localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(monoResult.data));
            showToast(`¡Sincronización en vivo con Google completada! Se actualizaron ${monoResult.data.length} monografías desde Sheets y Drive.`);
            setIsSyncing(false);
            return;
          }
        }
      } catch (readErr) {
        console.warn('Error al leer monografías desde Google Apps Script:', readErr);
      }

      // 3. Fallback: Intentar mediante backend proxy si está disponible (entorno dev local)
      try {
        const resp = await fetch('/api/repositorio/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUserEmail,
            gasWebAppUrl: activeUrl,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'success') {
            if (Array.isArray(data.data?.monografias)) {
              setMonografias(data.data.monografias);
              localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(data.data.monografias));
            } else {
              await fetchMonografias();
            }
            showToast('Sincronización completada exitosamente desde Google Workspace.');
            setIsSyncing(false);
            return;
          }
        }
      } catch {
        // En Vercel el backend no está montado, continuar con reporte claro
      }

      if (liveSyncedFromGoogle) {
        showToast('Sincronización ejecutada en Google Drive. Obteniendo datos de Sheets...');
        await fetchMonografias();
      } else {
        showToast('No se pudo conectar con la Web App de Google. Revisa la URL y los permisos en Apps Script.');
        setIsGasUrlModalOpen(true);
      }
    } catch (err: any) {
      showToast(`Error al sincronizar con Google: ${err.message || 'Verifica la URL de la Web App'}`);
      setIsGasUrlModalOpen(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Probar conexión en vivo con la Web App de Google Apps Script
  const handleTestGasConnection = async () => {
    const url = tempGasUrl.trim();
    if (!url || !url.includes('script.google.com')) {
      setTestConnectionStatus('error');
      setTestConnectionMessage('La URL debe comenzar con https://script.google.com/macros/s/.../exec');
      return;
    }

    setTestConnectionStatus('testing');
    setTestConnectionMessage('Conectando con el servidor de Google Apps Script...');

    try {
      const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=getMonografias&_t=${Date.now()}`;
      const resp = await fetch(testUrl, { method: 'GET', redirect: 'follow' });

      if (!resp.ok) {
        throw new Error(`Google respondió con código HTTP ${resp.status}`);
      }

      const result = await resp.json();
      if (result && result.status === 'success') {
        setTestConnectionStatus('success');
        setTestConnectionMessage(`¡Conexión exitosa! Se leyeron ${result.data?.length || 0} monografías directamente desde tu hoja de Google Sheets.`);
        if (Array.isArray(result.data) && result.data.length > 0) {
          setMonografias(result.data);
          localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(result.data));
        }
      } else {
        setTestConnectionStatus('error');
        setTestConnectionMessage(result?.message || 'La Web App de Google respondió pero no retornó el formato esperado.');
      }
    } catch (err: any) {
      setTestConnectionStatus('error');
      setTestConnectionMessage(`Error al conectar con Google: ${err.message || 'Verifica que la Web App esté desplegada con acceso para "Cualquiera".'}`);
    }
  };

  // Guardar URL de Google Apps Script y sincronizar de inmediato
  const handleSaveAndSyncGasUrl = async () => {
    const cleanUrl = tempGasUrl.trim();
    if (!cleanUrl || !cleanUrl.includes('script.google.com')) {
      showToast('Por favor ingresa una URL válida de Google Apps Script (/exec)');
      return;
    }

    setGasWebAppUrl(cleanUrl);
    localStorage.setItem('ekiraya_gas_webapp_url', cleanUrl);
    setIsGasUrlModalOpen(false);
    showToast('URL de Google Apps Script guardada.');
    await handleSyncDrive(cleanUrl);
  };

  // Importar / Pegar datos directamente de Sheets (TSV / CSV)
  const handleImportPastedData = () => {
    const raw = csvPasteText.trim();
    if (!raw) {
      showToast('Por favor pega los datos de la hoja de cálculo.');
      return;
    }

    try {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const firstLineTokens = lines[0].split(delimiter).map((t) => t.trim().replace(/^["']|["']$/g, ''));

      const isHeaderRow = firstLineTokens.some((t) =>
        /documento|titulo|autor|grado|año|ano|unidad|linea|asesor|drive|resumen/i.test(t)
      );

      const startIndex = isHeaderRow ? 1 : 0;
      const headers = isHeaderRow
        ? firstLineTokens
        : [
            'documento_id',
            'titulo',
            'autor',
            'grado',
            'año',
            'Unidad Académica',
            'Linea de investigación',
            'tipo',
            'palabras_clave',
            'resumen',
            'Asesor(es)',
            'drive_file_id',
            'url_documento',
            'visibilidad',
            'estado',
            'fecha_registro',
            'fecha_actualizacion',
          ];

      const parsedItems: MonografiaItem[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const tokens = lines[i].split(delimiter).map((t) => t.trim().replace(/^["']|["']$/g, ''));
        if (tokens.length === 0 || (tokens.length === 1 && !tokens[0])) continue;

        const item: any = {};
        headers.forEach((h, hIdx) => {
          if (h && tokens[hIdx] !== undefined) {
            item[h] = tokens[hIdx];
          }
        });

        // Asegurar título y ID
        if (!item.titulo && tokens[1]) item.titulo = tokens[1];
        if (!item.documento_id) item.documento_id = `import_${i}`;

        parsedItems.push(item as MonografiaItem);
      }

      if (parsedItems.length > 0) {
        setMonografias(parsedItems);
        localStorage.setItem('ekiraya_monografias_cache_v3', JSON.stringify(parsedItems));
        setIsImportCsvModalOpen(false);
        setCsvPasteText('');
        showToast(`¡Importación exitosa! Se cargaron ${parsedItems.length} monografías desde Sheets.`);
      } else {
        showToast('No se encontraron filas válidas para importar.');
      }
    } catch (err: any) {
      showToast(`Error al procesar los datos: ${err.message}`);
    }
  };

  // Agregar usuario en la hoja de Usuarios
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);

    const email = (newUser.Correo || '').trim().toLowerCase();
    if (!email) {
      setUserActionError('El correo electrónico es requerido.');
      return;
    }

    if (!email.endsWith('@cem.edu.co') && !email.endsWith('@est.cem.edu.co') && !email.endsWith('@ekiraya.edu.co')) {
      setUserActionError('Solo se permiten correos del dominio institucional (@cem.edu.co / @est.cem.edu.co / @ekiraya.edu.co).');
      return;
    }

    try {
      const resp = await fetch('/api/repositorio/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUserEmail,
          user: newUser,
          gasWebAppUrl: gasWebAppUrl.trim(),
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        showToast('Usuario agregado exitosamente a la lista de usuarios.');
        setUsuarios((prev) => [...prev, newUser as UsuarioItem]);
        setNewUser({
          Nombres: '',
          Curso: '11',
          Correo: '',
          Sección: 'Bachillerato',
          Perfil: 'Estudiante',
        });
      } else {
        setUserActionError(data.message || 'Error al agregar usuario.');
      }
    } catch {
      setUserActionError('Error al comunicarse con el servidor.');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (emailToDelete: string) => {
    if (!confirm(`¿Confirmas que deseas eliminar al usuario ${emailToDelete}?`)) return;

    try {
      const resp = await fetch(`/api/repositorio/users/${encodeURIComponent(emailToDelete)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUserEmail,
          gasWebAppUrl: gasWebAppUrl.trim(),
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setUsuarios((prev) => prev.filter((u) => u.Correo?.toLowerCase() !== emailToDelete.toLowerCase()));
        showToast('Usuario eliminado correctamente.');
      } else {
        showToast(data.message || 'Error al eliminar usuario.');
      }
    } catch {
      showToast('Error al procesar la eliminación.');
    }
  };

  // Guardar URL de Google Apps Script Web App
  const handleSaveGasUrl = () => {
    const cleanUrl = tempGasUrl.trim();
    setGasWebAppUrl(cleanUrl);
    localStorage.setItem('ekiraya_gas_webapp_url', cleanUrl);
    setIsGasUrlModalOpen(false);
    showToast('URL de Google Apps Script actualizada.');
  };

  // Copiar código GAS al portapapeles
  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedGasCode(true);
    showToast('Código Code.gs copiado al portapapeles.');
    setTimeout(() => setCopiedGasCode(false), 2500);
  };

  // Opciones dinámicas de filtros
  const unidadesList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const u = m['Unidad Académica'] || m['unidad_academica'] || '';
      if (u.trim()) set.add(u.trim());
    });
    return Array.from(set).sort();
  }, [monografias]);

  const aniosList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const a = m['año'] || m['ano'] || m['anio'] || '';
      if (a.trim()) set.add(a.trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [monografias]);

  const gradosList = useMemo(() => {
    const set = new Set<string>();
    monografias.forEach((m) => {
      const g = m['grado'] || '';
      if (g.trim()) set.add(g.trim());
    });
    return Array.from(set).sort();
  }, [monografias]);

  // Filtrado de monografías en tiempo real
  const filteredMonografias = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return monografias.filter((m) => {
      // Filtro Unidad Académica
      if (selectedUnidad !== 'TODAS') {
        const u = (m['Unidad Académica'] || m['unidad_academica'] || '').trim().toLowerCase();
        if (u !== selectedUnidad.toLowerCase()) return false;
      }

      // Filtro Año
      if (selectedAnio !== 'TODOS') {
        const a = (m['año'] || m['ano'] || m['anio'] || '').trim();
        if (a !== selectedAnio) return false;
      }

      // Filtro Grado
      if (selectedGrado !== 'TODOS') {
        const g = (m['grado'] || '').trim();
        if (g !== selectedGrado) return false;
      }

      // Filtro de búsqueda general
      if (q) {
        const fullText = [
          m.titulo,
          m.autor,
          m['Unidad Académica'],
          m['Linea de investigación'],
          m['Asesor(es)'],
          m.palabras_clave,
          m.resumen,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!fullText.includes(q)) return false;
      }

      return true;
    });
  }, [monografias, searchQuery, selectedUnidad, selectedAnio, selectedGrado]);

  const isFiltering =
    searchQuery.trim() !== '' ||
    selectedUnidad !== 'TODAS' ||
    selectedAnio !== 'TODOS' ||
    selectedGrado !== 'TODOS';

  const displayedMonografias = isFiltering
    ? filteredMonografias
    : filteredMonografias.slice(0, 3);

  // Si el usuario no pertenece a la comunidad educativa
  if (!isAllowedDomain) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl border border-red-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido al Repositorio</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          El Repositorio de Monografías y Proyectos de Vida es de uso exclusivo para estudiantes,
          docentes y personal directivo del <strong>Colegio Ekirayá</strong>.
          <br />
          Solo se permiten cuentas con dominio <code>@cem.edu.co</code> o <code>@est.cem.edu.co</code>.
        </p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
          Cuenta detectada: <strong>{currentUserEmail || 'No autenticado'}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Principal del Repositorio */}
      <div className="bg-gradient-to-r from-[#664d88] via-[#533e6f] to-[#3f2e55] rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <BookOpen className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-[#f8c62e] text-slate-950 text-xs font-black uppercase tracking-wider shadow-xs">
                Repositorio PV
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-xs font-semibold text-violet-100">
                Google Workspace &middot; Drive &amp; Sheets
              </span>
            </div>

            {/* Badge de Usuario y Rol */}
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/15 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="font-semibold text-white truncate max-w-[180px]">{currentUserEmail}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[#f8c62e] font-black text-[10px] uppercase">
                {userRole}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
            Repositorio de Monografías y Proyectos de Vida
          </h1>
          <p className="text-violet-200 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Consulta oficial de trabajos de grado, monografías académicas y proyectos de vida del Colegio Ekirayá.
            Indexado dinámicamente mediante Google Sheets y Google Drive por unidades académicas y años.
          </p>

          {/* Estadísticas en Tarjetas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-violet-200 uppercase font-bold tracking-wider block">
                Total Monografías
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#f8c62e]">{monografias.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-violet-200 uppercase font-bold tracking-wider block">
                Unidades Académicas
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">{unidadesList.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-violet-200 uppercase font-bold tracking-wider block">
                Años Indexados
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">{aniosList.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-violet-200 uppercase font-bold tracking-wider block">
                Resultados Filtro
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                {filteredMonografias.length}
              </span>
            </div>
          </div>

          {/* Barra de Acciones Administrativas (Solo visible para Administradores) */}
          {isAdmin && (
            <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-100">
                  <ShieldCheck className="w-4 h-4 text-[#f8c62e]" />
                  <span>Admin:</span>
                </div>

                {/* Badge de Estado de Conexión con Google */}
                {gasWebAppUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTempGasUrl(gasWebAppUrl);
                      setTestConnectionStatus('idle');
                      setTestConnectionMessage('');
                      setIsGasUrlModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    title="Google Apps Script conectado. Clic para editar o probar."
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Google Web App Conectada</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempGasUrl('');
                      setTestConnectionStatus('idle');
                      setTestConnectionMessage('');
                      setIsGasUrlModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#f8c62e]/20 text-[#f8c62e] border border-[#f8c62e]/40 text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#f8c62e]/30 transition-colors cursor-pointer"
                    title="Conectar con Google Apps Script para sincronización en vivo"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-[#f8c62e]" />
                    <span>Conectar Google Apps Script</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón Sincronizar en Vivo */}
                <button
                  type="button"
                  onClick={() => handleSyncDrive()}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-[#f8c62e] hover:bg-[#eab308] text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  title="Sincronizar en vivo con Google Drive y Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando con Google...' : 'Sincronizar Drive & Sheets'}</span>
                </button>

                {/* Botón Importar / Pegar Datos */}
                <button
                  type="button"
                  onClick={() => setIsImportCsvModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Pegar filas copiadas directamente de Google Sheets"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-200" />
                  <span>Pegar de Sheets</span>
                </button>

                {/* Botón Configurar Web App */}
                <button
                  type="button"
                  onClick={() => {
                    setTempGasUrl(gasWebAppUrl);
                    setTestConnectionStatus('idle');
                    setTestConnectionMessage('');
                    setIsGasUrlModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Configurar URL de Google Apps Script"
                >
                  <Globe className="w-3.5 h-3.5 text-[#f8c62e]" />
                  <span>Conexión Google</span>
                </button>

                {/* Botón Gestión de Usuarios */}
                <button
                  type="button"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Usuarios</span>
                </button>

                {/* Botón Ver Código Apps Script */}
                <button
                  type="button"
                  onClick={() => setIsGasCodeModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#f8c62e]" />
                  <span>Code.gs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda Avanzada */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, estudiante, asesor, línea de investigación o palabras clave..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#664d88] focus:border-[#664d88] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selectores de Filtros */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtro Unidad Académica */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Unidad:</span>
              <select
                value={selectedUnidad}
                onChange={(e) => setSelectedUnidad(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas las Unidades</option>
                {unidadesList.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Año */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Año:</span>
              <select
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos los años</option>
                {aniosList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Grado */}
            {gradosList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Grado:</span>
                <select
                  value={selectedGrado}
                  onChange={(e) => setSelectedGrado(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos</option>
                  {gradosList.map((g) => (
                    <option key={g} value={g}>
                      Grado {g}°
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Limpiar Filtros */}
            {(selectedUnidad !== 'TODAS' || selectedAnio !== 'TODOS' || selectedGrado !== 'TODOS' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnidad('TODAS');
                  setSelectedAnio('TODOS');
                  setSelectedGrado('TODOS');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Chips de Unidades Académicas para filtrado rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 shrink-0 mr-1">Filtrar por Unidad:</span>
          <button
            type="button"
            onClick={() => setSelectedUnidad('TODAS')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedUnidad === 'TODAS'
                ? 'bg-[#664d88] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({monografias.length})
          </button>
          {unidadesList.map((u) => {
            const count = monografias.filter((m) => (m['Unidad Académica'] || '').trim() === u).length;
            const isSelected = selectedUnidad === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => setSelectedUnidad(u)}
                className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#664d88] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cuadrícula de Columnas con Tarjetas de Monografía */}
      {!isFiltering && monografias.length > 3 && (
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-violet-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-violet-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#664d88] shrink-0" />
            <div>
              <span className="font-bold">Vista de prueba (3 monografías visibles de {monografias.length}):</span> Usa los filtros de Unidad Académica, Año, Grado o la barra de búsqueda para explorar todas las monografías según tu criterio.
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#664d88]/10 text-[#664d88] font-bold shrink-0">
            Filtra para ver más
          </span>
        </div>
      )}

      {filteredMonografias.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No se encontraron monografías</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            No hay documentos que coincidan con los filtros seleccionados o el término de búsqueda ingresado.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedUnidad('TODAS');
              setSelectedAnio('TODOS');
              setSelectedGrado('TODOS');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-[#664d88] text-white text-xs font-bold hover:bg-[#533e6f] transition-colors cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMonografias.map((doc, idx) => {
            const docId = doc.documento_id || `doc_${idx}`;
            const isExpanded = Boolean(expandedAbstracts[docId]);
            const unidad = doc['Unidad Académica'] || doc['unidad_academica'] || 'General';
            const anio = doc['año'] || doc['ano'] || doc['anio'] || '2026';
            const autor = doc.autor || 'Estudiante Ekirayá';
            const asesor = doc['Asesor(es)'] || doc['asesor'] || 'Por asignar';
            const linea = doc['Linea de investigación'] || '';
            const palabrasClave = (doc.palabras_clave || '')
              .split(/[,;\n]/)
              .map((p) => p.trim())
              .filter(Boolean);

            const hasPdf = Boolean(doc.url_documento || doc.drive_file_id);

            return (
              <div
                key={docId}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#664d88]/40"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-[#664d88] font-black text-[11px] uppercase tracking-wide border border-violet-100">
                      {unidad}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{anio}</span>
                    </span>
                  </div>

                  {/* Título de la Monografía */}
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug mb-3 group-hover:text-[#664d88] transition-colors line-clamp-3">
                    {doc.titulo || 'Monografía Sin Título'}
                  </h3>

                  {/* Metadatos: Autor y Asesor */}
                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-violet-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block leading-none">
                          Estudiante
                        </span>
                        <span className="font-bold text-slate-800">{autor}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <GraduationCap className="w-4 h-4 text-[#eab308] shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block leading-none">
                          Asesor(a)
                        </span>
                        <span className="font-medium text-slate-700">{asesor}</span>
                      </div>
                    </div>

                    {linea && (
                      <div className="flex items-start gap-2 text-slate-600 pt-1">
                        <FolderTree className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-600 italic line-clamp-1">{linea}</span>
                      </div>
                    )}
                  </div>

                  {/* Resumen con Leer más / Leer menos */}
                  {doc.resumen && (
                    <div className="mt-3">
                      <p
                        className={`text-xs text-slate-600 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-3'
                        }`}
                      >
                        {doc.resumen}
                      </p>
                      {doc.resumen.length > 120 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAbstracts((prev) => ({
                              ...prev,
                              [docId]: !prev[docId],
                            }))
                          }
                          className="text-[11px] font-bold text-[#664d88] hover:underline mt-1 block cursor-pointer"
                        >
                          {isExpanded ? 'Leer menos' : 'Leer resumen completo'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Palabras Clave */}
                  {palabrasClave.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      {palabrasClave.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          #{kw}
                        </span>
                      ))}
                      {palabrasClave.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">
                          +{palabrasClave.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pie de la Tarjeta con Botones de Acción */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista Previa</span>
                  </button>

                  {doc.url_documento && (
                    <a
                      href={doc.url_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                      title="Abrir directamente en Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Previsualización de Documento PDF */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Cabecera del Visor */}
            <div className="bg-[#664d88] text-white px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-[#f8c62e] text-slate-950 text-[10px] font-black uppercase">
                    {previewDoc['Unidad Académica'] || 'Monografía'}
                  </span>
                  <span className="text-xs text-violet-200">{previewDoc['año'] || '2026'}</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base truncate">{previewDoc.titulo}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewDoc.url_documento && (
                  <a
                    href={previewDoc.url_documento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abrir en Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor del IFrame de Previsualización de Drive */}
            <div className="flex-1 bg-slate-100 relative">
              {previewDoc.drive_file_id ? (
                <iframe
                  src={`https://drive.google.com/file/d/${previewDoc.drive_file_id}/preview`}
                  title={previewDoc.titulo}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              ) : previewDoc.url_documento ? (
                <iframe
                  src={previewDoc.url_documento.replace(/\/view.*$/, '/preview')}
                  title={previewDoc.titulo}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                  <h4 className="font-bold text-slate-800 text-base mb-1">
                    Enlace de visualización no disponible
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    El documento aún no cuenta con un ID de archivo de Google Drive asociado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Gestión de Usuarios (Hoja Usuarios) */}
      {isUserManagementOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#664d88] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Gestión de Usuarios Institucionales</h3>
                  <p className="text-[11px] text-violet-200">
                    Sincronizado con la hoja <code>Usuarios</code> en Google Sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserManagementOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Formulario para Agregar Usuario */}
              <form onSubmit={handleAddUser} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#664d88]" />
                  <span>Registrar Nuevo Usuario</span>
                </h4>

                {userActionError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{userActionError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombres</label>
                    <input
                      type="text"
                      value={newUser.Nombres || ''}
                      onChange={(e) => setNewUser({ ...newUser, Nombres: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#664d88]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Correo Institucional</label>
                    <input
                      type="email"
                      value={newUser.Correo || ''}
                      onChange={(e) => setNewUser({ ...newUser, Correo: e.target.value })}
                      placeholder="usuario@cem.edu.co"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#664d88]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Perfil</label>
                    <select
                      value={newUser.Perfil || 'Estudiante'}
                      onChange={(e) =>
                        setNewUser({ ...newUser, Perfil: e.target.value as UserPerfilRole })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#664d88]"
                    >
                      <option value="Estudiante">Estudiante</option>
                      <option value="Docente">Docente</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Curso</label>
                    <input
                      type="text"
                      value={newUser.Curso || '11'}
                      onChange={(e) => setNewUser({ ...newUser, Curso: e.target.value })}
                      placeholder="11"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#664d88]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Guardar Usuario
                    </button>
                  </div>
                </div>
              </form>

              {/* Lista de Usuarios Registrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Usuarios Registrados ({usuarios.length})
                  </h4>
                  <span className="text-xs text-slate-500">
                    Solo usuarios con @cem.edu.co o @est.cem.edu.co
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-3">Nombres</th>
                          <th className="p-3">Correo</th>
                          <th className="p-3">Perfil</th>
                          <th className="p-3">Curso</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usuarios.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">{u.Nombres || '—'}</td>
                            <td className="p-3 font-mono text-slate-600">{u.Correo}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                  u.Perfil === 'Administrador'
                                    ? 'bg-amber-100 text-amber-900'
                                    : u.Perfil === 'Docente'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {u.Perfil || 'Estudiante'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{u.Curso || '11'}</td>
                            <td className="p-3 text-right">
                              {u.Correo?.toLowerCase() !== 'mebolanos@cem.edu.co' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.Correo)}
                                  className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal con el Código Completo de Google Apps Script (Code.gs) */}
      {isGasCodeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#664d88] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Google Apps Script · Backend Repositorio PV (Code.gs)
                  </h3>
                  <p className="text-[11px] text-violet-200">
                    Instrucciones de despliegue en Google Sheets &amp; Drive
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGasCodeModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Instrucciones de Configuración Paso a Paso */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-black text-sm text-amber-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Pasos para implementar en tu Google Sheet:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-800">
                  <li>
                    Abre el Google Sheet de Metadata (ID: <code>1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow</code>).
                  </li>
                  <li>
                    Ve al menú <strong>Extensiones &rarr; Apps Script</strong>.
                  </li>
                  <li>
                    Reemplaza todo el contenido del archivo <code>Código.gs</code> con el código a continuación y guarda los cambios.
                  </li>
                  <li>
                    Haz clic en <strong>Implementar &rarr; Nueva implementación</strong>.
                  </li>
                  <li>
                    Selecciona el tipo <strong>Aplicación web</strong>, ejecuta como <strong>Tú</strong> y en acceso selecciona <strong>Cualquiera</strong>.
                  </li>
                  <li>
                    Copia la URL de la Web App generada e ingrésala en la sección de sincronización de la app.
                  </li>
                </ol>
              </div>

              {/* Botón de Copiar y Vista del Código */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-mono">Code.gs (Listo para producción)</span>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="px-3 py-1.5 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedGasCode ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>¡Código Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código Completo</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono max-h-96 overflow-y-auto shadow-inner">
                  <pre className="whitespace-pre-wrap">{GOOGLE_APPS_SCRIPT_CODE}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Conexión en Vivo con Google Apps Script */}
      {isGasUrlModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#664d88] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Conectar Servidor de Google (Google Apps Script)
                  </h3>
                  <p className="text-[11px] text-violet-200">
                    Sincronización en vivo entre citationeki.vercel.app, Google Drive y Sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGasUrlModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Para sincronizar en vivo desde la web desplegada en Vercel con tu Google Sheet y Google Drive,
                  la app se comunica directamente con la <strong>Web App de Google Apps Script</strong>.
                </p>
                <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100 text-[11px] text-[#664d88]">
                  <strong>ID de tu Google Sheet:</strong>{' '}
                  <code className="font-mono font-bold">1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow</code>
                </div>
              </div>

              {/* Campo para la URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de la Web App de Apps Script (/exec)
                </label>
                <input
                  type="url"
                  value={tempGasUrl}
                  onChange={(e) => {
                    setTempGasUrl(e.target.value);
                    setTestConnectionStatus('idle');
                    setTestConnectionMessage('');
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Obtenida en Google Sheets &rarr; Extensiones &rarr; Apps Script &rarr; Implementar &rarr; Nueva implementación (Tipo: Aplicación web, Acceso: Cualquiera).
                </p>
              </div>

              {/* Resultado de Prueba de Conexión */}
              {testConnectionStatus !== 'idle' && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                    testConnectionStatus === 'testing'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : testConnectionStatus === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {testConnectionStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
                  {testConnectionStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {testConnectionStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  <span className="leading-tight">{testConnectionMessage}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestGasConnection}
                  disabled={testConnectionStatus === 'testing' || !tempGasUrl}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Probar Conexión con Google
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndSyncGasUrl}
                  disabled={!tempGasUrl}
                  className="px-4 py-2 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Guardar y Sincronizar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Importación Directa / Pegar Datos de Google Sheets */}
      {isImportCsvModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#664d88] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Importar / Pegar Filas de Google Sheets
                  </h3>
                  <p className="text-[11px] text-violet-200">
                    Copia las celdas de la hoja «Repositorio» y pégalas aquí para actualizar en 2 segundos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportCsvModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Instrucciones rápidas:</strong> En tu hoja de cálculo, selecciona las filas que deseas actualizar (o toda la hoja con <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-300 font-mono text-[10px]">Ctrl+A</kbd>), copia (<kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-300 font-mono text-[10px]">Ctrl+C</kbd>) y pega aquí abajo.
              </div>

              <div>
                <textarea
                  rows={8}
                  value={csvPasteText}
                  onChange={(e) => setCsvPasteText(e.target.value)}
                  placeholder="Pega aquí los datos copiados de Google Sheets (formato tabular o CSV)..."
                  className="w-full p-3 text-xs font-mono rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {csvPasteText ? `${csvPasteText.split('\n').filter(Boolean).length} líneas detectadas` : 'Esperando datos'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvPasteText('');
                      setIsImportCsvModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportPastedData}
                    disabled={!csvPasteText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Actualizar Repositorio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
