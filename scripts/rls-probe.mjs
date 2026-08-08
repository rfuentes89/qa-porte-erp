/**
 * Sonda de seguridad a nivel de datos (CU-RL-20 / CU-RL-21).
 *
 * PORTE es una SPA que consulta Supabase (PostgREST) directamente desde el
 * navegador. La única frontera de permisos a nivel de datos son las políticas
 * de Row Level Security. Este script inicia sesión con cada perfil, obtiene su
 * token y ataca la API REST SALTÁNDOSE la interfaz, para comprobar qué aplica
 * realmente el backend.
 *
 * Pruebas (todas reversibles; limpian lo que crean):
 *   1. Lectura directa de cada tabla con el token de carga.
 *   2. Escalada de privilegios: carga intenta ponerse role=admin en profiles.
 *   3. Bypass de validación: carga inserta un presupuesto que la UI rechaza.
 *
 * Uso:  node scripts/rls-probe.mjs
 * Requiere las variables de .env (PORTE_ADMIN_USER/PASS, PORTE_CARGA_USER/PASS).
 */
import { chromium } from 'playwright';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE = process.env.PORTE_BASE_URL ?? 'https://porte-mvp.vercel.app';

const PERFILES = [
  { rol: 'ADMIN', user: process.env.PORTE_ADMIN_USER, pass: process.env.PORTE_ADMIN_PASS },
  { rol: 'CARGA', user: process.env.PORTE_CARGA_USER, pass: process.env.PORTE_CARGA_PASS },
];

const TABLAS = ['presupuestos', 'ventas', 'ingresos', 'egresos', 'proveedores',
  'gastos_fijos', 'variaciones', 'aprendizajes', 'profiles'];

/** Inicia sesión y devuelve { supaUrl, apikey, token } leídos del tráfico y del localStorage. */
async function credencialesSupabase(browser, user, pass) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let supaUrl = null;
  let apikey = null;

  page.on('request', (r) => {
    if (r.url().includes('supabase.co/rest/')) {
      supaUrl ??= r.url().match(/https:\/\/[^/]+\.supabase\.co/)?.[0] ?? null;
      apikey ??= r.headers()['apikey'] ?? null;
    }
  });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('input[type=email]').first().fill(user);
  await page.locator('input[type=password]').first().fill(pass);
  await page.locator('button[type=submit]').first().click();
  await page.waitForTimeout(6000);
  await page.goto(`${BASE}/proveedores`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);

  const token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.includes('auth-token')) {
        try { return JSON.parse(localStorage.getItem(k)).access_token; } catch { /* */ }
      }
    }
    return null;
  });

  await ctx.close();
  return { supaUrl, apikey, token };
}

function crearCliente(supaUrl, apikey, token) {
  return async (metodo, path, cuerpo, prefer = 'return=representation') => {
    const res = await fetch(`${supaUrl}/rest/v1/${path}`, {
      method: metodo,
      headers: {
        apikey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    let texto = '';
    try { texto = await res.text(); } catch { /* sin cuerpo */ }
    return { status: res.status, cuerpo: texto };
  };
}

async function main() {
  const faltan = PERFILES.filter((p) => !p.user || !p.pass).map((p) => p.rol);
  if (faltan.length) {
    console.error(`Faltan credenciales para: ${faltan.join(', ')}. Ver .env.example`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const admin = await credencialesSupabase(browser, PERFILES[0].user, PERFILES[0].pass);
  const carga = await credencialesSupabase(browser, PERFILES[1].user, PERFILES[1].pass);
  await browser.close();

  console.log(`Backend: ${admin.supaUrl}`);
  console.log(`apikey (pública): ${(admin.apikey ?? '').slice(0, 14)}...`);

  const apiCarga = crearCliente(admin.supaUrl, admin.apikey, carga.token);
  const apiAdmin = crearCliente(admin.supaUrl, admin.apikey, admin.token);

  // 1. Lectura directa con el token de carga
  console.log('\n[1] Lectura directa de tablas con el token de CARGA:');
  for (const t of TABLAS) {
    const r = await apiCarga('GET', `${t}?select=*&limit=1`);
    console.log(`    ${r.status === 200 ? 'LEE ' : 'BLOQ'} ${r.status}  ${t}`);
  }

  // 2. Escalada de privilegios
  console.log('\n[2] Escalada de privilegios (CARGA intenta role=admin):');
  const perfil = JSON.parse((await apiCarga('GET', 'profiles?select=id,role')).cuerpo || '[]')[0];
  if (perfil) {
    await apiCarga('PATCH', `profiles?id=eq.${perfil.id}`, { role: 'admin' });
    const despues = JSON.parse((await apiCarga('GET', `profiles?id=eq.${perfil.id}&select=role`)).cuerpo || '[]')[0];
    const bloqueada = despues?.role === 'data_entry';
    console.log(`    rol tras el intento: ${despues?.role}  -> escalada ${bloqueada ? 'BLOQUEADA (ok)' : 'LOGRADA (!!)'}`);
    if (!bloqueada) await apiCarga('PATCH', `profiles?id=eq.${perfil.id}`, { role: 'data_entry' });
  }

  // 3. Bypass de validación de negocio
  console.log('\n[3] Bypass de validación (CARGA inserta un presupuesto inválido):');
  const invalido = {
    id: 'PR-RLS-PROBE', cliente: '', descripcion: 'sonda RLS - anular',
    estado_comercial: 'Cancelado', fecha: new Date().toISOString().slice(0, 10),
    costo_mat: -99999, costo_mo: 0, ind_vendidos: 0, impuestos: 0, comercial: 0, beneficio: 0,
  };
  const post = await apiCarga('POST', 'presupuestos', invalido);
  console.log(`    POST cliente="" costo_mat=-99999 -> ${post.status}` +
    (post.status < 300 ? '  ACEPTADO POR EL BACKEND (!!)' : '  rechazado'));

  // Limpieza: baja lógica (no hay DELETE por RLS ni siquiera para admin)
  if (post.status < 300) {
    await apiAdmin('PATCH', 'presupuestos?id=eq.PR-RLS-PROBE',
      { activo: false, cliente: 'QA-RLS-ANULADO', descripcion: 'ANULAR - sonda RLS' }, 'return=minimal');
    console.log('    limpieza: registro marcado inactivo con el token de ADMIN');
  }

  console.log('\nListo. Ver reportes/2026-08-07-seguridad-rls.md para el análisis.');
}

main().catch((e) => { console.error(e); process.exit(1); });
