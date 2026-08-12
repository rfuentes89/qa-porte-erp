# Adopción del scaffold "AI-Assisted Test Automation" — Tier 1

**Fecha:** 11 de agosto de 2026
**Base:** carpeta `Playwright-Scaffold-AI-Assisted-Development-Public/` (README + AI-WORKFLOWS.md)
**Alcance:** Tier 1 — mejoras de bajo riesgo, sin reestructurar carpetas ni reescribir tests.

---

## Qué es este scaffold y por qué Tier 1

El scaffold propone una forma disciplinada de escribir automatización con Playwright: convenciones estrictas (cero `any`, sin esperas fijas, sin XPath), un único lugar por cada valor (rutas, textos, datos), organización por dominios y un flujo de trabajo asistido por IA.

Adoptarlo entero implicaría reestructurar la suite (carpetas por dominio, factories, schemas). Eso es Tier 2/3. **Tier 1 toma solo lo que suma valor inmediato sin romper nada de lo que ya funciona:** clasificación de tests, guardrails de calidad y fuente única de textos.

---

## Lo que se hizo

### 1. Clasificación de tests por etiquetas (`@smoke` / `@regression` / `@destructive`)

Los 48 tests de la suite quedaron etiquetados con **una** categoría cada uno:

| Etiqueta | Qué agrupa | Cantidad |
|---|---|---|
| `@smoke` | Camino crítico de solo lectura (logins, listado de ventas) | 3 |
| `@regression` | Solo lectura no crítico (matriz de permisos, detalle de ventas, estabilidad de login) | 21 |
| `@destructive` | Todo lo que crea o modifica datos (presupuestos, proveedores, ingresos, egresos, gastos fijos, sondas RLS, BDD) | 24 |

Regla aplicada: **`@destructive` gana** — si un test escribe datos, se etiqueta así aunque también sea "de humo".

Nuevos scripts en `package.json`:

```bash
npm run test:smoke        # verificación rápida (3 tests, ~40s)
npm run test:regression   # solo lectura no crítico
npm run test:destructive  # los que escriben, en serie (--workers=1)
npm run test:readonly     # todo menos los destructivos
```

Verificado: `npm run test:smoke` corre los 3 tests correctos y pasa (~41s).

### 2. Guardrails de calidad — ESLint (flat) + Prettier

- **ESLint 9** con `typescript-eslint` y `eslint-plugin-playwright`.
- Reglas del scaffold activadas: **cero `any`** (`@typescript-eslint/no-explicit-any: error`) y **sin XPath** (`no-restricted-syntax` sobre `.locator('//...')`).
- **Prettier** con la config del proyecto (comillas simples, ancho 100).
- Scripts: `npm run lint`, `npm run lint:fix`, `npm run format`.

Resultado del primer `npm run lint`: **0 errores, 56 warnings**.

**Desviación documentada respecto del scaffold** (explicada en `eslint.config.mjs`): las reglas `no-wait-for-timeout` y `no-networkidle` están en **warning**, no en error. La app no expone señales de carga deterministas y tiene guardado optimista (ver OBS-12/13), por lo que algunas esperas fijas son legítimas hoy. El warning las mantiene visibles para ir reemplazándolas por aserciones web-first a medida que la app lo permita. Es deuda técnica **elegida y a la vista**, no oculta.

Los warnings restantes son de estilo del plugin de Playwright (orden de hooks, condicionales en tests usados para limpiar antes de fallar) y no bloquean.

### 3. Fuente única para textos de UI

Nuevo archivo `tests/support/textos.ts` con los mensajes de la aplicación que los tests verifican (por ejemplo, el cartel de acceso denegado y el aviso de baja lógica de proveedor) y las etiquetas de botones reutilizadas. Los specs ahora importan esas constantes en lugar de repetir la cadena suelta.

Beneficio concreto: si la app cambia un texto, se corrige en **un** lugar y no hay que cazar la cadena por varios archivos. Las rutas ya cumplían este rol en `perfiles.ts` (`RUTAS`).

---

## Lo que **no** se hizo (y por qué)

| No incluido | Motivo | Tier |
|---|---|---|
| Reorganizar `tests/` por dominios (`{area}/`) | Mover archivos rompe imports y no aporta valor con una suite de este tamaño | 2 |
| Factories de datos y schemas Zod | La suite valida sobre datos existentes; el valor aparece con APIs versionadas | 2/3 |
| Husky / pre-commit hooks | Útil, pero agrega fricción; se puede sumar cuando el equipo lo pida | 2 |
| Poner `no-wait-for-timeout` en error | Requiere que la app tenga señales de carga deterministas primero | 2 |

---

## Estado final

- **Typecheck:** limpio (`tsc --noEmit`).
- **Lint:** 0 errores.
- **Tags:** 48 tests clasificados; filtrado por tag verificado.
- **Suite:** sin cambios de comportamiento — los mismos tests, ahora ejecutables por categoría y con guardrails.

Tier 1 deja la base lista para que, si el equipo quiere, se avance a Tier 2 (organización por dominios y datos) sobre terreno ordenado.
