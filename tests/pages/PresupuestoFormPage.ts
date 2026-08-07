import type { Page, Locator } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

/** Estados comerciales configurados en `/config`. */
export type EstadoComercial =
  | 'Pedido' | 'En presupuestación' | 'Enviado' | 'En negociación'
  | 'Aceptado' | 'Rechazado' | 'Represupuestado' | 'Cancelado';

export interface DatosPresupuesto {
  cliente?: string;
  descripcion?: string;
  materiales?: number;
  manoDeObra?: number;
  indirectos?: number;
  impuestos?: number;
  comercial?: number;
  beneficio?: number;
  estado?: EstadoComercial;
}

export interface ResultadoGuardado {
  /** true si la aplicación navegó fuera del formulario, señal de alta exitosa. */
  guardo: boolean;
  rutaFinal: string;
  erroresVisibles: string[];
}

/**
 * Formulario de alta y edición de presupuestos.
 *
 * ADVERTENCIA: los campos no exponen `id`, `name`, `data-testid` ni atributo
 * `type`, y no usan `<label for>`. Hay que ubicarlos por posición absoluta
 * sobre `<input>`, lo que es frágil ante cualquier reordenamiento del layout.
 * Ver la nota de automatización del reporte del 2026-08-06.
 */
export class PresupuestoFormPage {
  /** Índice 0 es el buscador del encabezado, que no pertenece al formulario. */
  private static readonly IDX = {
    cliente: 1,
    descripcion: 2,
    materiales: 3,
    manoDeObra: 4,
    indirectos: 5,
    impuestos: 6,
    comercial: 7,
    beneficio: 8,
    vencimiento: 9,
  } as const;

  private readonly guardarBtn: Locator;

  constructor(private readonly page: Page) {
    this.guardarBtn = page.getByRole('button', { name: 'Guardar presupuesto' });
  }

  private campo(indice: number): Locator {
    return this.page.locator('input').nth(indice);
  }

  async abrirNuevo(): Promise<void> {
    await this.page.goto(RUTAS.presupuestoNuevo, { waitUntil: 'domcontentloaded' });
    await this.esperarFormulario();
  }

  async abrirExistente(id: string): Promise<void> {
    await this.page.goto(`${RUTAS.presupuestos}/${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded' });
    await this.esperarFormulario();
  }

  private async esperarFormulario(): Promise<void> {
    await this.guardarBtn.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1_000); // hidratación de los campos
  }

  async completar(datos: DatosPresupuesto): Promise<void> {
    const { IDX } = PresupuestoFormPage;
    const texto: [number, string | undefined][] = [
      [IDX.cliente, datos.cliente],
      [IDX.descripcion, datos.descripcion],
    ];
    for (const [i, valor] of texto) {
      if (valor !== undefined) await this.campo(i).fill(valor);
    }

    const numeros: [number, number | undefined][] = [
      [IDX.materiales, datos.materiales],
      [IDX.manoDeObra, datos.manoDeObra],
      [IDX.indirectos, datos.indirectos],
      [IDX.impuestos, datos.impuestos],
      [IDX.comercial, datos.comercial],
      [IDX.beneficio, datos.beneficio],
    ];
    for (const [i, valor] of numeros) {
      if (valor !== undefined) await this.campo(i).fill(String(valor));
    }

    if (datos.estado) await this.seleccionarEstado(datos.estado);
  }

  async seleccionarEstado(estado: EstadoComercial): Promise<void> {
    await this.page.getByRole('button', { name: estado, exact: true }).first().click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Escribe con teclado real en un campo numérico.
   * `fill()` rechaza texto no numérico en `input[type=number]`, así que para
   * probar la validación hay que tipear.
   */
  async tipearEnMateriales(texto: string): Promise<string> {
    const campo = this.campo(PresupuestoFormPage.IDX.materiales);
    await campo.click();
    await this.page.keyboard.type(texto);
    return campo.inputValue();
  }

  async guardar(): Promise<ResultadoGuardado> {
    const rutaPrevia = new URL(this.page.url()).pathname;
    await this.guardarBtn.click();
    await this.page.waitForTimeout(4_000);

    const rutaFinal = new URL(this.page.url()).pathname;
    return {
      guardo: rutaFinal !== rutaPrevia,
      rutaFinal,
      erroresVisibles: await this.leerErrores(),
    };
  }

  private async leerErrores(): Promise<string[]> {
    const errores = this.page.locator('[class*=error], [role=alert], [aria-invalid=true]');
    const textos = await errores.filter({ visible: true }).allInnerTexts();
    return textos.map((t) => t.trim()).filter(Boolean).slice(0, 5);
  }
}
