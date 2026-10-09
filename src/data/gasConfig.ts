/**
 * =========================================================================
 * CONFIGURACIÓN CENTRALIZADA DE GOOGLE APPS SCRIPT WEB APP
 * =========================================================================
 *
 * Permite que todos los terminales y navegadores (Chrome, Safari, Edge, Vercel)
 * consulten la misma URL central de Google Apps Script para leer Google Sheets.
 *
 * Prioridad de resolución:
 * 1. Variable de entorno pública en Vercel/Vite:
 *    VITE_APPS_SCRIPT_URL o VITE_GAS_WEBAPP_URL
 * 2. Configuración en localStorage ('ekiraya_gas_webapp_url') guardada por el admin
 * 3. Fallback central
 */

export const CENTRAL_APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  (import.meta.env.VITE_GAS_WEBAPP_URL as string) ||
  'https://script.google.com/macros/s/AKfycbyXv5xr3CJ1oQ7o88P34EJH3tm6ltJhXhH7UAtZZHd_0l7Jjvp5m9U9nM1rl1OtXkRD/exec';

/**
 * Obtiene la URL activa y válida de Google Apps Script Web App
 */
export function getCentralGasUrl(): string {
  // 1. Variable de entorno pública de Vercel / Vite
  const envUrl = (
    (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
    (import.meta.env.VITE_GAS_WEBAPP_URL as string) ||
    ''
  ).trim();
  if (envUrl && envUrl.includes('script.google.com')) {
    return envUrl;
  }

  // 2. Configuración guardada en el navegador por el Administrador
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = (window.localStorage.getItem('ekiraya_gas_webapp_url') || '').trim();
      if (stored && stored.includes('script.google.com')) {
        return stored;
      }
    }
  } catch {
    // Ignore error
  }

  // 3. Fallback central
  return CENTRAL_APPS_SCRIPT_URL.trim();
}
