import { test, expect } from './support/fixtures';
import {
  credenciales, RUTAS, RUTAS_SOLO_ADMIN, RUTAS_COMPARTIDAS, RUTA_SIN_PERMISO,
} from './support/perfiles';

const ruta = (url: string): string => new URL(url).pathname;

test.describe('CU-RL — Autenticación y permisos', () => {
  test('CU-RL-01 · el administrador ingresa y aterriza en el tablero', async ({ ingresarComo }) => {
    expect(await ingresarComo('ADMIN')).toBe(RUTAS.dashboard);
  });

  test('CU-RL-02 · el perfil de carga ingresa y aterriza en su pantalla de carga', async ({ ingresarComo }) => {
    expect(await ingresarComo('CARGA')).toBe(RUTAS.carga);
  });

  test('CU-RL-03 · se rechazan credenciales inválidas', async ({ page, login }) => {
    const cred = credenciales('ADMIN');
    const destino = await login.ingresar({ ...cred, clave: 'clave-incorrecta-qa' });

    expect(destino, 'no debe conceder acceso con una clave incorrecta').not.toBe(RUTAS.dashboard);
    await expect(page.locator('input[type=password]')).toBeVisible();
  });

  test('CU-RL-04 · sin sesión no se accede a una ruta interna', async ({ page }) => {
    await page.goto(RUTAS.ventas, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2_000);

    expect(ruta(page.url()), 'debe redirigir fuera de la ruta protegida').not.toBe(RUTAS.ventas);
  });
});

test.describe('CU-RL-19 — El bloqueo se aplica por URL directa, no solo ocultando el menú', () => {
  for (const rutaAdmin of RUTAS_SOLO_ADMIN) {
    test(`el perfil de carga no accede a ${rutaAdmin}`, async ({ page, ingresarComo }) => {
      await ingresarComo('CARGA');
      await page.goto(rutaAdmin, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_500);

      expect(ruta(page.url())).toBe(RUTA_SIN_PERMISO);
      await expect(page.getByText('No tenés permisos para ver esta página')).toBeVisible();
    });
  }

  for (const rutaAdmin of RUTAS_SOLO_ADMIN) {
    test(`el administrador sí accede a ${rutaAdmin}`, async ({ page, ingresarComo }) => {
      await ingresarComo('ADMIN');
      await page.goto(rutaAdmin, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_500);

      expect(ruta(page.url())).toBe(rutaAdmin);
    });
  }
});

test.describe('Rutas compartidas — deben responder igual para ambos perfiles', () => {
  for (const rutaComun of RUTAS_COMPARTIDAS) {
    test(`el perfil de carga accede a ${rutaComun}`, async ({ page, ingresarComo }) => {
      await ingresarComo('CARGA');
      await page.goto(rutaComun, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_500);

      expect(ruta(page.url())).toBe(rutaComun);
    });
  }
});

/**
 * DEF-03 — Reproducción dirigida.
 *
 * En la corrida del 2026-08-06, 4 de 8 logins del perfil de carga terminaron
 * en /unauthorized. Este test repite el login varias veces y exige que TODOS
 * aterricen en la home del perfil: una sola desviación lo hace fallar.
 */
test.describe('DEF-03 — Estabilidad del login', () => {
  const INTENTOS = 6;

  test(`el perfil de carga aterriza en su home en ${INTENTOS} logins consecutivos`, async ({ browser }) => {
    test.slow();
    const cred = credenciales('CARGA');
    const aterrizajes: string[] = [];

    for (let i = 0; i < INTENTOS; i++) {
      const contexto = await browser.newContext();
      const pagina = await contexto.newPage();
      const { LoginPage } = await import('./pages/LoginPage');
      aterrizajes.push(await new LoginPage(pagina).ingresar(cred));
      await contexto.close();
    }

    const fallidos = aterrizajes.filter((r) => r !== cred.home);
    expect(
      fallidos,
      `${fallidos.length}/${INTENTOS} logins no llegaron a ${cred.home}. Aterrizajes: ${aterrizajes.join(', ')}`,
    ).toHaveLength(0);
  });
});
