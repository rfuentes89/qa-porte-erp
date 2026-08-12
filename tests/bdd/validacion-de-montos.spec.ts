import { test, expect } from '../support/fixtures';
import { credenciales } from '../support/perfiles';
import {
  capturarSesionSupabase,
  anularMovimientosNegativos,
  anularEgresosInvalidos,
  type SesionSupabase,
} from '../support/supabase';

/**
 * Implementación BDD de features/validacion-de-montos.feature
 *
 * Cada escenario del archivo .feature se refleja aquí con `test.step()` usando
 * el mismo lenguaje Dado / Cuando / Entonces. Es la variante "BDD liviana":
 * los escenarios son legibles y trazables al negocio, pero SIN la capa extra de
 * Cucumber, porque para una suite de este tamaño no se paga su mantenimiento.
 *
 * Estos escenarios FALLAN a propósito: documentan DEF-07 y DEF-08. Volverán a
 * verde cuando el sistema valide los montos. Los movimientos que lleguen a
 * persistir se neutralizan por API en afterAll.
 */
test.describe('Característica: Validación de montos en los movimientos de dinero', () => {
  let admin: SesionSupabase;

  test.beforeAll(async ({ browser }) => {
    admin = await capturarSesionSupabase(browser, credenciales('ADMIN'));
  });

  test.afterAll(async () => {
    await anularMovimientosNegativos(admin, 'ingresos');
    await anularEgresosInvalidos(admin);
  });

  // Antecedentes: Dado que ingresé como administrador
  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('Escenario: No se puede registrar un cobro con monto negativo', { tag: '@destructive' }, async ({ formIngreso }) => {
    await test.step('Dado que estoy registrando un cobro sobre una venta existente', async () => {
      await formIngreso.abrirNuevo();
      await formIngreso.seleccionarPrimeraVenta();
      await formIngreso.elegirTipo('ANTICIPO');
      await formIngreso.completarConcepto('BDD cobro negativo');
    });

    let rechazado = false;

    await test.step('Cuando cargo un monto de -500 y guardo el cobro', async () => {
      await formIngreso.completarMonto(-500);
      const resultado = await formIngreso.guardarIngreso();
      rechazado = !resultado.guardo;
    });

    await test.step('Entonces el sistema debe rechazarlo', () => {
      expect(rechazado, 'el cobro negativo no debería registrarse').toBe(true);
    });
  });

  test('Escenario: No se puede registrar un pago con monto negativo', { tag: '@destructive' }, async ({ formEgreso }) => {
    await test.step('Dado que estoy registrando un pago a un proveedor existente', async () => {
      await formEgreso.abrirNuevo();
      await formEgreso.seleccionarPrimerProveedor();
      await formEgreso.elegirTipo('MATERIALES');
    });

    let rechazado = false;

    await test.step('Cuando cargo un monto de -300 y guardo el pago', async () => {
      await formEgreso.completarMonto(-300);
      const resultado = await formEgreso.guardarEgreso();
      rechazado = !resultado.guardo;
    });

    await test.step('Entonces el sistema debe rechazarlo', () => {
      expect(rechazado, 'el pago negativo no debería registrarse').toBe(true);
    });
  });

  test('Escenario: No se puede registrar un pago sin proveedor ni obra', { tag: '@destructive' }, async ({ formEgreso }) => {
    await test.step('Dado que estoy registrando un pago', async () => {
      await formEgreso.abrirNuevo();
    });

    let rechazado = false;

    await test.step('Cuando dejo el monto en 0 y no indico proveedor ni obra, y guardo', async () => {
      await formEgreso.completarMonto(0);
      const resultado = await formEgreso.guardarEgreso();
      rechazado = !resultado.guardo;
    });

    await test.step('Entonces el sistema debe rechazarlo', () => {
      expect(rechazado, 'un pago sin proveedor ni obra no debería registrarse (RN-04)').toBe(true);
    });
  });
});
