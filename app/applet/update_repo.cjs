const fs = require('fs');
const filePath = 'src/components/RepositorioSection.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `  // Estado principal sin dependencias de localStorage
  const [monografias, setMonografias] = useState<MonografiaItem[]>([]);`;

const replacement1 = `  // Estado principal con inicialización robusta en DEFAULT_REPO_ROWS para garantizar carga inmediata en móviles (iPhone/Mozilla/Safari)
  const [monografias, setMonografias] = useState<MonografiaItem[]>(() => {
    return DEFAULT_REPO_ROWS as MonografiaItem[];
  });`;

const target2 = `    // Fallback técnico si Apps Script no está disponible
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
    }`;

const replacement2 = `    // Fallback técnico si Apps Script no está disponible
    try {
      const activeGasUrl = (gasWebAppUrl || getCentralGasUrl()).trim();
      const resp = await fetch(\`/api/repositorio/monografias?_t=\${Date.now()}&gasWebAppUrl=\${encodeURIComponent(activeGasUrl)}\`, { cache: 'no-store' });
      if (resp.ok) {
        const result = await resp.json();
        if (result?.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          setMonografias(result.data);
        } else if (monografias.length === 0) {
          setMonografias(DEFAULT_REPO_ROWS as MonografiaItem[]);
        }
      } else if (monografias.length === 0) {
        setMonografias(DEFAULT_REPO_ROWS as MonografiaItem[]);
      }
    } catch {
      if (monografias.length === 0) {
        setMonografias(DEFAULT_REPO_ROWS as MonografiaItem[]);
      }
    } finally {
      setIsLoadingMonografias(false);
    }`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log("Replaced target1 successfully.");
} else {
  console.log("Target1 not found!");
}

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log("Replaced target2 successfully.");
} else {
  console.log("Target2 not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File updated successfully.");
