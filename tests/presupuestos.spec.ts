import { test, expect, MARCA_QA } from './support/fixtures';

/**
 * Casos de uso del módulo Presupuestos.
 *
 * El entorno tiene datos reales: todo registro creado lleva el prefijo
 * MARCA_QA en el campo Cliente. El hook de cierre los neutraliza pasándolos
 * a "Cancelado", porque el módulo no permite eliminar (OBS-08).
 */
test.describe('CU-PR — Presupuestos', () => {
  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-PR-03 · rechaza un presupuesto sin cliente', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    const resultado = await formPresupuesto.guardar();

    expect(resultado.guardo, 'no debe guardarse un presupuesto sin cliente').toBe(false);
  });

  test('CU-PR-04 · rechaza un presupuesto con importe total 0 [DEF-01]', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.completar({
      cliente: `${MARCA_QA}-MONTO0`,
      descripcion: 'Caso QA: importe total cero',
    });
    const resultado = await formPresupuesto.guardar();

    // Documento 2, Sprint 1 §5: "MONTO_TOTAL > 0"
    expect(resultado.guardo, 'no debe guardarse un presupuesto de importe 0').toBe(false);
  });

  test('CU-PR-05 · rechaza costos negativos [DEF-02]', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.completar({
      cliente: `${MARCA_QA}-NEG`,
      descripcion: 'Caso QA: costo negativo',
      materiales: -5_000,
      beneficio: 1_000,
    });
    const resultado = await formPresupuesto.guardar();

    expect(resultado.guardo, 'no debe aceptarse un costo de materiales negativo').toBe(false);
  });

  test('CU-TR-09 · el campo numérico no acepta texto', { tag: '@destructive' }, async ({ formPresupuesto }) => {
    await formPresupuesto.abrirNuevo();
    const valor = await formPresupuesto.tipearEnMateriales('abc');

    expect(valor, 'el campo debe quedar vacío tras tipear texto').toBe('');
  });

  test('CU-PR-01 y CU-PR-02 · alta válida y aparición en el listado con ID PR-XXXX', { tag: '@destructive' }, async ({
    formPresupuesto, listaPresupuestos,
  }) => {
    const cliente = `${MARCA_QA}-OK`;
    await formPresupuesto.abrirNuevo();
    await formPresupuesto.completar({
      cliente,
      descripcion: 'Caso QA: alta valida',
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
    const contexto = await listaPresupuestos.contextoDe(cliente);
    expect(contexto, `"${cliente}" no aparece en el listado`).not.toBeNull();

    // El ID debe seguir el formato PR-XXXX y el monto ser la suma de las categorías.
    expect(contexto).toMatch(/PR\s*-\s*\d{4}/);
    expect(contexto).toContain('1.000.000');
  });

  test('OBS-07 · el botón de alta desaparece cuando el listado tiene datos', { tag: '@destructive' }, async ({ listaPresupuestos }) => {
    await listaPresupuestos.abrir();

    // Documenta el comportamiento observado: con datos cargados no hay acceso
    // a la creación desde el listado. Falla si el equipo lo corrige, momento en
    // que corresponde cerrar OBS-07 y eliminar este test.
    expect(
      await listaPresupuestos.tieneBotonNuevo(),
      'OBS-07 resuelto: ya existe el botón de alta en el listado. Cerrar la observación.',
    ).toBe(false);
  });
});
