import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { credenciales } from './support/perfiles';
import { capturarSesionSupabase, type SesionSupabase } from './support/supabase';

/**
 * Pruebas de seguridad a nivel de datos (CU-RL-20 / CU-RL-21).
 *
 * PORTE consulta Supabase (PostgREST) directamente desde el navegador, así que
 * la única frontera de permisos son las políticas de Row Level Security. Estos
 * tests atacan la API REST con el token de cada perfil, SALTÁNDOSE la interfaz,
 * para comprobar qué aplica realmente el backend.
 *
 * Todas las operaciones destructivas son reversibles y limpian lo que crean.
 * Ver reportes/2026-08-07-seguridad-rls.md.
 */

const TABLAS_PRINCIPALES = [
  'presupuestos', 'ventas', 'ingresos', 'egresos', 'proveedores',
  'gastos_fijos', 'variaciones', 'aprendizajes', 'profiles',
] as const;

/** Cliente REST tipado sobre el token de una sesión. */
function clienteRest(peticion: APIRequestContext, sesion: SesionSupabase) {
  const base = `${sesion.supaUrl}/rest/v1`;
  const cabeceras = (prefer: string): Record<string, string> => ({
    apikey: sesion.apikey,
    Authorization: `Bearer ${sesion.token}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  });

  return {
    get: (path: string) =>
      peticion.get(`${base}/${path}`, { headers: cabeceras('return=representation') }),
    post: (path: string, cuerpo: unknown) =>
      peticion.post(`${base}/${path}`, { headers: cabeceras('return=representation'), data: cuerpo }),
    patch: (path: string, cuerpo: unknown, prefer = 'return=representation') =>
      peticion.patch(`${base}/${path}`, { headers: cabeceras(prefer), data: cuerpo }),
  };
}

test.describe('CU-RL-20/21 — Row Level Security de Supabase', () => {
  let carga: SesionSupabase;
  let admin: SesionSupabase;
  let api: APIRequestContext;

  test.beforeAll(async ({ browser }) => {
    test.slow();
    admin = await capturarSesionSupabase(browser, credenciales('ADMIN'));
    carga = await capturarSesionSupabase(browser, credenciales('CARGA'));
    api = await request.newContext();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('el perfil de carga puede leer las tablas principales por API directa [OBS-14]', { tag: '@destructive' }, async () => {
    const rest = clienteRest(api, carga);
    for (const tabla of TABLAS_PRINCIPALES) {
      const res = await rest.get(`${tabla}?select=*&limit=1`);
      expect(res.status(), `lectura de ${tabla}`).toBe(200);
    }
  });

  test('CU-RL-21 · la escalada de privilegios está bloqueada', { tag: '@destructive' }, async () => {
    const rest = clienteRest(api, carga);

    const perfil = (await (await rest.get('profiles?select=id,role')).json()) as Array<{ id: string; role: string }>;
    expect(perfil, 'el perfil de carga debe ver su propia fila').toHaveLength(1);
    expect(perfil[0]?.role).toBe('data_entry');

    // Intento de auto-elevarse a admin.
    await rest.patch(`profiles?id=eq.${perfil[0]?.id}`, { role: 'admin' });

    const despues = (await (await rest.get(`profiles?id=eq.${perfil[0]?.id}&select=role`)).json()) as Array<{ role: string }>;
    const rolFinal = despues[0]?.role;

    if (rolFinal !== 'data_entry') {
      // Revertir antes de fallar, para no dejar el entorno con el rol elevado.
      await rest.patch(`profiles?id=eq.${perfil[0]?.id}`, { role: 'data_entry' });
    }
    expect(rolFinal, 'RLS no debe permitir que el perfil de carga cambie su rol').toBe('data_entry');
  });

  test('CU-RL-20 · el backend valida los datos, no solo el frontend [DEF-06 corregido]', { tag: '@destructive' }, async () => {
    const restCarga = clienteRest(api, carga);
    const restAdmin = clienteRest(api, admin);
    const id = 'PR-RLS-SPEC';

    // Un presupuesto que la UI rechaza: sin cliente y con costo negativo.
    const invalido = {
      id,
      cliente: '',
      descripcion: 'sonda RLS spec - anular',
      estado_comercial: 'Cancelado',
      fecha: '2026-08-07',
      costo_mat: -99999,
      costo_mo: 0, ind_vendidos: 0, impuestos: 0, comercial: 0, beneficio: 0,
    };

    const res = await restCarga.post('presupuestos', invalido);
    const aceptado = res.status() === 201;

    // Red de seguridad: si el backend aún lo aceptara, se neutraliza con admin.
    if (aceptado) {
      await restAdmin.patch(
        `presupuestos?id=eq.${id}`,
        { activo: false, cliente: 'QA-RLS-ANULADO', descripcion: 'ANULAR - sonda RLS spec' },
        'return=minimal',
      );
    }

    // DEF-06 corregido (actualización 2026-08-11): la validación ya no vive
    // solo en el frontend; el backend rechaza el presupuesto inválido por API.
    // Guarda de regresión: vuelve a rojo si alguien quita esa validación.
    expect(
      aceptado,
      'el backend debe rechazar un presupuesto sin cliente y con costo negativo (DEF-06)',
    ).toBe(false);
  });
});
