import type { Page } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export interface FilaVenta {
  id: string;
  estado: string;
}

/**
 * Listado de ventas (`/ventas`), de solo lectura.
 *
 * Las ventas no se crean a mano: nacen de aceptar un presupuesto (RN-01), por
 * lo que esta pantalla no tiene alta. Los estados operativos configurados son
 * de taller: Pendiente, Planificado, En fabricación, En montaje, Entregado,
 * Cerrado.
 */
export class VentasPage {
  constructor(private readonly page: Page) {}

  async abrir(): Promise<void> {
    await this.page.goto(RUTAS.ventas, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(3_000);
  }

  /** Ids `PR-XXXX` visibles en el listado. */
  async ids(): Promise<string[]> {
    const encabezados = await this.page.locator('h2:visible, h3:visible').allInnerTexts();
    return encabezados
      .map((t) => t.trim())
      .filter((t) => /PR\s*-\s*\d{4}/.test(t));
  }

  async cantidad(): Promise<number> {
    return (await this.ids()).length;
  }

  /** true si el listado ofrece algún botón de alta de ventas (no debería). */
  async tieneAltaDeVenta(): Promise<boolean> {
    const nombres = [/nueva venta/i, /nuevo contrato/i, /agregar venta/i];
    for (const n of nombres) {
      if (await this.page.getByRole('button', { name: n }).count() > 0) return true;
    }
    return false;
  }

  /** Abre el detalle de la primera venta y devuelve las solapas disponibles. */
  async abrirPrimerDetalle(): Promise<string[]> {
    await this.page.locator('h2:visible, h3:visible')
      .filter({ hasText: /PR\s*-\s*\d{4}/ }).first().click();
    await this.page.waitForTimeout(2_500);
    const botones = await this.page.locator('button:visible').allInnerTexts();
    return botones.map((t) => t.trim()).filter(Boolean);
  }

  async rutaActual(): Promise<string> {
    return new URL(this.page.url()).pathname;
  }
}
