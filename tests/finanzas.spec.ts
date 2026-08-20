import { test, expect } from './support/fixtures';

/**
 * Módulo Finanzas (`/finanzas`), incorporado el 2026-08-19.
 *
 * Cubre las dos pantallas que el diseño marcaba como centrales y no existían:
 * Caja y bancos (pestaña "Caja") y Flujo de fondos (pestaña "Proyección",
 * máxima prioridad del roadmap). Es una pantalla de solo lectura.
 *
 * Ver reportes/2026-08-15-reverificacion-finanzas.md.
 */
test.describe('CU-FI — Finanzas', () => {
  test('CU-FI-01 · la pestaña Caja muestra las cuentas y los indicadores', { tag: '@smoke' }, async ({
    ingresarComo, finanzas,
  }) => {
    await ingresarComo('ADMIN');
    await finanzas.abrir();
    await finanzas.abrirCaja();

    // Indicadores de cabecera del diseño de Caja y bancos.
    expect(await finanzas.tieneTexto('CAJA DISPONIBLE'), 'falta el indicador Caja disponible').toBe(true);
    expect(await finanzas.tieneTexto('DISPONIBLE ESTIMADO'), 'falta el indicador Disponible estimado').toBe(true);

    // Saldo por cada cuenta configurada.
    const cuentas = await finanzas.cuentasVisibles();
    expect(cuentas.length, `se esperaban las 4 cuentas, se vieron: ${cuentas.join(', ')}`).toBe(4);
  });

  test('CU-FI-02 · la pestaña Proyección muestra descalce y saldo mínimo', { tag: '@smoke' }, async ({
    ingresarComo, finanzas,
  }) => {
    await ingresarComo('ADMIN');
    await finanzas.abrir();
    await finanzas.abrirProyeccion();

    // El "punto de quiebre" que pedía el diseño: fecha en que la caja se vuelve negativa.
    const descalce = await finanzas.descalceProyectado();
    expect(descalce, 'debe informarse la fecha de descalce proyectado').toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

    const saldoMin = await finanzas.saldoMinimo();
    expect(saldoMin, 'debe informarse el saldo mínimo proyectado').not.toBeNull();
  });

  test('CU-FI-03 · el perfil de carga accede a la posición financiera [bloqueo-no-protege]', { tag: '@regression' }, async ({
    ingresarComo, finanzas,
  }) => {
    // Hallazgo de seguridad (se agrava con Finanzas): el perfil de carga puede
    // abrir el módulo y ver la caja completa (blanca/negra) y la proyección.
    // Documenta el estado actual; debe pasar a rojo cuando se restrinja el acceso.
    await ingresarComo('CARGA');
    await finanzas.abrir();

    const veCaja = await finanzas.tieneTexto('CAJA DISPONIBLE');
    expect(
      veCaja,
      'bloqueo-no-protege resuelto: el perfil de carga ya no ve la posición de caja. Cerrar el hallazgo.',
    ).toBe(true);
  });
});
