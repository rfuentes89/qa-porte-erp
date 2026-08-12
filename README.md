# QA — PORTE ERP

Análisis de calidad del MVP de **PORTE ERP**, un sistema de gestión comercial y financiera para una empresa metalúrgica.

**Aplicación bajo prueba:** https://porte-mvp.vercel.app/

---

## Estado del proyecto

| Etapa | Descripción | Estado |
|---|---|---|
| 0 | Análisis documental y catálogo de casos de uso | ✅ Completa |
| 1 | Validación de alcance del MVP | 🟡 Parcial — ver divergencias |
| 2 | Exploración con ambos perfiles y línea base de permisos | ✅ Completa |
| 3 | Casos de prueba ejecutables | ✅ Módulos transaccionales cubiertos |
| 4 | Automatización con Playwright | 🟢 Suite en TypeScript (POM) |
| 5 | Reporte de ejecución y defectos | 🟢 En curso |

**Cobertura por módulo:** Presupuestos, Ventas, Ingresos, Egresos, Proveedores y Gastos fijos ejecutados. Gastos fijos es el único sin defectos. Pendiente de aclarar el alcance de los módulos documentados que no existen en el MVP (Flujo de fondos, Caja y bancos, Cuentas de clientes).

### Defectos abiertos (tras la actualización del 2026-08-11)

Re-verificado el 2026-08-12: **8 defectos corregidos**, 2 abiertos. Ver [`reportes/2026-08-12-reverificacion-tras-actualizacion.md`](reportes/2026-08-12-reverificacion-tras-actualizacion.md).

| ID | Severidad | Descripción |
|---|---|---|
| **DEF-04** | Alta | El perfil de carga edita y da de baja proveedores |
| **DEF-10** | Media | La nota de rentabilidad se muestra para obras aún en ejecución (engañosa) |

**Corregidos:** DEF-01, DEF-02, DEF-03, DEF-05 (crítico), DEF-06, DEF-07, DEF-08, DEF-09. La corrección de raíz —validación en el backend (DEF-06)— resolvió toda la familia de montos imposibles.

**Novedad:** la actualización agregó un módulo **Asistente** (IA / carga por lenguaje natural), aún sin cobertura de tests.

**Seguridad (RLS Supabase):** la escalada de privilegios está bloqueada y `profiles` es de fila propia. Ver [`reportes/2026-08-07-seguridad-rls.md`](reportes/2026-08-07-seguridad-rls.md).

Detalle en [`reportes/`](reportes/).

---

## Contenido

| Archivo | Descripción |
|---|---|
| [`CASOS_DE_USO_PORTE.md`](CASOS_DE_USO_PORTE.md) | Documento principal: 199 casos de uso (134 P0), reglas de negocio, matriz de permisos por perfil, escenario E2E maestro, divergencias y observaciones |
| [`tests/`](tests/) | Suite automatizada en Playwright + TypeScript (Page Object Model) |
| [`reportes/`](reportes/) | Reportes de ejecución y defectos |
| [`.env.example`](.env.example) | Plantilla de variables de entorno |

### Estructura de la suite

```
tests/
├── pages/        Page Objects (LoginPage, PresupuestoFormPage, PresupuestosListPage)
├── support/      Fixtures tipadas, perfiles y matriz de rutas
├── utils/        Limpieza de datos de prueba
├── permisos.spec.ts       CU-RL — autenticación y permisos por perfil
└── presupuestos.spec.ts   CU-PR — alta y validaciones
```

---

## Perfiles

La aplicación tiene dos perfiles. La diferencia entre ambos es de **solo 2 rutas de 13**:

| Ruta | `ADMIN` | `CARGA` |
|---|---|---|
| `/dashboard` (tablero) | ✅ | 🔒 |
| `/config` (maestros) | ✅ | 🔒 |
| Las otras 11 rutas | ✅ | ✅ |

El bloqueo se aplica también por URL directa, no solo ocultando el menú.

---

## Hallazgos principales

**Divergencias documentación ↔ MVP (11 en total).** Las de mayor impacto:

- No existe el módulo de **Flujo de Fondos**, marcado en el roadmap como *"prioridad estratégica máxima"* (23 casos de uso sin pantalla).
- No existen **Caja y Bancos**, **Cuentas de Clientes** ni **Compras** como módulo propio.
- El **modelo económico** implementado difiere del especificado, lo que afecta el cálculo de KPI.
- Los estados operativos del MVP son **de taller**, no de cobranza como define la documentación.

**Observaciones de permisos:**

- **OBS-02 (alta):** el perfil de carga puede editar y eliminar proveedores, incluidos los que tienen saldo en cuenta corriente.
- **OBS-01 (media):** el bloqueo del tablero no protege información financiera, porque los mismos montos son accesibles desde las rutas que el perfil de carga sí puede ver.

Detalle completo en la §8 del documento principal.

---

## Entorno de pruebas

> ⛔ **El entorno relevado contiene datos reales de producción**, no datos de prueba.

Por esa razón toda la exploración fue de **solo lectura**: no se creó ni modificó ningún registro. Los casos de uso de creación, edición y borrado —la mayoría de los P0— no pueden ejecutarse en ese entorno sin contaminar información productiva.

Para desbloquear la Etapa 3 hace falta una de estas opciones:

1. Un entorno de QA separado con datos semilla *(preferible)*.
2. Autorización explícita para crear registros de prueba identificables, con procedimiento de limpieza acordado.
3. Acotar la ejecución a casos de solo lectura, aceptando una cobertura menor.

---

## Uso

```bash
cp .env.example .env          # completar credenciales
npm install
npx playwright install chromium

npm test                      # suite completa
npm run test:permisos         # solo permisos por perfil
npm run test:presupuestos     # solo presupuestos
npm run test:headed           # con navegador visible
npm run report                # abrir el reporte HTML
npm run typecheck             # verificación de tipos
```

### Limpieza de datos de prueba

La suite crea registros con el prefijo `QA-TEST` sobre un entorno con datos reales. Al terminar:

```bash
npx tsx tests/utils/limpiar-datos-qa.ts
```

Como el módulo de presupuestos no permite eliminar (OBS-08), los registros se neutralizan pasándolos a estado "Cancelado" y quedan listados en el reporte para su borrado en base de datos.

> `retries` está en 0 a propósito: DEF-03 falla el 50 % de las veces y con reintentos pasaría en el segundo intento, quedando oculto.

---

## Convenciones

- **Casos de uso:** `CU-XX-NN` (XX = módulo, NN = correlativo).
- **Prioridad:** P0 crítico · P1 importante · P2 deseable.
- **Tipo:** Positivo (camino feliz) · Negativo (validación) · Borde (límites).
- **Perfil:** `[A]` solo admin · `[A/U]` ambos · `[U]` solo carga.

---

## Privacidad

Este repositorio es público. En consecuencia:

- **No se versionan** las especificaciones funcionales internas (PDFs), los volcados crudos de exploración ni las capturas de pantalla.
- Los datos reales están **anonimizados** en todos los documentos: clientes, proveedores, nombres de cuentas, montos de producción y clasificaciones fiscales.
- Las credenciales se inyectan por variables de entorno y nunca se comitean.
