import { test, expect, MARCA_QA } from './support/fixtures';

/**
 * Casos de uso del módulo Presupuestos.
 *
 * El entorno tiene datos reales. Desde la actualización del 2026-08-19 el
 * Cliente es un desplegable de clientes existentes, así que ya no sirve como
 * marcador; los registros de prueba se identifican por el prefijo MARCA_QA en
 * la DESCRIPCIÓN (que el listado muestra tras el "·"). El listado ya permite
 * Eliminar por fila (OBS-08 corregido).
 *
 * Nota de alcance: CU-PR-04/05 verifican el guard del FRONTEND. Se comprobó por
 * API que el backend NO valida el monto (acepta total 0 y costos negativos con
 * un cliente válido); esa brecha se documenta en seguridad-rls.spec.ts.
 */
test.describe('CU-PR — Presupuestos', () => {
  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-PR-03 · rechaza un presupuesto sin cliente', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    // No se elige cliente en el desplegable (queda el placeholder).
    const resultado = await formPresupuesto.guardar();

    expect(resultado.guardo, 'no debe guardarse un presupuesto sin cliente').toBe(false);
  });

  test('CU-PR-04 · el frontend bloquea un importe total 0 [DEF-01]', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.seleccionarClienteExistente();
    await formPresupuesto.completar({ descripcion: `${MARCA_QA}-MONTO0 importe cero` });
    const resultado = await formPresupuesto.guardar();

    // Documento 2, Sprint 1 §5: "MONTO_TOTAL > 0". Hoy solo lo aplica la UI.
    expect(resultado.guardo, 'la UI no debe guardar un presupuesto de importe 0').toBe(false);
  });

  test('CU-PR-05 · el frontend bloquea costos negativos [DEF-02]', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.seleccionarClienteExistente();
    await formPresupuesto.completar({
      descripcion: `${MARCA_QA}-NEG costo negativo`,
      materiales: -5_000,
      beneficio: 1_000,
    });
    const resultado = await formPresupuesto.guardar();

    expect(resultado.guardo, 'la UI no debe guardar un costo de materiales negativo').toBe(false);
  });

  test('CU-TR-09 · el campo numérico no acepta texto', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    const valor = await formPresupuesto.tipearEnMateriales('abc');

    expect(valor, 'el campo debe quedar vacío tras tipear texto').toBe('');
  });

  test('CU-PR-01 y CU-PR-02 · alta válida y aparición en el listado con ID PR-XXXX', { tag: '@destructive' }, async ({
    formPresupuesto, listaPresupuestos,
  }) => {
    // El marcador va en la descripción (el cliente ahora es un desplegable).
    const marca = `${MARCA_QA}-OK`;
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.seleccionarClienteExistente();
    await formPresupuesto.completar({
      descripcion: `${marca} alta valida`,
      materiales: 400_000,
      manoDeObra: 200_000,
      indirectos: 50_000,
      impuestos: 100_000,
      comercial: 50_000,
      beneficio: 200_000,
    });

    const resultado = await formPresupuesto.guardar();
    expect(resultado.guardo, `no se guardó. Errores: ${resultado.erroresVisibles.join(' | ')}`).toBe(true);

    await listaPresupuestos.abrir();
    const contexto = await listaPresupuestos.contextoDe(marca);
    expect(contexto, `"${marca}" no aparece en el listado`).not.toBeNull();

    // El ID debe seguir el formato PR-XXXX y el monto ser la suma de las categorías.
    expect(contexto).toMatch(/PR\s*-\s*\d{4}/);
    expect(contexto).toContain('1.000.000');
  });

  test('OBS-07 corregido · el alta de presupuestos es accesible', { tag: '@smoke' }, async ({ formPresupuesto }) => {
    // OBS-07 (el botón de alta desaparecía con datos) se corrigió: el listado
    // tiene un "+" permanente y el alta es accesible. Se verifica que el
    // formulario carga (guarda de regresión). Vuelve a rojo si se pierde el acceso.
    await formPresupuesto.abrirNuevo();
    await expect(formPresupuesto.botonGuardar).toBeVisible();
  });
});
