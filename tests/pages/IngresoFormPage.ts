import type { Page, Locator } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export type TipoIngreso = 'ANTICIPO' | 'SALDO' | 'PAGO PARCIAL' | 'OTRO';

export interface ResultadoGuardado {
  guardo: boolean;
  rutaFinal: string;
}

/**
 * Formulario de alta de ingresos (`/ingresos/nuevo`).
 *
 * Campos (por posición, sin id/name/type):
 *   input date  -> Fecha
 *   input text  -> Concepto ("Ej: Anticipo 50%")
 *   input number-> Monto
 * Más un buscador "Buscar venta o cliente..." que despliega las obras, y
 * grupos de botones para tipo de ingreso, cuenta y caja.
 *
 * Los ingresos no se pueden editar ni eliminar desde la interfaz; la limpieza
 * de los que persistan se hace por API (ver support/supabase.ts).
 */
export class IngresoFormPage {
  private readonly guardar: Locator;

  constructor(private readonly page: Page) {
    this.guardar = page.getByRole('button', { name: 'Guardar', exact: true });
  }

  async abrirNuevo(): Promise<void> {
    await this.page.goto(RUTAS.ingresos + '/nuevo', { waitUntil: 'domcontentloaded' });
    await this.guardar.first().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1_000);
  }

  /** Selecciona la primera obra que ofrece el buscador y devuelve su etiqueta. */
  async seleccionarPrimeraVenta(): Promise<string> {
    await this.page.getByText(/buscar venta o cliente/i).first().click();
    await this.page.waitForTimeout(1_200);
    const opcion = this.page.getByText(/PR\s*-\s*\d{4}/).first();
    const etiqueta = (await opcion.innerText().catch(() => '')).replace(/\s+/g, ' ');
    await opcion.click().catch(() => undefined);
    await this.page.waitForTimeout(700);
    return etiqueta;
  }

  async elegirTipo(tipo: TipoIngreso): Promise<void> {
    await this.page.getByRole('button', { name: tipo, exact: true }).first().click();
    await this.page.waitForTimeout(400);
  }

  async completarMonto(monto: number): Promise<void> {
    await this.page.locator('input[type=number]').first().fill(String(monto));
  }

  async completarConcepto(texto: string): Promise<void> {
    await this.page.getByPlaceholder('Ej: Anticipo 50%').fill(texto);
  }

  async guardarIngreso(): Promise<ResultadoGuardado> {
    const antes = new URL(this.page.url()).pathname;
    await this.guardar.first().click();
    await this.page.waitForTimeout(3_500);
    const rutaFinal = new URL(this.page.url()).pathname;
    return { guardo: rutaFinal !== antes, rutaFinal };
  }
}
