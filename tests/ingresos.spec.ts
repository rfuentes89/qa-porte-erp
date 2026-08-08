import { test, expect } from './support/fixtures';
import { credenciales } from './support/perfiles';
import { capturarSesionSupabase, anularIngresosNegativos, type SesionSupabase } from './support/supabase';

/**
 * Módulo Ingresos (`/ingresos/nuevo`).
 *
 * Los ingresos impactan el cobro de una venta real y el saldo de caja, y no se
 * pueden editar ni eliminar desde la interfaz. Por eso:
 *  - los casos negativos que la app rechaza no persisten nada;
 *  - el caso que sí persiste (DEF-07) se limpia por API en afterAll.
 */
test.describe('CU-IN — Ingresos', () => {
  let admin: SesionSupabase;

  test.beforeAll(async ({ browser }) => {
    admin = await capturarSesionSupabase(browser, credenciales('ADMIN'));
  });

  test.afterAll(async () => {
    // Red de seguridad: neutraliza cualquier ingreso negativo que dejen los tests.
    const anulados = await anularIngresosNegativos(admin);
    if (anulados > 0) console.log(`Limpieza: ${anulados} ingreso(s) negativo(s) neutralizado(s).`);
  });

  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-IN-05/06 · rechaza un ingreso sin venta y con monto 0', async ({ formIngreso }) => {
    await formIngreso.abrirNuevo();
    await formIngreso.completarMonto(0);
    const res = await formIngreso.guardarIngreso();

    expect(res.guardo, 'no debe guardarse un ingreso sin obra y con monto 0').toBe(false);
  });

  test('CU-IN-06 · rechaza un ingreso con monto negativo [DEF-07]', async ({ formIngreso }) => {
    await formIngreso.abrirNuevo();
    await formIngreso.seleccionarPrimeraVenta();
    await formIngreso.elegirTipo('ANTICIPO');
    await formIngreso.completarConcepto('QA-TEST ingreso negativo');
    await formIngreso.completarMonto(-500);
    const res = await formIngreso.guardarIngreso();

    // DEF-07: hoy el ingreso negativo se guarda. El test documenta el defecto;
    // el afterAll limpia el registro. Volverá a verde cuando se valide el monto.
    expect(res.guardo, 'no debe aceptarse un ingreso de monto negativo').toBe(false);
  });
});
