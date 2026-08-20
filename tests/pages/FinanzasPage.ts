import type { Page } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

/** Cuentas/cajas que el módulo Finanzas muestra en la pestaña "Caja". */
export const CAJAS = ['Banco Macro', 'Efectivo Blanco', 'Efectivo Negro', 'MercadoPago'] as const;

/**
 * Módulo Finanzas (`/finanzas`), incorporado en la actualización del 2026-08-19.
 *
 * Reúne el "corazón financiero" del diseño en tres pestañas:
 *  - "Caja": posición de caja por cuenta e indicadores (Caja disponible,
 *    Por acreditar, Compromisos del período, Disponible estimado) + Deuda diferida.
 *  - "Proyección": flujo de fondos diario con la fecha de descalce proyectado y
 *    el saldo mínimo (11_FLUJO_FONDOS, marcado de máxima prioridad en el roadmap).
 *  - "Flujo mensual".
 *
 * Pantalla de solo lectura: los tests no mutan nada aquí.
 */
export class FinanzasPage {
  constructor(private readonly page: Page) {}

  async abrir(): Promise<void> {
    await this.page.goto(RUTAS.finanzas, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(3_000);
  }

  /** Cambia de pestaña por su etiqueta exacta (las solapas son botones de texto). */
  private async irASolapa(nombre: string): Promise<void> {
    await this.page.getByText(nombre, { exact: true }).first().click();
    await this.page.waitForTimeout(2_000);
  }

  async abrirCaja(): Promise<void> {
    await this.irASolapa('Caja');
  }

  async abrirProyeccion(): Promise<void> {
    await this.irASolapa('Proyección');
  }

  private async cuerpo(): Promise<string> {
    return this.page.evaluate(() => document.body.innerText);
  }

  /** true si el texto (indicador/rótulo) está presente, sin distinguir mayúsculas. */
  async tieneTexto(fragmento: string): Promise<boolean> {
    return (await this.cuerpo()).toUpperCase().includes(fragmento.toUpperCase());
  }

  /** Cuentas de CAJAS efectivamente visibles en la pestaña "Caja". */
  async cuentasVisibles(): Promise<string[]> {
    const cuerpo = await this.cuerpo();
    return CAJAS.filter((c) => cuerpo.includes(c));
  }

  /** Fecha de descalce proyectado (dd/mm/aaaa) de la pestaña "Proyección", o null. */
  async descalceProyectado(): Promise<string | null> {
    const m = (await this.cuerpo()).match(/Descalce proyectado:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return m?.[1] ?? null;
  }

  /** Texto del saldo mínimo proyectado (incluye el signo y el importe), o null. */
  async saldoMinimo(): Promise<string | null> {
    const m = (await this.cuerpo()).match(/Saldo m[ií]nimo:\s*(-?\$[\s\d.,]+)/i);
    return m?.[1]?.trim() ?? null;
  }
}
