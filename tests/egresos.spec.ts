import { test, expect } from './support/fixtures';
import { credenciales } from './support/perfiles';
import { capturarSesionSupabase, anularEgresosInvalidos, type SesionSupabase } from './support/supabase';

/**
 * Módulo Egresos (`/egresos/nuevo`).
 *
 * Un egreso registra dinero pagado y descuenta la caja. Como los ingresos, no
 * se puede editar ni eliminar desde la interfaz, así que:
 *  - los casos que la app rechaza no persisten nada;
 *  - el caso que sí persiste (DEF-08) se limpia por API en afterAll.
 */
test.describe('CU-EG — Egresos', () => {
  let admin: SesionSupabase;

  test.beforeAll(async ({ browser }) => {
    admin = await capturarSesionSupabase(browser, credenciales('ADMIN'));
  });

  test.afterAll(async () => {
    const anulados = await anularEgresosInvalidos(admin);
    if (anulados > 0) console.log(`Limpieza: ${anulados} egreso(s) inválido(s) neutralizado(s).`);
  });

  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-EG-04 · rechaza un egreso sin obra ni proveedor y con monto 0 [DEF-08]', { tag: '@destructive' }, async ({ formEgreso }) => {
    await formEgreso.abrirNuevo();
    await formEgreso.completarMonto(0);
    const res = await formEgreso.guardarEgreso();

    // DEF-08: el egreso se guarda vacío, sin obra ni proveedor (viola RN-04) y
    // con monto 0. El afterAll neutraliza el registro huérfano.
    expect(res.guardo, 'no debe guardarse un egreso sin obra ni proveedor (RN-04)').toBe(false);
  });

  test('CU-EG-11 · rechaza un egreso con monto negativo [DEF-08]', { tag: '@destructive' }, async ({ formEgreso }) => {
    await formEgreso.abrirNuevo();
    await formEgreso.seleccionarPrimerProveedor();
    await formEgreso.elegirTipo('MATERIALES');
    await formEgreso.completarMonto(-300);
    const res = await formEgreso.guardarEgreso();

    // DEF-08: hoy el egreso negativo se guarda. El test lo documenta; el
    // afterAll limpia el registro. Volverá a verde cuando se valide el monto.
    expect(res.guardo, 'no debe aceptarse un egreso de monto negativo').toBe(false);
  });

  test('CU-EG-07 · al marcar "Es un cheque" aparece la fecha de acreditación', { tag: '@destructive' }, async ({ formEgreso }) => {
    await formEgreso.abrirNuevo();
    const fechasCheque = await formEgreso.marcarCheque();

    // Base: solo la fecha del egreso. Con cheque: emisión + acreditación.
    expect(fechasCheque, 'el cheque diferido debe exponer fechas de emisión y acreditación')
      .toBeGreaterThanOrEqual(2);
  });
});
