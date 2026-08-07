import type { Page, Locator } from '@playwright/test';
import type { Credenciales } from '../support/perfiles';

export class LoginPage {
  private readonly usuario: Locator;
  private readonly clave: Locator;
  private readonly enviar: Locator;

  constructor(private readonly page: Page) {
    this.usuario = page.locator('input[type=email], input[name*=mail i]').first();
    this.clave = page.locator('input[type=password]').first();
    this.enviar = page.locator('button[type=submit]').first();
  }

  async abrir(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'networkidle' });
  }

  /**
   * Inicia sesión y devuelve la ruta donde aterrizó la aplicación.
   *
   * La resolución del rol es asíncrona y la app puede redirigir más de una vez,
   * así que se espera a que la ruta se estabilice en lugar de leerla de inmediato.
   */
  async ingresar(cred: Credenciales): Promise<string> {
    await this.abrir();
    await this.usuario.fill(cred.usuario);
    await this.clave.fill(cred.clave);
    await this.enviar.click();
    return this.esperarRutaEstable();
  }

  /** Espera a que la ruta no cambie durante `estabilidadMs` y la devuelve. */
  private async esperarRutaEstable(estabilidadMs = 3_000, maximoMs = 20_000): Promise<string> {
    const inicio = Date.now();
    let anterior = this.ruta();
    let desde = Date.now();

    while (Date.now() - inicio < maximoMs) {
      await this.page.waitForTimeout(500);
      const actual = this.ruta();
      if (actual !== anterior) {
        anterior = actual;
        desde = Date.now();
      } else if (actual !== '/' && Date.now() - desde >= estabilidadMs) {
        return actual;
      }
    }
    return this.ruta();
  }

  private ruta(): string {
    return new URL(this.page.url()).pathname;
  }
}
