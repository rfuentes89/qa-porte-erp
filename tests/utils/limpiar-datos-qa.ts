/**
 * Neutraliza los presupuestos de prueba creados por la suite.
 *
 * El módulo no permite eliminar (OBS-08), así que los registros marcados con
 * el prefijo QA-TEST se pasan a estado "Cancelado" y se les reescribe la
 * descripción. Quedan pendientes de borrado a nivel de base de datos.
 *
 * Uso:  npx tsx tests/utils/limpiar-datos-qa.ts
 *   o:  npx playwright test tests/utils/limpiar-datos-qa.ts  (si se envuelve en un test)
 */
import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage';
import { PresupuestoFormPage } from '../pages/PresupuestoFormPage';
import { PresupuestosListPage } from '../pages/PresupuestosListPage';
import { credenciales } from '../support/perfiles';

dotenv.config();

const BASE_URL = process.env.PORTE_BASE_URL ?? 'https://porte-mvp.vercel.app';
const MARCA = process.argv[2] ?? 'QA-TEST';

async function main(): Promise<void> {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
  });
  const pagina = await contexto.newPage();
  pagina.on('dialog', (d) => void d.accept());

  await new LoginPage(pagina).ingresar(credenciales('ADMIN'));

  const lista = new PresupuestosListPage(pagina);
  const formulario = new PresupuestoFormPage(pagina);

  await lista.abrir();
  const pendientes = await lista.buscarPorMarca(MARCA);
  console.log(`Registros con la marca "${MARCA}": ${pendientes.length}`);

  for (const fila of pendientes) {
    if (fila.estado === 'Cancelado') {
      console.log(`  ${fila.id} ya estaba cancelado`);
      continue;
    }
    await formulario.abrirExistente(fila.id);
    await formulario.completar({
      descripcion: 'ANULAR - registro de prueba QA, sin validez',
      estado: 'Cancelado',
    });
    const resultado = await formulario.guardar();
    console.log(`  ${fila.id} (${fila.cliente}) -> ${resultado.guardo ? 'Cancelado' : 'NO SE PUDO GUARDAR'}`);
  }

  await lista.abrir();
  const finales = await lista.buscarPorMarca(MARCA);
  const vivos = finales.filter((f) => f.estado !== 'Cancelado');

  console.log(`\nEstado final: ${finales.length} registros QA, ${vivos.length} sin cancelar`);
  finales.forEach((f) => console.log(`  ${f.id}  ${f.estado}  ${f.cliente}`));
  if (finales.length > 0) {
    console.log('\nPendiente: eliminar estos registros a nivel de base de datos.');
  }

  await navegador.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
