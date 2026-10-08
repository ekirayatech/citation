const fs = require('fs');
const filePath = 'src/components/RepositorioSection.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetState = `  // Estado principal sin dependencias de localStorage
  const [monografias, setMonografias] = useState<MonografiaItem[]>([]);`;

const replacementState = `  // Estado principal con inicialización robusta en localStorage o DEFAULT_REPO_ROWS para garantizar carga en Vercel y todos los dispositivos
  const [monografias, setMonografias] = useState<MonografiaItem[]>(() => {
    try {
      const cached = localStorage.getItem('ekiraya_cached_monografias');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_REPO_ROWS as MonografiaItem[];
  });`;

if (content.includes(targetState)) {
  content = content.replace(targetState, replacementState);
} else {
  console.warn('targetState not found');
}

const targetFetch = `  const fetchMonografias = async () => {
    setIsLoadingMonografias(true);
    let resolvedUrl = (gasWebAppUrl || getCentralGasUrl()).trim();
    if (!resolvedUrl || !resolvedUrl.includes('script.google.com')) {
      try {
        const cfgResp = await fetch('/api/repositorio/config', { cache: 'no-store' });
        if (cfgResp.ok) {
          const cfgData = await cfgResp.json();
          if (cfgData?.appsScriptExecUrl && cfgData.appsScriptExecUrl.includes('script.google.com')) {
            resolvedUrl = cfgData.appsScriptExecUrl.trim();
            setGasWebAppUrl(resolvedUrl);
          }
        }
      } catch {
        // Ignorar
      }
    }
    if (resolvedUrl && resolvedUrl.includes('script.google.com')) {
      try {
        const getMonoUrl = \`\${resolvedUrl}\${resolvedUrl.includes('?') ? '&' : '?'}action=getMonografias&_t=\${Date.now()}\`;
        const monoResp = await fetch(getMonoUrl, {
          method: 'GET',
          cache: 'no-store',
          redirect: 'follow',
        });
        if (monoResp.ok) {
          const result = await monoResp.json();
          if (result?.status === 'success' && Array.isArray(result.data)) {
            setMonografias(result.data);
            setIsLoadingMonografias(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Advertencia consultando Google Apps Script directamente:', err);
      }
    }
    // Fallback técnico si Apps Script no está disponible
    try {
      const activeGasUrl = (gasWebAppUrl || getCentralGasUrl()).trim();
      const resp = await fetch(\`/api/repositorio/monografias?_t=\${Date.now()}&gasWebAppUrl=\${encodeURIComponent(activeGasUrl)}\`, { cache: 'no-store' });
      if (resp.ok) {
        const result = await resp.json();
        if (result?.status === 'success' && Array.isArray(result.data)) {
          setMonografias(result.data);
        }
      }
    } catch {
      // Ignorar
    } finally {
      setIsLoadingMonografias(false);
    }
  };`;

const replacementFetch = `  const fetchMonografias = async () => {
    setIsLoadingMonografias(true);
    let resolvedUrl = (gasWebAppUrl || getCentralGasUrl()).trim();
    if (!resolvedUrl || !resolvedUrl.includes('script.google.com')) {
      try {
        const cfgResp = await fetch('/api/repositorio/config', { cache: 'no-store' });
        if (cfgResp.ok) {
          const cfgData = await cfgResp.json();
          if (cfgData?.appsScriptExecUrl && cfgData.appsScriptExecUrl.includes('script.google.com')) {
            resolvedUrl = cfgData.appsScriptExecUrl.trim();
            setGasWebAppUrl(resolvedUrl);
          }
        }
      } catch {
        // Ignorar
      }
    }
    if (resolvedUrl && resolvedUrl.includes('script.google.com')) {
      try {
        const getMonoUrl = \`\${resolvedUrl}\${resolvedUrl.includes('?') ? '&' : '?'}action=getMonografias&_t=\${Date.now()}\`;
        const monoResp = await fetch(getMonoUrl, {
          method: 'GET',
          cache: 'no-store',
          redirect: 'follow',
        });
        if (monoResp.ok) {
          const result = await monoResp.json();
          if (result?.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
            setMonografias(result.data);
            try {
              localStorage.setItem('ekiraya_cached_monografias', JSON.stringify(result.data));
            } catch {}
            setIsLoadingMonografias(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Advertencia consultando Google Apps Script directamente:', err);
      }
    }
    // Fallback técnico si Apps Script no está disponible o da CORS en estático (Vercel)
    try {
      const activeGasUrl = (gasWebAppUrl || getCentralGasUrl()).trim();
      const resp = await fetch(\`/api/repositorio/monografias?_t=\${Date.now()}&gasWebAppUrl=\${encodeURIComponent(activeGasUrl)}\`, { cache: 'no-store' });
      if (resp.ok) {
        const result = await resp.json();
        if (result?.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          setMonografias(result.data);
          try {
            localStorage.setItem('ekiraya_cached_monografias', JSON.stringify(result.data));
          } catch {}
          setIsLoadingMonografias(false);
          return;
        }
      }
    } catch {
      // Ignorar
    }

    // Último recurso de respaldo si la red falló: mantener caché previa o DEFAULT_REPO_ROWS
    try {
      const cached = localStorage.getItem('ekiraya_cached_monografias');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMonografias(parsed);
          setIsLoadingMonografias(false);
          return;
        }
      }
    } catch {}

    setMonografias((prev) => (prev.length > 0 ? prev : (DEFAULT_REPO_ROWS as MonografiaItem[])));
    setIsLoadingMonografias(false);
  };`;

if (content.includes(targetFetch)) {
  content = content.replace(targetFetch, replacementFetch);
} else {
  console.warn('targetFetch not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated RepositorioSection.tsx');
