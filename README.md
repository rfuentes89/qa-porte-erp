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
| 3 | Casos de prueba ejecutables | ⛔ **Bloqueada** — ver *Entorno de pruebas* |
| 4 | Automatización con Playwright | ⏸️ Pendiente |
| 5 | Reporte de ejecución y defectos | ⏸️ Pendiente |

---

## Contenido

| Archivo | Descripción |
|---|---|
| [`CASOS_DE_USO_PORTE.md`](CASOS_DE_USO_PORTE.md) | Documento principal: 199 casos de uso (134 P0), reglas de negocio, matriz de permisos por perfil, escenario E2E maestro, divergencias y observaciones |
| [`scripts/`](scripts/) | Scripts de exploración (solo lectura) usados para relevar la aplicación |
| [`.env.example`](.env.example) | Plantilla de variables de entorno |

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
cp .env.example .env    # completar credenciales
npm install
node scripts/explore.js
```

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
