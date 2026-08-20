import { test, expect } from './support/fixtures';

/**
 * Módulo Ventas (`/ventas`), de solo lectura.
 *
 * Regla de negocio RN-01: toda venta proviene de un presupuesto aceptado. La
 * pantalla no debe permitir crear ventas a mano. Los cálculos de cobranza se
 * derivan de los ingresos, no se editan aquí.
 */
test.describe('CU-VE — Ventas', () => {
  test('CU-VE-01 · el listado muestra las ventas con id PR-XXXX', { tag: '@smoke' }, async ({ ingresarComo, ventas }) => {
    await ingresarComo('ADMIN');
    await ventas.abrir();

    const ids = await ventas.ids();
    expect(ids.length, 'debe haber al menos una venta').toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toMatch(/PR\s*-\s*\d{4}/);
    }
  });

  test('CU-VE-13 · no se puede crear una venta manualmente', { tag: '@regression' }, async ({ ingresarComo, ventas }) => {
    await ingresarComo('ADMIN');
    await ventas.abrir();

    expect(
      await ventas.tieneAltaDeVenta(),
      'las ventas deben nacer de un presupuesto aceptado, no crearse a mano (RN-01)',
    ).toBe(false);
  });

  test('el detalle de una venta abre sin exponer edición de cobranzas', { tag: '@regression' }, async ({ ingresarComo, ventas }) => {
    await ingresarComo('ADMIN');
    await ventas.abrir();

    const solapas = await ventas.abrirPrimerDetalle();
    // El detalle se organiza en solapas Condiciones / Ingresos / Egresos /
    // Variac. / Aprend. (antes la primera se llamaba "Datos").
    expect(solapas.some((t) => /condiciones/i.test(t))).toBe(true);
    expect(await ventas.rutaActual()).toMatch(/\/ventas\//);
  });

  test('el perfil de carga también ve el listado de ventas', { tag: '@regression' }, async ({ ingresarComo, ventas }) => {
    await ingresarComo('CARGA');
    await ventas.abrir();
    expect(await ventas.cantidad()).toBeGreaterThan(0);
  });
});
