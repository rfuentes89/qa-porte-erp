import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PresupuestoFormPage } from '../pages/PresupuestoFormPage';
import { PresupuestosListPage } from '../pages/PresupuestosListPage';
import { ProveedoresPage } from '../pages/ProveedoresPage';
import { VentasPage } from '../pages/VentasPage';
import { IngresoFormPage } from '../pages/IngresoFormPage';
import { EgresoFormPage } from '../pages/EgresoFormPage';
import { GastosFijosPage } from '../pages/GastosFijosPage';
import { FinanzasPage } from '../pages/FinanzasPage';
import { credenciales, type Rol } from './perfiles';

interface Fixtures {
  login: LoginPage;
  formPresupuesto: PresupuestoFormPage;
  listaPresupuestos: PresupuestosListPage;
  proveedores: ProveedoresPage;
  ventas: VentasPage;
  formIngreso: IngresoFormPage;
  formEgreso: EgresoFormPage;
  gastosFijos: GastosFijosPage;
  finanzas: FinanzasPage;
  /** Inicia sesión con el rol indicado y devuelve la ruta de aterrizaje. */
  ingresarComo: (rol: Rol) => Promise<string>;
}

export const test = base.extend<Fixtures>({
  login: async ({ page }, usar) => usar(new LoginPage(page)),
  formPresupuesto: async ({ page }, usar) => usar(new PresupuestoFormPage(page)),
  listaPresupuestos: async ({ page }, usar) => usar(new PresupuestosListPage(page)),
  proveedores: async ({ page }, usar) => usar(new ProveedoresPage(page)),
  ventas: async ({ page }, usar) => usar(new VentasPage(page)),
  formIngreso: async ({ page }, usar) => usar(new IngresoFormPage(page)),
  formEgreso: async ({ page }, usar) => usar(new EgresoFormPage(page)),
  gastosFijos: async ({ page }, usar) => usar(new GastosFijosPage(page)),
  finanzas: async ({ page }, usar) => usar(new FinanzasPage(page)),

  ingresarComo: async ({ page }, usar) => {
    const loginPage = new LoginPage(page);
    await usar((rol: Rol) => loginPage.ingresar(credenciales(rol)));
  },
});

export { expect };

/**
 * Marca única por corrida para los datos de prueba.
 *
 * El entorno tiene datos reales: todo registro creado por la suite lleva este
 * prefijo para poder identificarlo y limpiarlo después.
 */
export const MARCA_QA = `QA-TEST-${new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '')}`;
