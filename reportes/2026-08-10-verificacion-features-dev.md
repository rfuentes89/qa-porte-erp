# Reporte de verificación — Funciones implementadas por el equipo

**Fecha:** 10 de agosto de 2026
**Entorno:** MVP beta
**Perfiles:** `ADMIN` y `CARGA`
**Alcance:** verificar las tres funciones que el equipo reportó como implementadas (#9 estado de obra por cobro, #5 nota de rentabilidad, #7 clientes como maestro).

---

## Resultado en una línea

| # | Función | Resultado |
|---|---|---|
| #9 | Estado de obra por cobro | ✅ **Funciona correctamente** |
| #5 | Nota de rentabilidad por obra | 🟡 **Funciona, pero con un problema de criterio** (DEF-10) |
| #7 | Clientes como maestro | ❌ **No funciona: falta la tabla en la base** (DEF-09) |

---

## #9 — Estado de obra por cobro · ✅ Correcto

`getEstadoCobro()` deriva el estado a partir de lo cobrado vs. la venta final, y se muestra como badge en el detalle de la obra (junto al estado de taller) y como columna "ESTADO DE COBRO" en el listado de Ventas.

**Verificado contra datos reales:**

| Obra | Venta final | Cobrado | Estado mostrado | ¿Correcto? |
|---|---|---|---|---|
| PR-0536 / PR-0593 | — | $0 | Pendiente de anticipo | ✅ |
| PR-0484 | 3.358.611 | 1.858.611 | Cobro parcial | ✅ |
| PR-0546 | 2.535.266 | 1.267.000 | Cobro parcial | ✅ |
| PR-0530 | 3.200.913 | 1.000.000 | Cobro parcial | ✅ |

Los estados "Pendiente de anticipo" y "Cobro parcial" se muestran correctamente. **No se pudo observar el estado "Cobrado"** porque hoy no hay ninguna obra cobrada al 100 %; la lógica es simétrica, así que se asume correcto, pero conviene confirmarlo con un caso real cuando exista.

---

## #5 — Nota de rentabilidad por obra · 🟡 DEF-10 · Severidad **Media**

`getRentabilidadRating()` funciona a nivel mecánico: muestra la nota (Buena/Regular/Mala) y cae a **"Sin datos"** cuando la obra no tiene egresos cargados (verificado en PR-0484 y PR-0593). Eso está bien.

**El problema es de criterio: la nota se calcula para obras que todavía están en ejecución, y da un resultado engañoso.**

**Caso concreto (PR-0546, ver captura):**

- Estado de la obra: **"En fabricación"** (no terminada).
- Costo estimado total: $2.533.000.
- Egresado real hasta ahora: **$620.000** (apenas el 24 % de lo estimado, porque la obra no terminó).
- Desvío: −$1.913.000, mostrado en **verde** como si fuera favorable.
- Nota: **"Buena"**.

La obra aparece como "Buena" rentabilidad **solo porque todavía no se gastó casi nada**, no porque sea rentable. El desvío en verde no es "gastó menos de lo previsto", es "todavía no gastó lo que falta". Todas las obras en curso con egresos parciales dan "Buena" por el mismo motivo.

**Esto coincide con lo que ya advertía la documentación de diseño (Documento 3):** el KPI de rentabilidad debe calcularse **solo para obras Entregadas o Cobradas**, excluyendo las que están En taller / En ejecución, precisamente para no sacar conclusiones prematuras.

**Recomendación:** mostrar la nota (o el costeo estimado vs. real) únicamente cuando la obra esté Entregada/Cerrada; en las demás, mostrar "En ejecución" o "Sin datos" en lugar de una nota que induce a error.

> **Sobre los umbrales:** el dev preguntó por los cortes (≤5 % Buena, ≤15 % Regular, >15 % Mala). Es una decisión de negocio aparte de este problema. Con los datos actuales no se pudo probar el caso "Mala" (ninguna obra sobre-ejecutó su costo), así que ese tramo queda sin verificar.

---

## #7 — Clientes como maestro · ❌ DEF-09 · Severidad **Alta**

La interfaz del módulo está desplegada: aparece "Clientes" en el menú, la ruta `/clientes` carga, y el modal de alta tiene los campos Nombre*, Contacto, Teléfono, Dirección y Observaciones.

**Pero la tabla `clientes` no existe en la base de datos del entorno.** La migración `0009_clientes.sql` se escribió pero **no se aplicó** a esta instancia.

**Evidencia:**

- Al guardar un cliente nuevo, el backend responde `404 — Could not find the table 'public.clientes' in the schema cache`.
- Una consulta directa a la API confirma: `GET clientes → 404`, mientras `GET proveedores → 200`.

**Doble problema:**

1. **El módulo no funciona:** no se puede crear ningún cliente.
2. **La falla es silenciosa:** al guardar, el modal **se cierra como si hubiera guardado**, sin ningún mensaje de error. El usuario cree que cargó el cliente y en realidad no se guardó nada. Es el mismo patrón de "guardado optimista" que ya vimos en otros módulos.

**Bloqueo de verificación:** como no se puede crear un cliente, **no se pudo comprobar si el módulo Clientes hereda los defectos de Proveedores** (DEF-05, el modal de edición que borra datos; DEF-04, el perfil de carga que puede eliminar). El dev dijo que Clientes está "calcado de Proveedores" y con "permisos iguales", así que es muy probable que ambos defectos estén replicados. **Hay que reverificar Clientes una vez aplicada la migración.**

---

## Qué hay que hacer

| Acción | Prioridad |
|---|---|
| **Aplicar la migración `0009_clientes.sql`** al entorno beta | Alta — el módulo no funciona sin esto |
| Al aplicarla, **reverificar DEF-05 y DEF-04 en Clientes** (probablemente heredados de Proveedores) | Alta |
| Mostrar un **error visible** cuando un guardado falla, en Clientes y en el resto (falla optimista) | Media |
| Restringir la **nota de rentabilidad** a obras Entregadas/Cobradas (DEF-10) | Media |
| Definir los **umbrales de la nota** (decisión de negocio pendiente) | Baja |

---

## Nota de método

Todos los hallazgos se verificaron contra la base de datos real, no solo por la interfaz. En particular, DEF-09 (tabla faltante) se confirmó por dos vías independientes: la respuesta 404 al guardar desde la interfaz y una consulta directa a la API. La nota "Buena" engañosa (DEF-10) se contrastó con los montos reales de costeo (estimado $2.533.000 vs. real $620.000).
