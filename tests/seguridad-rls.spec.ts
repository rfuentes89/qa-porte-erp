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

    // Nota (2026-08-15): la política de LECTURA de profiles se amplió — el perfil
    // de carga ahora ve todas las filas (OBS-18), no solo la propia. Se ubica su
    // fila por el rol data_entry. Lo que importa aquí es la ESCRITURA: que no
    // pueda cambiar su rol (escalada).
    const perfiles = (await (await rest.get('profiles?select=id,role')).json()) as Array<{ id: string; role: string }>;
    const propio = perfiles.find((p) => p.role === 'data_entry');
    expect(propio, 'debe existir la fila del perfil de carga').toBeTruthy();

    // Intento de auto-elevarse a admin.
    await rest.patch(`profiles?id=eq.${propio?.id}`, { role: 'admin' });

    const despues = (await (await rest.get(`profiles?id=eq.${propio?.id}&select=role`)).json()) as Array<{ role: string }>;
    const rolFinal = despues[0]?.role;

    if (rolFinal !== 'data_entry') {
      // Revertir antes de fallar, para no dejar el entorno con el rol elevado.
      await rest.patch(`profiles?id=eq.${propio?.id}`, { role: 'data_entry' });
    }
    expect(rolFinal, 'RLS no debe permitir que el perfil de carga cambie su rol').toBe('data_entry');
  });

  test('CU-RL-20a · el backend exige un cliente existente (FK)', { tag: '@destructive' }, async () => {
    const restCarga = clienteRest(api, carga);

    // El cliente pasó a ser una referencia real: un cliente inexistente se rechaza.
    const res = await restCarga.post('presupuestos', {
      id: 'PR-RLS-FK', cliente: '', descripcion: 'sonda FK - anular',
      estado_comercial: 'Cancelado', fecha: '2026-08-19',
      costo_mat: 1000, costo_mo: 0, ind_vendidos: 0, impuestos: 0, comercial: 0, beneficio: 0,
    });

    // El backend responde CLIENTE_NO_EXISTE (400). Guarda de regresión de la FK.
    expect(res.status(), 'el backend debe rechazar un cliente inexistente').toBe(400);
  });

  test('CU-RL-20b · el backend NO valida el monto (solo lo hace el frontend) [DEF-06]', { tag: '@destructive' }, async () => {
    const restCarga = clienteRest(api, carga);
    const restAdmin = clienteRest(api, admin);
    // Id único por corrida: el borrado físico de presupuestos no está habilitado
    // (la baja es lógica), así que un id fijo dejaría un huérfano y la próxima
    // corrida chocaría con un 409.
    const id = `PR-RLS-MONTO-${Date.now()}`;

    // Se toma un cliente del MAESTRO para aislar la validación de monto de la FK.
    // (No sirve el cliente de un presupuesto viejo: pueden ser textos libres
    // pre-FK que ya no existen en el maestro y dispararían CLIENTE_NO_EXISTE.)
    const maestro = (await (
      await restAdmin.get('clientes?select=nombre&limit=1')
    ).json()) as Array<{ nombre: string }>;
    const clienteReal = maestro[0]?.nombre;
    expect(clienteReal, 'debe existir al menos un cliente en el maestro').toBeTruthy();

    // Con cliente válido, la UI bloquea un costo negativo; el backend no.
    const res = await restCarga.post('presupuestos', {
      id, cliente: clienteReal, descripcion: 'sonda monto negativo - anular',
      estado_comercial: 'Cancelado', fecha: '2026-08-19',
      costo_mat: -99999, costo_mo: 0, ind_vendidos: 0, impuestos: 0, comercial: 0, beneficio: 0,
    });
    const aceptado = res.status() === 201;

    // Limpieza: baja lógica (el DELETE físico no está habilitado por RLS).
    if (aceptado) {
      await restAdmin.patch(
        `presupuestos?id=eq.${id}`,
        { activo: false, estado_comercial: 'Cancelado', costo_mat: 0, descripcion: 'QA-ANULADO sonda RLS' },
        'return=minimal',
      );
    }

    // HALLAZGO (corrige la conclusión previa): el backend acepta un costo
    // negativo con cliente válido. La validación de monto vive SOLO en el
    // frontend (DEF-06 sigue abierto a nivel de datos). Este test documenta el
    // estado actual; debe pasar a rojo (aceptado === false) cuando el backend
    // agregue el CHECK de monto, momento de cerrar DEF-06.
    expect(
      aceptado,
      'hoy el backend ACEPTA un costo negativo con cliente válido; si empieza a rechazarlo, cerrar DEF-06 y actualizar este test',
    ).toBe(true);
  });
});
