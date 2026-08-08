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
 * Campos base (por posición): Fecha (date), Monto (number), "Es un cheque"
 * (checkbox). Más buscadores "Buscar venta o cliente..." y "Buscar
 * proveedor...", y grupos de botones de tipo de egreso, cuenta y caja.
 *
 * Al marcar "Es un cheque" aparecen dos fechas adicionales (emisión y
 * acreditación): el flujo de fondos se rige por la fecha de acreditación.
 *
 * Los egresos no se editan ni eliminan desde la interfaz; la limpieza de los
 * que persistan se hace por API (support/supabase.ts).
 */
export class EgresoFormPage {
  private readonly guardar: Locator;
  private readonly esCheque: Locator;

  constructor(private readonly page: Page) {
    this.guardar = page.getByRole('button', { name: 'Guardar', exact: true });
    this.esCheque = page.locator('input[type=checkbox]').first();
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

  /** Marca "Es un cheque" y devuelve cuántos campos de fecha quedan visibles. */
  async marcarCheque(): Promise<number> {
    await this.esCheque.check();
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
