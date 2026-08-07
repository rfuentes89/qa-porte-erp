import type { Page } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export interface FilaPresupuesto {
  id: string;
  estado: string;
  cliente: string;
}

/** Listado de presupuestos (`/presupuestos`). */
export class PresupuestosListPage {
  constructor(private readonly page: Page) {}

  async abrir(): Promise<void> {
    await this.page.goto(RUTAS.presupuestos, { waitUntil: 'networkidle' });
    // El listado muestra el estado vacío mientras carga (OBS-03), así que no
    // alcanza con esperar la red: hay que darle margen al render de los datos.
    await this.page.waitForTimeout(3_000);
  }

  private async texto(): Promise<string> {
    return this.page.evaluate(() => document.body.innerText);
  }

  /** Devuelve las filas cuyo cliente contiene la marca indicada. */
  async buscarPorMarca(marca: string): Promise<FilaPresupuesto[]> {
    const cuerpo = await this.texto();
    const filas: FilaPresupuesto[] = [];
    const patron = /(PR\s*-\s*\d{4})\s+(\S+)\s+(\S+)/g;

    for (const m of cuerpo.matchAll(patron)) {
      const [, id, estado, cliente] = m;
      if (id && estado && cliente?.includes(marca)) {
        filas.push({ id, estado, cliente });
      }
    }
    return filas;
  }

  async existeMarca(marca: string): Promise<boolean> {
    return (await this.texto()).includes(marca);
  }

  /** Contexto textual alrededor de la marca, útil como evidencia en el reporte. */
  async contextoDe(marca: string, margen = 220): Promise<string | null> {
    const cuerpo = await this.texto();
    const i = cuerpo.indexOf(marca);
    if (i === -1) return null;
    return cuerpo.slice(Math.max(0, i - margen), i + 150).replace(/\s+/g, ' ');
  }

  /** El botón de alta solo se renderiza con la lista vacía (OBS-07). */
  async tieneBotonNuevo(): Promise<boolean> {
    return (await this.page.getByRole('button', { name: 'Nuevo presupuesto' }).count()) > 0;
  }
}
