import type { Page, Locator } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export type TipoEgreso =
  | 'MATERIALES' | 'MANO DE OBRA' | 'FLETE' | 'COMBUSTIBLE'
  | 'HERRAMIENTAS' | 'SERVICIOS' | 'IMPUESTOS' | 'OTROS';

export interface ResultadoGuardado {
  guardo: boolean;
  rutaFinal: string;
}

/**
 * Formulario de alta de egresos (`/egresos/nuevo`).
 *
 * Campos base (por posición): Fecha (date), Monto (number). Más buscadores
 * "Buscar venta o cliente..." y "Buscar proveedor...", y grupos de botones de
 * tipo de egreso, cuenta y caja.
 *
 * Actualización 2026-08-19: el cheque dejó de ser una casilla suelta y ahora
 * es una opción del selector "Condición de pago" (Cheque · Cuenta corriente ·
 * Efectivo · Tarjeta · Transferencia). Al elegir "Cheque" aparece una fecha
 * adicional ("Fecha vencimiento"), que rige el flujo de fondos diferido.
 *
 * Los egresos no se editan ni eliminan desde la interfaz; la limpieza de los
 * que persistan se hace por API (support/supabase.ts).
 */
export class EgresoFormPage {
  private readonly guardar: Locator;

  constructor(private readonly page: Page) {
    this.guardar = page.getByRole('button', { name: 'Guardar', exact: true });
  }

  async abrirNuevo(): Promise<void> {
    await this.page.goto(RUTAS.egresos + '/nuevo', { waitUntil: 'domcontentloaded' });
    await this.guardar.first().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1_000);
  }

  async seleccionarPrimerProveedor(): Promise<string> {
    await this.page.getByText(/buscar proveedor/i).first().click();
    await this.page.waitForTimeout(1_000);
    const opcion = this.page.getByText(/Herrajes|IMPLEMENTOS|FULL COLOR|QA-TEST/i).first();
    const etiqueta = (await opcion.innerText().catch(() => '')).replace(/\s+/g, ' ');
    await opcion.click().catch(() => undefined);
    await this.page.waitForTimeout(600);
    return etiqueta;
  }

  async elegirTipo(tipo: TipoEgreso): Promise<void> {
    await this.page.getByRole('button', { name: tipo, exact: true }).first().click();
    await this.page.waitForTimeout(400);
  }

  async completarMonto(monto: number): Promise<void> {
    await this.page.locator('input[type=number]').first().fill(String(monto));
  }

  /**
   * Elige "Cheque" en la Condición de pago y devuelve cuántos campos de fecha
   * quedan visibles (base 1 → 2 al sumar la fecha de vencimiento del cheque).
   */
  async marcarCheque(): Promise<number> {
    await this.page.getByRole('button', { name: 'Cheque', exact: true }).first().click();
    await this.page.waitForTimeout(1_200);
    return this.page.locator('input[type=date]:visible').count();
  }

  async guardarEgreso(): Promise<ResultadoGuardado> {
    const antes = new URL(this.page.url()).pathname;
    await this.guardar.first().click();
    await this.page.waitForTimeout(3_500);
    const rutaFinal = new URL(this.page.url()).pathname;
    return { guardo: rutaFinal !== antes, rutaFinal };
  }
}
