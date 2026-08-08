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

/**
 * Neutraliza por API los movimientos con monto negativo de una tabla
 * (`ingresos` o `egresos`): baja lógica con `activo=false` y `monto=0`.
 *
 * Ni ingresos ni egresos tienen borrado físico o acción de eliminar en la
 * interfaz, así que los tests que ejercitan DEF-07/DEF-08 (movimiento negativo
 * aceptado) usan esto para no dejar registros que corrompan una venta o la caja.
 *
 * Devuelve la cantidad de registros neutralizados.
 */
export async function anularMovimientosNegativos(
  sesion: SesionSupabase,
  tabla: 'ingresos' | 'egresos',
): Promise<number> {
  const cabeceras = {
    apikey: sesion.apikey,
    Authorization: `Bearer ${sesion.token}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${sesion.supaUrl}/rest/v1/${tabla}?monto=lt.0&select=ref`, { headers: cabeceras });
  const negativos = (await res.json()) as Array<{ ref: string }>;

  for (const { ref } of negativos) {
    await fetch(`${sesion.supaUrl}/rest/v1/${tabla}?ref=eq.${ref}`, {
      method: 'PATCH',
      headers: { ...cabeceras, Prefer: 'return=minimal' },
      body: JSON.stringify({ activo: false, monto: 0 }),
    });
  }
  return negativos.length;
}

/**
 * Neutraliza los egresos de prueba que la app acepta pese a ser inválidos
 * (DEF-08): monto negativo, o monto 0 sin obra ni proveedor (huérfano, contra
 * RN-04). Un egreso legítimo siempre tiene un proveedor o una obra y un monto
 * distinto de cero, así que el filtro no toca datos reales.
 *
 * Devuelve la cantidad de registros neutralizados.
 */
export async function anularEgresosInvalidos(sesion: SesionSupabase): Promise<number> {
  const cabeceras = {
    apikey: sesion.apikey,
    Authorization: `Bearer ${sesion.token}`,
    'Content-Type': 'application/json',
  };
  const consultas = [
    'egresos?monto=lt.0&activo=eq.true&select=ref',
    'egresos?monto=eq.0&id_obra=is.null&proveedor_id=is.null&activo=eq.true&select=ref',
  ];

  const refs = new Set<string>();
  for (const q of consultas) {
    const filas = (await (await fetch(`${sesion.supaUrl}/rest/v1/${q}`, { headers: cabeceras })).json()) as Array<{ ref: string }>;
    filas.forEach((f) => refs.add(f.ref));
  }

  for (const ref of refs) {
    await fetch(`${sesion.supaUrl}/rest/v1/egresos?ref=eq.${ref}`, {
      method: 'PATCH',
      headers: { ...cabeceras, Prefer: 'return=minimal' },
      body: JSON.stringify({ activo: false, monto: 0 }),
    });
  }
  return refs.size;
}
