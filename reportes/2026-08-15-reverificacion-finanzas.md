# Re-verificación tras nueva actualización — el módulo Finanzas

**Fecha:** 15 de agosto de 2026
**Motivo:** el equipo avisó de cambios en UI y funcionalidades. Se re-verificaron los ítems que quedaban abiertos y se relevó lo nuevo.

---

## Titular: se construyó el bloque que faltaba (el más importante del diseño)

La actualización agregó un módulo **Finanzas** que cubre las dos pantallas de mayor prioridad que hasta ahora no existían: **Caja y bancos** y la **Proyección de flujo de fondos**. Además se corrigió la nota de rentabilidad prematura (DEF-10) y se mejoró el formulario de pagos.

---

## Lo nuevo: módulo Finanzas (`/finanzas`)

Reúne, en tres pestañas, el "corazón financiero" que el diseño describía:

### Pestaña "Caja" — es la vista de Caja y bancos (10_CAJA_BANCOS)

- **Saldo por cada cuenta** (Banco Macro, Efectivo Blanco, Efectivo Negro, MercadoPago) con saldo inicial, ingresos acreditados, pagos debitados y saldo actual.
- Indicadores arriba: **Caja disponible**, **Por acreditar**, **Compromisos del período** y **Disponible estimado**.
- **Deuda diferida**: cantidad de cheques, compromisos del período y gastos fijos próximos.

### Pestaña "Proyección" — es el Flujo de fondos (11_FLUJO_FONDOS)

Verificado: muestra una **línea de tiempo diaria** (del 19/08 al 18/09, ~30 días) con el saldo proyectado, y en particular:

- **Descalce proyectado: 18/09/2026** — la fecha en que la caja se vuelve negativa (el "punto de quiebre" que pedía el diseño).
- **Saldo mínimo proyectado: −$37.738.387**, con la "cobertura necesaria" para cubrirlo.
- **Compromisos próximos** con su fecha de vencimiento.

Esta es **la función que el Roadmap marcaba como de máxima prioridad** de todo el sistema, y hasta la revisión anterior no existía. Ahora está construida y funciona.

*(Pestaña "Flujo mensual": presente, no se relevó en detalle en esta pasada.)*

---

## Problemas que se resolvieron

| Ítem | Estado | Verificación |
|---|---|---|
| **DEF-10** — nota de rentabilidad prematura en obras en curso | ✅ **CORREGIDO** | El detalle de una obra "En fabricación" ya no muestra la nota "Buena". Ahora presenta **Coste Estimado vs Coste Real** como dos paneles de números, sin un juicio anticipado y engañoso. |
| **OBS-07** — el botón de crear presupuesto desaparecía con datos | ✅ **CORREGIDO** | `/presupuestos` tiene un botón "+" permanente en el encabezado que abre el alta, con datos y todo. |
| **Caja y bancos** (faltaba) | ✅ **Construido** | Pestaña "Caja" del módulo Finanzas. |
| **Flujo de fondos** (faltaba, máxima prioridad) | ✅ **Construido** | Pestaña "Proyección" del módulo Finanzas. |

También se **mejoró el formulario de Egresos**: el cheque dejó de ser una casilla suelta y ahora es parte de un selector de **Condición de pago** (Cheque, Cuenta corriente, Efectivo, Tarjeta, Transferencia), alineado con el diseño.

### Mejora importante: el cliente de un presupuesto ahora es un dato real, no texto libre

En el formulario de presupuestos, el campo **Cliente pasó de ser texto libre a un desplegable** que elige de la lista de clientes. Y el sistema lo **valida en el fondo**: al intentar crear un presupuesto con un cliente inexistente, el backend lo rechaza con el mensaje *"el cliente no existe, debe crearse antes"*. Esto corrige una debilidad que habíamos señalado (los clientes se cargaban sueltos, sin relación real) y evita presupuestos con clientes mal escritos o inexistentes.

### Corrección (2026-08-19): la validación de montos es SOLO del frontend

En la primera pasada se concluyó que "el backend rechaza montos inválidos". Al poner la suite al día se comprobó que **esa conclusión era incorrecta**: el rechazo (error 400) de aquel intento venía del **cliente vacío** (la nueva FK de cliente), no del monto.

Probando con un **cliente válido del maestro** y un `id` explícito, el backend **acepta** por API un presupuesto con **importe total 0** y con **costo negativo** (respuesta 201). Es decir:

- **La FK de cliente sí la aplica el backend** (rechaza clientes inexistentes) — mejora real y confirmada.
- **La validación de monto (> 0, sin negativos) vive solo en el frontend.** Si alguien saltea la interfaz (como hace la suite por API), esos datos entran. Esto es **DEF-06, que sigue abierto** a nivel de datos para el monto (la UI sí lo bloquea).

Queda cubierto por dos tests: `CU-RL-20a` (la FK de cliente se aplica) y `CU-RL-20b` (guarda que documenta que el backend hoy acepta el monto negativo; pasará a rojo cuando se agregue el `CHECK` de monto).

---

## Lo que todavía queda abierto

| Ítem | Estado | Detalle |
|---|---|---|
| **DEF-04** — el perfil de carga puede dar de baja proveedores | ❌ **Sigue** | Confirmado por la suite: el perfil de carga creó y **eliminó** un proveedor. El permiso de escritura sobre maestros no se restringió. |
| **OBS-17** — un presupuesto aceptado (PR-0584) no generó su venta | ❌ Sigue | Verificado: sigue sin aparecer en Ventas. |
| **Fechas en zona horaria equivocada** (OBS-10) | ❌ Sigue | Un presupuesto creado a las 22:02 (hora local) figura con fecha del día siguiente, porque el sistema usa la hora de referencia de Londres. |
| **El bloqueo de pantallas no protege datos** | ❌ Sigue / se agrava | **El perfil de carga puede abrir el nuevo módulo Finanzas** (lo ve en el menú y por URL directa). Ahora ese usuario ve la posición de caja completa de la empresa, la separación blanca/negra y la proyección de descalce. Si se quiere limitar quién ve esa información, hoy no se está limitando. |
| **El teléfono acepta letras** (OBS-16) | ⏸️ No re-verificado | Baja prioridad; no se volvió a probar en esta pasada. |
| **OBS-18 (nuevo)** — el perfil de carga ve todos los perfiles de usuario | ⚠️ Nuevo | La política de lectura de la tabla de usuarios se amplió: el perfil de carga ahora ve el nombre y el rol del administrador (antes solo veía su propia ficha). Es exposición de metadatos, no de contraseñas. Severidad baja/media. |

**Lo importante en seguridad sigue firme:** se re-verificó directamente que el perfil de carga **no puede elevarse a administrador** ni modificar la ficha de otro usuario (ambos intentos rechazados por el backend). El cambio de OBS-18 es solo de *lectura* (ve más de lo que debería), no de *escritura*.

---

## Impacto en la suite de tests

La actualización rediseñó dos formularios, lo que **rompió tests por selectores viejos** (no son defectos del producto):

- **Egresos:** el cheque pasó de casilla a botón dentro de "Condición de pago" → rompió CU-EG-07.
- **Presupuestos:** el cliente pasó de texto libre a desplegable → rompieron los tests de alta y validación de presupuestos (CU-PR-01/03/04/05). **Ojo:** esto NO significa que DEF-01/DEF-02 hayan regresado — se verificó por API que el backend sigue rechazando los datos inválidos. Los tests fallan solo porque intentan tipear en un campo que ahora es un desplegable.

**Pendiente de mantenimiento:** actualizar los Page Objects de Egresos y Presupuestos a los nuevos formularios, y sumar cobertura para el módulo Finanzas (Caja y Proyección) y el nuevo desplegable de cliente.

---

## Balance

El proyecto dio un salto muy importante: con Finanzas se construyó la parte **analítica y de proyección** que el diseño considera central, y que era el mayor faltante. Sumado a las correcciones de las revisiones anteriores, hoy PORTE cubre el ciclo completo —cotizar, vender, cobrar, pagar— **y además proyectar la liquidez**.

Lo que queda es afinar **permisos** (quién puede dar de baja maestros y quién puede ver la información financiera sensible) y detalles menores (zona horaria de las fechas, formato del teléfono, un caso puntual de presupuesto sin venta).
