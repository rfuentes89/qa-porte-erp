import { test, expect, MARCA_QA } from './support/fixtures';
import { credenciales } from './support/perfiles';
import { capturarSesionSupabase, anularGastosFijosDePrueba, type SesionSupabase } from './support/supabase';

/**
 * Módulo Gastos fijos (`/gastos-fijos`).
 *
 * A diferencia del resto de los módulos transaccionales, este funciona bien:
 * el alta persiste con los campos obligatorios, el concepto es obligatorio, y
 * la pantalla ofrece "Editar" y "Eliminar". No se hallaron defectos.
 *
 * El alta requiere concepto, fecha y categoría; si falta alguno, no persiste.
 * La limpieza se hace por API en afterAll (marcar inactivo), porque el borrado
 * por interfaz es difícil de automatizar de forma estable en esta pantalla.
 */
test.describe('CU-GF — Gastos fijos', () => {
  // El modal de alta es alto: ventana más grande para que "Guardar" entre.
  test.use({ viewport: { width: 1440, height: 1400 } });

  let admin: SesionSupabase;

  test.beforeAll(async ({ browser }) => {
    admin = await capturarSesionSupabase(browser, credenciales('ADMIN'));
  });

  test.afterAll(async () => {
    const anulados = await anularGastosFijosDePrueba(admin);
    if (anulados > 0) console.log(`Limpieza: ${anulados} gasto(s) fijo(s) de prueba neutralizado(s).`);
  });

  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-GF-01 · alta de un gasto fijo con los datos obligatorios', async ({ gastosFijos }) => {
    const concepto = `${MARCA_QA}-GF-OK`;
    await gastosFijos.abrir();
    const guardo = await gastosFijos.crear({
      concepto,
      fecha: '2026-08-08',
      categoria: 'Servicios',
      montoPrevisto: 120_000,
    });
    expect(guardo, 'el alta debe cerrarse tras guardar un gasto válido').toBe(true);

    await gastosFijos.abrir();
    expect(await gastosFijos.existe(concepto), 'el gasto debe aparecer en el listado').toBe(true);
  });

  test('CU-GF-01 · el concepto es obligatorio', async ({ gastosFijos }) => {
    await gastosFijos.abrir();
    await gastosFijos.abrirAlta();
    // Con categoría pero sin concepto: no debe guardarse.
    await gastosFijos.completarModal({ categoria: 'Servicios', montoPrevisto: 50_000 });
    const cerro = await gastosFijos.guardar();

    expect(cerro, 'no debería guardarse un gasto fijo sin concepto').toBe(false);
  });
});
