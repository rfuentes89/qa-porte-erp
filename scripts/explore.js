/**
 * Exploración de solo lectura del MVP de PORTE.
 *
 * Releva, para cada perfil: home tras login, menú disponible, y qué rutas
 * responden o redirigen a /unauthorized. NO crea ni modifica registros.
 *
 * Uso:  node scripts/explore.js
 * Requiere las variables de .env.example en el entorno.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTE_BASE_URL || 'https://porte-mvp.vercel.app';

const PERFILES = [
  { rol: 'ADMIN', user: process.env.PORTE_ADMIN_USER, pass: process.env.PORTE_ADMIN_PASS },
  { rol: 'CARGA', user: process.env.PORTE_CARGA_USER, pass: process.env.PORTE_CARGA_PASS },
];

const RUTAS = ['/dashboard', '/carga', '/presupuestos', '/ventas', '/ingresos', '/egresos',
  '/proveedores', '/gastos-fijos', '/variaciones', '/aprendizajes', '/mis-registros',
  '/profile', '/config'];

/** Inventario del DOM visible: encabezados, botones, campos y tablas. */
async function snap(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const txt = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return {
      path: location.pathname,
      encabezados: [...document.querySelectorAll('h1,h2,h3')].filter(vis).map(txt).filter(Boolean).slice(0, 10),
      botones: [...document.querySelectorAll('button,[role=button]')].filter(vis).map(txt).filter(Boolean),
      campos: [...document.querySelectorAll('input,select,textarea')].filter(vis).map(i =>
        `${i.tagName.toLowerCase()}[${i.type || ''}] ph="${i.placeholder || ''}" ro=${i.readOnly} dis=${i.disabled}`),
      encabezadosTabla: [...document.querySelectorAll('table')].filter(vis).map(t =>
        [...t.querySelectorAll('th')].map(th => txt(th)).join(' | ')),
    };
  });
}

async function login(page, user, pass) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('input[type=email], input[name*=mail i]').first().fill(user);
  await page.locator('input[type=password]').first().fill(pass);
  await page.locator('button[type=submit]').first().click();

  // La resolución del rol es asíncrona: se observa la secuencia de redirecciones.
  const traza = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    const p = page.url().replace(BASE, '');
    if (traza[traza.length - 1] !== p) traza.push(p);
  }
  return traza;
}

(async () => {
  const faltantes = PERFILES.filter(p => !p.user || !p.pass).map(p => p.rol);
  if (faltantes.length) {
    console.error(`Faltan credenciales para: ${faltantes.join(', ')}. Ver .env.example`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const salida = {};

  for (const { rol, user, pass } of PERFILES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    const traza = await login(page, user, pass);
    const home = await snap(page);
    console.log(`\n########## ${rol} ##########`);
    console.log(`Traza post-login: ${JSON.stringify(traza)}`);
    console.log(`Menú: ${JSON.stringify(home.botones)}`);

    salida[rol] = { traza, home, rutas: {} };

    for (const ruta of RUTAS) {
      try {
        await page.goto(BASE + ruta, { waitUntil: 'networkidle', timeout: 25000 });
        await page.waitForTimeout(2500);
        const s = await snap(page);
        const permitido = s.path === ruta;
        salida[rol].rutas[ruta] = { ...s, permitido };
        console.log(`[${rol}] ${ruta} -> ${s.path} ${permitido ? 'PERMITIDO' : '*** BLOQUEADO ***'}`);
      } catch (e) {
        console.log(`[${rol}] ${ruta}: ERROR ${e.message.slice(0, 120)}`);
      }
    }
    await ctx.close();
  }

  // El volcado va a raw/, ignorado por git: contiene datos de producción.
  fs.mkdirSync('raw', { recursive: true });
  fs.writeFileSync(path.join('raw', 'exploracion.json'), JSON.stringify(salida, null, 1));
  console.log('\nVolcado en raw/exploracion.json (no versionado)');

  await browser.close();
})();
