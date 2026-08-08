import type { Browser } from '@playwright/test';
import type { Credenciales } from './perfiles';
import { BASE_URL } from '../../playwright.config';

/**
 * Datos necesarios para hablar con la API REST de Supabase sin pasar por la UI.
 *
 * PORTE consulta Supabase directamente desde el navegador, así que estos
 * valores se obtienen iniciando sesión y observando el tráfico y el
 * localStorage: no hay servidor propio del que leerlos.
 */
export interface SesionSupabase {
  /** URL del proyecto, p. ej. https://<proyecto>.supabase.co */
  supaUrl: string;
  /** Clave publicable (`sb_publishable…`), enviada en la cabecera `apikey`. */
  apikey: string;
  /** JWT del usuario autenticado. */
  token: string;
}

/**
 * Inicia sesión con las credenciales dadas y devuelve la configuración de
 * Supabase y el token de la sesión. Usa un contexto aislado que se cierra al
 * terminar.
 */
export async function capturarSesionSupabase(
  browser: Browser,
  cred: Credenciales,
): Promise<SesionSupabase> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let supaUrl: string | null = null;
  let apikey: string | null = null;

  page.on('request', (req) => {
    if (req.url().includes('supabase.co/rest/')) {
      supaUrl ??= req.url().match(/https:\/\/[^/]+\.supabase\.co/)?.[0] ?? null;
      apikey ??= req.headers()['apikey'] ?? null;
    }
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.locator('input[type=email]').first().fill(cred.usuario);
  await page.locator('input[type=password]').first().fill(cred.clave);
  await page.locator('button[type=submit]').first().click();
  await page.waitForTimeout(6_000);
  // Forzar al menos una consulta REST para capturar url + apikey.
  await page.goto(`${BASE_URL}/proveedores`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1_500);

  const token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.includes('auth-token')) {
        try {
          return (JSON.parse(localStorage.getItem(clave) ?? '{}') as { access_token?: string }).access_token ?? null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  await ctx.close();

  if (!supaUrl || !apikey || !token) {
    throw new Error(`No se pudo capturar la sesión de Supabase para ${cred.rol} `
      + `(supaUrl=${!!supaUrl} apikey=${!!apikey} token=${!!token})`);
  }
  return { supaUrl, apikey, token };
}
