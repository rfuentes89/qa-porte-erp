import type { Page, Locator } from '@playwright/test';
import { RUTAS } from '../support/perfiles';

export interface DatosProveedor {
  nombre?: string;
  rubro?: string;
  contacto?: string;
  telefono?: string;
  plazoDias?: number;
  observaciones?: string;
}

export interface FichaProveedor {
  nombre: string;
  activo: boolean;
  texto: string;
}

/**
 * Listado y ABM de proveedores (`/proveedores`).
 *
 * Dos particularidades de esta pantalla, ambas relevadas manualmente:
 *
 * 1. El botón de alta es un "+" solo-icono, SIN nombre accesible: no se lo
 *    puede ubicar por rol+nombre y hay que tomarlo por posición.
 * 2. Los diálogos de edición y de confirmación de borrado NO exponen
 *    `role=dialog` ni `aria-modal`. No aparecen en el árbol de accesibilidad;
 *    se los ubica por el botón "Cancelar" que contienen.
 */
export class ProveedoresPage {
  /** Índices de los campos del modal (no tienen id, name ni label asociado). */
  private static readonly IDX = {
    nombre: 1, rubro: 2, contacto: 3, telefono: 4, plazo: 5, observaciones: 6,
  } as const;

  constructor(private readonly page: Page) {}

  async abrir(): Promise<void> {
    await this.page.goto(RUTAS.proveedores, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(3_000);
  }

  /** Nombres de las tarjetas, en el orden en que se renderizan. */
  async nombres(): Promise<string[]> {
    return this.page.locator('h2:visible, h3:visible').allInnerTexts()
      .then((ts) => ts.map((t) => t.trim()).filter((t) => t && t !== 'Proveedores'));
  }

  private async indiceDe(nombre: string): Promise<number> {
    return (await this.nombres()).findIndex((n) => n.includes(nombre));
  }

  async ficha(nombre: string): Promise<FichaProveedor | null> {
    const cuerpo = await this.page.locator('body').innerText();
    const plano = cuerpo.replace(/\s+/g, ' ');
    const i = plano.indexOf(nombre);
    if (i === -1) return null;
    const texto = plano.slice(i, i + 200);
    return { nombre, activo: texto.includes('Activo'), texto };
  }

  async existe(nombre: string): Promise<boolean> {
    return (await this.ficha(nombre)) !== null;
  }

  /**
   * El botón "+" de alta no tiene nombre accesible. Se lo ubica como el último
   * botón dentro del encabezado (el que contiene el título "Proveedores"), para
   * no confundirlo con el botón flotante del Asistente —agregado en la
   * actualización de 2026-08-11— que también es un ícono sin texto.
   */
  private botonAlta(): Locator {
    return this.page
      .getByRole('heading', { level: 1, name: 'Proveedores' })
      .locator('..')
      .getByRole('button')
      .last();
  }

  async abrirAlta(): Promise<void> {
    await this.botonAlta().click();
    await this.page.waitForTimeout(2_000);
  }

  async abrirEdicion(nombre: string): Promise<void> {
    const i = await this.indiceDe(nombre);
    if (i < 0) throw new Error(`No se encontró el proveedor "${nombre}"`);
    await this.page.getByRole('button', { name: 'Editar' }).nth(i).click();
    await this.page.waitForTimeout(2_000);
  }

  /** Valores que el modal muestra al abrirse. Sirve para detectar DEF-05. */
  async valoresDelModal(): Promise<string[]> {
    return this.page.locator('input:visible, textarea:visible').evaluateAll(
      (els) => els.map((el) => (el as HTMLInputElement).value),
    );
  }

  async completarModal(datos: DatosProveedor): Promise<void> {
    const { IDX } = ProveedoresPage;
    const campos = this.page.locator('input, textarea');
    const pares: [number, string | undefined][] = [
      [IDX.nombre, datos.nombre],
      [IDX.rubro, datos.rubro],
      [IDX.contacto, datos.contacto],
      [IDX.telefono, datos.telefono],
      [IDX.plazo, datos.plazoDias?.toString()],
      [IDX.observaciones, datos.observaciones],
    ];
    for (const [i, valor] of pares) {
      if (valor !== undefined) await campos.nth(i).fill(valor);
    }
  }

  async guardarModal(): Promise<void> {
    await this.page.getByRole('button', { name: 'Guardar' }).first().click();
    await this.page.waitForTimeout(3_500);
  }

  async crear(datos: DatosProveedor): Promise<void> {
    await this.abrirAlta();
    await this.completarModal(datos);
    await this.guardarModal();
  }

  /**
   * Da de baja un proveedor. Es baja lógica: el registro queda inactivo,
   * no se borra físicamente.
   */
  async eliminar(nombre: string): Promise<void> {
    const i = await this.indiceDe(nombre);
    if (i < 0) throw new Error(`No se encontró el proveedor "${nombre}"`);
    await this.page.getByRole('button', { name: 'Eliminar' }).nth(i).click();
    await this.page.waitForTimeout(2_000);

    // El diálogo no expone role=dialog: se lo ubica por el "Cancelar" que contiene.
    const dialogo = this.page.locator('div')
      .filter({ has: this.page.getByRole('button', { name: 'Cancelar' }) })
      .last();
    await dialogo.getByRole('button', { name: 'Eliminar' }).last().click();
    await this.page.waitForTimeout(3_500);
  }

  /**
   * Texto del diálogo de confirmación de baja, tras pulsar "Eliminar".
   *
   * Se ancla en el encabezado "Eliminar proveedor" y no en el botón "Cancelar":
   * filtrar por el botón devuelve la fila de acciones, no el cuerpo del aviso.
   */
  async textoConfirmacionBaja(nombre: string): Promise<string> {
    const i = await this.indiceDe(nombre);
    await this.page.getByRole('button', { name: 'Eliminar' }).nth(i).click();
    await this.page.waitForTimeout(2_000);
    const dialogo = this.page.locator('div').filter({ hasText: /Eliminar proveedor/ }).last();
    return (await dialogo.innerText()).replace(/\s+/g, ' ');
  }

  async cancelarDialogo(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cancelar' }).last().click();
    await this.page.waitForTimeout(1_500);
  }
}
