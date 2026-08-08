# Reporte de ejecución — Gastos fijos

**Fecha:** 8 de agosto de 2026
**Entorno:** MVP beta (autorización para crear/borrar)
**Perfil:** `ADMIN`
**Alcance:** módulo Gastos fijos — alta y validaciones

---

## Resumen

| Resultado | |
|---|---|
| Tests ejecutados | 2 |
| Pasan | 2 |
| Fallan | 0 |
| Defectos nuevos | **0** |

**Gastos fijos es el módulo transaccional que mejor funciona.** No se encontraron defectos y, a diferencia del resto, valida los campos obligatorios y permite editar y eliminar.

---

## Lo que funciona bien

| Comportamiento | Detalle |
|---|---|
| **Alta válida persiste** | Con concepto, fecha, categoría y monto previsto, el gasto se guarda (POST 201) y aparece en el listado. |
| **Concepto obligatorio** | Sin concepto, el alta no se guarda: el modal permanece abierto. |
| **Categoría obligatoria** | Sin categoría seleccionada, el alta tampoco persiste (el modal cierra pero no crea el registro). |
| **Editar y Eliminar disponibles** | Cada gasto ofrece ambas acciones, a diferencia de presupuestos, ingresos y egresos, que no permiten corregir ni borrar. |

Este módulo demuestra que **el patrón de validación de las demás pantallas (DEF-01, DEF-07, DEF-08) es corregible**: aquí sí se exigen los datos mínimos antes de guardar.

---

## Observación

### OBS-15 — Datos de gastos fijos aparentemente duplicados · Severidad **Baja / a confirmar**

Al revisar los datos existentes, cada gasto fijo figura **dos veces** con los mismos valores (por ejemplo, "Alquiler taller / 500.000 / Pagado" aparece repetido; lo mismo con Sueldos, Luz e Internet). No sabemos si es una carga de datos de prueba hecha dos veces, o una duplicación real al guardar.

**Cómo confirmarlo:** cargar un gasto nuevo y verificar si queda una sola vez (así fue en nuestras pruebas: el gasto de prueba se creó una sola vez, lo que apunta a que la duplicación es de los datos semilla y no del alta). **Requiere una revisión rápida del equipo** antes de descartarlo.

---

## Cobertura agregada

- `tests/pages/GastosFijosPage.ts`, `tests/gastos-fijos.spec.ts` — 2 tests.
- `tests/support/supabase.ts` — helper `anularGastosFijosDePrueba`.

---

## Nota de método (un falso camino que conviene registrar)

Durante la automatización, un intento de guardar "se veía" exitoso (el modal se cerraba) pero el gasto no aparecía en la base. La causa **no era un defecto del producto**, sino dos artefactos de la herramienta de prueba:

1. El botón "Guardar" del modal quedaba fuera de la ventana; un "click forzado" cerraba el modal **sin** guardar. Se resolvió agrandando la ventana del navegador de prueba.
2. Faltaba seleccionar la **categoría**, que es obligatoria. Con todos los campos completos, el guardado funciona (POST 201).

Es el mismo aprendizaje de sesiones anteriores: un "guardado que no guarda nada" casi siempre es un problema de la automatización, no de la aplicación. Se verificó siempre contra la base de datos antes de concluir.

---

## Cierre de la cobertura por módulos

Con Gastos fijos queda revisada la carga en todos los módulos transaccionales:

| Módulo | Estado |
|---|---|
| Presupuestos | DEF-01, DEF-02 |
| Ventas (solo lectura) | sin defectos |
| Ingresos | DEF-07 |
| Egresos | DEF-08 |
| Proveedores | DEF-04, DEF-05 |
| **Gastos fijos** | **sin defectos** |

Módulos documentados pero inexistentes en el MVP (Flujo de fondos, Caja y bancos, Cuentas de clientes, KPI/Tablero como tales): pendientes de aclaración de alcance con el equipo.
