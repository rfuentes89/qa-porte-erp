# Trazabilidad contra el Roadmap — bloque por bloque

**Fecha:** 10 de agosto de 2026
**Base:** Roadmap de Implementación PORTE v1.3 (Documento 2: diseño lógico de pestañas)
**Método:** para cada pestaña del roadmap se verificó (a) si existe la ruta/módulo y (b) si su función clave se ejecuta. Los `EXISTE` se confirmaron abriendo la ruta; los cálculos, contra la base de datos real.

---

## Resumen

| Bloque | Pestañas | Existen | Parciales | No existen |
|---|---|---|---|---|
| 1 · Maestras | 3 | 2 | 1 (Clientes: UI sí, guardado no) | — |
| 2 · Comercial y operativo | 2 | 2 | — | — |
| 3 · Transaccional | 4 | 3 | — | 1 (Compras) |
| 4 · Control y analítica | 6 | 1 | 2 | 3 |
| **Total** | **15** | **8** | **3** | **4** |

**Lo más relevante:** el núcleo operativo (cotizar → vender → cobrar → pagar → gasto fijo) **existe y funciona**, con los defectos de validación ya reportados. El bloque de **Control y Analítica está mayormente ausente** — incluida la proyección de flujo de fondos, que el roadmap marca como prioridad máxima.

---

## Bloque 1 · Maestras

| Pestaña | Ruta | Estado | Verificación |
|---|---|---|---|
| **00_CONFIG** | `/config` | ✅ Existe | Muestra todas las listas maestras (categorías, estados, cuentas, tipos de caja/ingreso/egreso). |
| **0A_CLIENTES** | `/clientes` | ⚠️ UI sí, **no funciona** | La pantalla está, pero la tabla no existe en la base: crear un cliente falla en silencio (**DEF-09**). |
| **04_PROVEEDORES** | `/proveedores` | ✅ Existe | Lista con **SALDO CC calculado** por proveedor (verificado). Arrastra **DEF-04** (carga puede borrar), **DEF-05** (editar borra datos), **OBS-16** (teléfono acepta letras). |

---

## Bloque 2 · Flujo Comercial y Operativo

| Pestaña | Ruta | Estado | Verificación |
|---|---|---|---|
| **01_PRESUPUESTOS** | `/presupuestos` | ✅ Existe | Genera la llave **PR-XXXX**, registra costeo estimado. Defectos: **DEF-01** (importe 0), **DEF-02** (negativos), **OBS-07/08/09**. |
| **02_VENTAS** | `/ventas` | ✅ Existe | **Automatización confirmada.** |

**Verificación de la automatización Presupuesto → Venta (Flujo Operativo A del roadmap):**

Se comprobó contra la base que **Ventas = presupuestos en estado "Aceptado"**:

| Estado del presupuesto | Total | Aparecen como Venta |
|---|---|---|
| Aceptado | 10 | **9** |
| Pedido / Enviado / En negociación / Cancelado / Rechazado / etc. | 27 | **0** |

Ninguna venta proviene de un presupuesto no aceptado, y al aceptar un presupuesto pasa a ser venta automáticamente. **La automatización funciona.** (Implementada como una vista sobre los presupuestos aceptados, no como copia de fila — más robusto que el diseño original.)

- ✅ El **estado de cobro** (#9) se calcula bien sobre la venta (verificado por separado).

> **OBS-17 · Baja/Media · a investigar:** 1 de los 10 presupuestos aceptados (**PR-0584**, cliente FERNANDEZ LORENA, activo, monto 130.000) **no aparece en Ventas**, sin una diferencia de datos evidente respecto de los que sí aparecen. Conviene que el equipo revise por qué ese caso quedó afuera.

---

## Bloque 3 · Flujo Transaccional (Diario de Caja)

| Pestaña | Ruta | Estado | Verificación |
|---|---|---|---|
| **03_COMPRAS** | — | ❌ **No existe** | No hay módulo de Compras (`/compras` → 404). Está absorbido dentro de Egresos, y **no se ve el estado de cada compra** (Pendiente/Parcial/Pagada) ni el circuito de cuenta corriente que describe el roadmap. |
| **05_INGRESOS** | `/ingresos` | ✅ Existe | Registra cobros, actualiza el total cobrado de la venta y la caja. Defecto **DEF-07** (acepta monto negativo). |
| **06_EGRESOS** | `/egresos` | ✅ Existe | Registra pagos. **Cheque diferido con fecha de acreditación: funciona** (verificado). Defecto **DEF-08** (acepta negativos y huérfanos). |
| **07_GASTOS_FIJOS** | `/gastos-fijos` | ✅ Existe | Previsión mensual con monto previsto/real. **Sin defectos.** OBS-15 (posible duplicado de datos semilla, a confirmar). |

---

## Bloque 4 · Control y Analítica (Solo Lectura)

| Pestaña | Ruta | Estado | Verificación |
|---|---|---|---|
| **08_CUENTAS_CLIENTES** | — | ❌ **No existe** | No hay vista de saldos y días sin cobro por cliente (`/cuentas-clientes` → 404). Parcialmente suplido: la venta tiene estado de cobro y días de mora. |
| **09_CUENTAS_PROVEEDORES** | — | 🟡 **Parcial** | No hay vista propia (404). Pero `/proveedores` muestra el **saldo de cuenta corriente** por proveedor, y el tablero muestra "cheques por vencer". Falta el detalle de cheques pendientes por proveedor. |
| **10_CAJA_BANCOS** | — | ❌ **No existe** | No hay vista de disponibilidades por cuenta (`/caja-bancos` → 404). |
| **11_FLUJO_FONDOS** | — | ❌ **No existe** | No hay proyección de liquidez a 30/60/90 días (`/flujo-fondos` → 404). **Es la función que el roadmap marca como prioridad máxima.** |
| **12_KPI_OBRAS** | — | 🟡 **Parcial** | No hay módulo KPI propio (`/kpi` → 404), pero el detalle de cada obra tiene el panel **"Costeo estimado vs. real" con nota de rentabilidad** (#5, con **DEF-10**), y existen las pantallas **Variaciones** y **Aprendizajes**. |
| **13_TABLERO** | `/dashboard` | 🟡 **Parcial** | Existe la pantalla de Inicio con **Ventas activas, Total a cobrar, Cobrado del mes, Cheques por vencer**. **Faltan** los indicadores gerenciales que pide el roadmap: **tasa de conversión, liquidez y márgenes de rentabilidad** (verificado: no aparecen). |

---

## Conclusión

- **El núcleo operativo del roadmap (Bloques 1-3) está construido y funciona**, con la salvedad de Clientes (DEF-09) y de Compras como registro separado (ausente). Los defectos de validación ya están reportados.
- **La automatización central "Presupuesto Aceptado → Venta" funciona** (verificada por datos), con una excepción puntual a revisar (OBS-17).
- **El Bloque 4 (Control y Analítica) es el gran pendiente:** de 6 vistas, 3 no existen (incluida la de máxima prioridad, Flujo de Fondos), 2 están parciales y el Tablero es una versión reducida sin los indicadores gerenciales.

Esto es coherente con lo ya señalado en el informe ejecutivo: hoy el sistema **registra y controla la operación diaria**, pero todavía no **proyecta** (flujo de fondos) ni **consolida** (tablero gerencial) como estaba diseñado. Conviene confirmar con el equipo si el Bloque 4 es un recorte intencional del beta o trabajo pendiente.
