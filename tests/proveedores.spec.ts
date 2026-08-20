import { test, expect, MARCA_QA } from './support/fixtures';
import { MENSAJES } from './support/textos';

/**
 * Casos del módulo Proveedores, derivados de la sesión de testing manual
 * del 2026-08-07.
 *
 * Cada test crea su propio proveedor descartable y lo da de baja al terminar:
 * los proveedores reales nunca se tocan.
 */
test.describe('CU-MA — Proveedores', () => {
  test.beforeEach(async ({ ingresarComo }) => {
    await ingresarComo('ADMIN');
  });

  test('CU-MA-08 · alta de proveedor con todos sus datos', { tag: '@destructive' }, async ({ proveedores }) => {
    const nombre = `${MARCA_QA}-ALTA`;
    await proveedores.abrir();
    await proveedores.crear({
      nombre,
      rubro: 'RUBRO-QA',
      contacto: 'CONTACTO-QA',
      telefono: '3875550000',
    });

    await proveedores.abrir();
    const ficha = await proveedores.ficha(nombre);
    expect(ficha, 'el proveedor debe aparecer en el listado').not.toBeNull();
    expect(ficha?.texto).toContain('RUBRO-QA');
    expect(ficha?.texto).toContain('CONTACTO-QA');

    await proveedores.eliminar(nombre);
  });

  test('CU-MA-11 · el modal de edición precarga los datos actuales [DEF-05]', { tag: '@destructive' }, async ({ proveedores }) => {
    const nombre = `${MARCA_QA}-PRECARGA`;
    await proveedores.abrir();
    await proveedores.crear({ nombre, rubro: 'RUBRO-ORIGINAL', contacto: 'CONTACTO-ORIGINAL' });

    await proveedores.abrir();
    await proveedores.abrirEdicion(nombre);
    const valores = await proveedores.valoresDelModal();

    // El primer input es el buscador del encabezado, que sí está vacío a propósito.
    const delFormulario = valores.slice(1);
    await proveedores.cancelarDialogo();
    await proveedores.abrir();
    await proveedores.eliminar(nombre);

    expect(
      delFormulario.some((v) => v !== ''),
      'el modal abre con todos los campos vacíos en lugar de precargar los datos del proveedor',
    ).toBe(true);
  });

  test('CU-MA-12 · editar un campo no debe borrar los demás [DEF-05]', { tag: '@destructive' }, async ({ proveedores }) => {
    const nombre = `${MARCA_QA}-WIPE`;
    await proveedores.abrir();
    await proveedores.crear({ nombre, rubro: 'RUBRO-ORIGINAL', contacto: 'CONTACTO-ORIGINAL' });

    await proveedores.abrir();
    expect((await proveedores.ficha(nombre))?.texto).toContain('CONTACTO-ORIGINAL');

    // Se modifica únicamente el nombre; el resto no se toca.
    await proveedores.abrirEdicion(nombre);
    await proveedores.completarModal({ nombre: `${nombre}-RENOMBRADO` });
    await proveedores.guardarModal();

    await proveedores.abrir();
    const ficha = await proveedores.ficha(`${nombre}-RENOMBRADO`);
    await proveedores.eliminar(`${nombre}-RENOMBRADO`);

    expect(ficha?.texto, 'el rubro se perdió al editar solo el nombre').toContain('RUBRO-ORIGINAL');
    expect(ficha?.texto, 'el contacto se perdió al editar solo el nombre').toContain('CONTACTO-ORIGINAL');
  });

  test('la baja de proveedor es lógica, no física', { tag: '@destructive' }, async ({ proveedores }) => {
    const nombre = `${MARCA_QA}-BAJA`;
    await proveedores.abrir();
    await proveedores.crear({ nombre, rubro: 'RUBRO-QA' });

    await proveedores.abrir();
    const aviso = await proveedores.textoConfirmacionBaja(nombre);
    expect(aviso).toContain(MENSAJES.bajaLogicaProveedor);

    await proveedores.cancelarDialogo();
    await proveedores.abrir();
    await proveedores.eliminar(nombre);
    expect(await proveedores.existe(nombre), 'debe salir del listado tras darlo de baja').toBe(false);
  });
});

/**
 * DEF-04 — El perfil de carga tiene los mismos permisos de escritura sobre
 * proveedores que el administrador (defecto ABIERTO).
 *
 * El proveedor descartable lo crea el ADMIN; luego el perfil de carga lo da de
 * baja. Confirmado el 2026-08-07 y re-verificado el 2026-08-19: la baja le es
 * permitida. El test documenta ese estado (verde mientras el defecto siga
 * abierto) y PASA A ROJO cuando se restrinja el permiso, momento de cerrar DEF-04.
 */
test.describe('DEF-04 — Permisos de escritura del perfil de carga', () => {
  test('el perfil de carga puede dar de baja proveedores [DEF-04 abierto]', { tag: '@destructive' }, async ({
    browser, proveedores, ingresarComo,
  }) => {
    test.slow();
    const nombre = `${MARCA_QA}-PERMISO`;

    await ingresarComo('ADMIN');
    await proveedores.abrir();
    await proveedores.crear({ nombre, rubro: 'RUBRO-QA' });

    // Contexto nuevo, no `clearCookies()`: la sesión vive en localStorage y
    // limpiar cookies no cierra la sesión del administrador.
    const contextoCarga = await browser.newContext();
    const paginaCarga = await contextoCarga.newPage();
    const { LoginPage } = await import('./pages/LoginPage');
    const { ProveedoresPage } = await import('./pages/ProveedoresPage');
    const { credenciales } = await import('./support/perfiles');

    await new LoginPage(paginaCarga).ingresar(credenciales('CARGA'));
    const comoCarga = new ProveedoresPage(paginaCarga);
    await comoCarga.abrir();
    expect(await comoCarga.existe(nombre), 'el perfil de carga debe ver el proveedor').toBe(true);

    await comoCarga.eliminar(nombre);
    await comoCarga.abrir();
    const sobrevivio = await comoCarga.existe(nombre);
    await contextoCarga.close();

    if (sobrevivio) {
      // El backend rechazó la baja: hay que limpiar el proveedor con el admin.
      await proveedores.abrir();
      await proveedores.eliminar(nombre);
    }

    expect(
      sobrevivio,
      'DEF-04 resuelto: el perfil de carga ya no puede dar de baja proveedores. Cerrar el defecto.',
    ).toBe(false);
  });
});
