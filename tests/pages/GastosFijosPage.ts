import type { Page, Locator } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export type CategoriaGasto =
  | 'Alquiler' | 'Sueldos' | 'Servicios' | 'Impuestos'
  | 'Herramientas' | 'Combustible' | 'Otros';

export interface DatosGastoFijo {
  concepto?: string;
  fecha?: string;
  categoria?: CategoriaGasto;
  montoPrevisto?: number;
  montoReal?: number;
}

/**
 * Módulo Gastos fijos (`/gastos-fijos`).
 *
 * A diferencia de presupuestos, ingresos y egresos, este módulo SÍ ofrece
 * "Editar" y "Eliminar" en cada tarjeta, y el borrado es efectivo.
 *
 * El alta es un modal que se abre con un botón "+" solo-ícono (sin nombre
 * accesible, igual que en proveedores). Campos del modal, por posición sobre
 * `<input>` (el índice 0 es el buscador del encabezado):
 *   [1] Concepto *   [2] Fecha   [3] Monto previsto *   [4] Monto real
 * Más grupos de botones: Categoría, Caja (BLANCA/NEGRA) y estado
 * (PREVISTO/PAGADO/VENCIDO).
 */
export class GastosFijosPage {
  private static readonly IDX = { concepto: 1, fecha: 2, montoPrevisto: 3, montoReal: 4 } as const;

  constructor(private readonly page: Page) {}

  async abrir(): Promise<void> {
    await this.page.goto(RUTAS.gastosFijos, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(3_000);
  }

  async conceptos(): Promise<string[]> {
    const encabezados = await this.page.locator('h2:visible, h3:visible').allInnerTexts();
    return encabezados.map((t) => t.trim()).filter((t) => t && t !== 'Gastos fijos');
  }

  async existe(concepto: string): Promise<boolean> {
    return (await this.page.locator('body').innerText()).includes(concepto);
  }

  /**
   * Botón "+" de alta (sin nombre accesible): último botón del encabezado que
   * contiene el título "Gastos fijos". Se evita así el botón flotante del
   * Asistente (agregado el 2026-08-11), que también es un ícono sin texto.
   */
  private botonAlta(): Locator {
    return this.page
      .getByRole('heading', { level: 1, name: 'Gastos fijos' })
      .locator('..')
      .getByRole('button')
      .last();
  }

  private botonGuardar(): Locator {
    return this.page.getByRole('button', { name: 'Guardar', exact: true }).first();
  }

  async abrirAlta(): Promise<void> {
    await this.botonAlta().click();
    await this.botonGuardar().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(800);
  }

  async completarModal(datos: DatosGastoFijo): Promise<void> {
    const { IDX } = GastosFijosPage;
    const campos = this.page.locator('input');
    if (datos.concepto !== undefined) await campos.nth(IDX.concepto).fill(datos.concepto);
    if (datos.fecha !== undefined) await campos.nth(IDX.fecha).fill(datos.fecha);
    if (datos.categoria !== undefined) {
      await this.page.getByRole('button', { name: datos.categoria, exact: true }).first().click();
      await this.page.waitForTimeout(300);
    }
    if (datos.montoPrevisto !== undefined) await campos.nth(IDX.montoPrevisto).fill(String(datos.montoPrevisto));
    if (datos.montoReal !== undefined) await campos.nth(IDX.montoReal).fill(String(datos.montoReal));
  }

  /** Guarda y devuelve true si el modal se cerró (indicio de alta aceptada). */
  async guardar(): Promise<boolean> {
    const guardar = this.botonGuardar();
    await guardar.scrollIntoViewIfNeeded().catch(() => undefined);
    await guardar.click();
    await this.page.waitForTimeout(3_000);
    return (await this.page.getByRole('button', { name: 'Guardar', exact: true }).count()) === 0;
  }

  async crear(datos: DatosGastoFijo): Promise<boolean> {
    await this.abrirAlta();
    await this.completarModal(datos);
    return this.guardar();
  }

  /** Elimina el gasto cuyo concepto coincide. El borrado en este módulo es efectivo. */
  async eliminar(concepto: string): Promise<void> {
    const conceptos = await this.conceptos();
    const i = conceptos.findIndex((c) => c.includes(concepto));
    if (i < 0) return;
    await this.page.getByRole('button', { name: 'Eliminar' }).nth(i).click();
    await this.page.waitForTimeout(1_500);
    // Confirmación (si aparece): botón "Eliminar" dentro del diálogo.
    const confirmar = this.page.getByRole('button', { name: /eliminar|confirmar/i }).last();
    if (await confirmar.count()) await confirmar.click().catch(() => undefined);
    await this.page.waitForTimeout(2_500);
  }
}
