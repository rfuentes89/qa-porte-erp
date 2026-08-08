# Reporte de ejecución — Ventas e Ingresos

**Fecha:** 2026-08-07
**Entorno:** MVP beta (autorización para crear/borrar)
**Perfiles:** `ADMIN` y `CARGA`
**Alcance:** módulos Ventas (solo lectura) e Ingresos (validaciones)

---

## Resumen

| Resultado | |
|---|---|
| Tests ejecutados | 6 |
| Pasan | 5 |
| Fallan | 1 (DEF-07) |
| Defecto nuevo | 1 (DEF-07) |

---

## DEF-07 — Se acepta un ingreso con monto negativo · Severidad **Alta**

Un ingreso registra dinero cobrado y actualiza el `TOTAL_COBRADO` de la venta y el saldo de caja. La interfaz aceptó un ingreso de **−500** imputado a una venta real.

**Reproducción**

1. `/ingresos/nuevo`.
2. Seleccionar una venta en el buscador.
3. Tipo `ANTICIPO`, monto `-500`.
4. *Guardar*.

**Resultado:** se guarda (navega fuera del formulario). El registro `IN-0010` quedó con `monto: -500`, `estado: Confirmado`, imputado a `PR-0593`.
**Esperado:** rechazo.

**Impacto.** Un cobro negativo reduce el total cobrado de la obra y la caja: permite "descobrar" dinero y desbalancear tanto la cuenta del cliente como las disponibilidades. Es el mismo patrón que DEF-02 (presupuestos) y confirma que **la validación de monto no existe ni en el frontend de ingresos ni en la base** (coherente con DEF-06).

**Atenuante parcial:** el caso "sin venta + monto 0" **sí** se rechaza, así que hay *alguna* validación en el formulario; falta específicamente la de signo/valor del monto.

**Nota de limpieza.** Los ingresos no tienen acción de editar ni eliminar en la interfaz, y —como los presupuestos— tampoco admiten `DELETE` por API. El registro se neutralizó por API (`activo=false`, `monto=0`). La suite hace esta limpieza automáticamente en un hook `afterAll` (`anularIngresosNegativos`). Verificado: 0 ingresos negativos tras la corrida.

---

## Ventas — solo lectura (sin defectos)

| Test | Caso | Resultado |
|---|---|---|
| El listado muestra ventas con id `PR-XXXX` | CU-VE-01 | ✅ |
| No se puede crear una venta manualmente | CU-VE-13 | ✅ |
| El detalle abre en solapas (Datos/Variac./Aprend.) sin edición de cobranzas | — | ✅ |
| El perfil de carga también ve el listado | CU-VE-01 (carga) | ✅ |

Se confirma RN-01: no hay alta manual de ventas; nacen de aceptar un presupuesto. Los estados operativos del MVP son de taller (Pendiente → Planificado → En fabricación → En montaje → Entregado → Cerrado), no de cobranza como en la documentación (divergencia D-08, ya registrada).

---

## Cobertura agregada

- `tests/pages/VentasPage.ts`, `tests/ventas.spec.ts` — 4 tests de solo lectura.
- `tests/pages/IngresoFormPage.ts`, `tests/ingresos.spec.ts` — 2 tests de validación, con limpieza por API.
- `tests/support/supabase.ts` — helper `anularIngresosNegativos`.

---

## Pendiente

- **Egresos:** mismo patrón esperado (validación de monto, flag de cheque diferido). No se cubrió aún; crear egresos también impacta caja, así que conviene el mismo esquema de limpieza por API.
- **Gastos fijos:** el alta no está en `/gastos-fijos/nuevo` (ruta inexistente); parece un botón de ícono en el listado. Falta relevar el flujo.
- **Ingresos — caso positivo (CU-IN-01/03/07):** verificar el impacto real en `TOTAL_COBRADO` y en caja exige crear un ingreso válido sobre una venta y luego revertirlo por API. Queda para una tanda dedicada, para no dejar movimientos espurios sobre ventas reales.
