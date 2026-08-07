# PORTE ERP v1.0 — Catálogo de Casos de Uso (base para QA)

**Proyecto:** PORTE ERP V1.0
**URL bajo prueba:** https://porte-mvp.vercel.app/
**Fuentes:** Documento 1 (Arquitectura + Diccionario de Datos), Documento 2 (Sprints 1-3), Documento 3 (Sprints 4-7), Correcciones R1, Roadmap & Arquitectura v1.3
**Fecha:** 2026-08-06
**Estado:** Casos de uso derivados de documentación — pendiente de validación contra el MVP real

---

## 0. Observación previa (riesgo de alcance)

La documentación describe el sistema como **Google Sheets + Apps Script** (hojas `00_CONFIG` … `99_LOGS`, triggers `onEdit()`, funciones `.gs`).
La URL entregada es un **MVP web desplegado en Vercel**.

Por eso este catálogo está escrito a **nivel funcional/de negocio** (qué debe hacer el sistema), no a nivel de implementación de hojas. Cada caso de uso es válido tanto si la UI es una hoja de cálculo como si es una pantalla web. La correspondencia "CU → pantalla real" se completa en la Etapa 2 de la ruta de QA (exploración del MVP).

**Convención de identificadores:**
- `CU-XX-NN` → Caso de uso (XX = módulo, NN = correlativo)
- Prioridad: **P0** (crítico, bloquea el flujo de negocio) / **P1** (importante) / **P2** (deseable)
- Tipo: **Positivo** (camino feliz) / **Negativo** (validación) / **Borde** (límites y estados raros)

---

## 1. Actores y perfiles

### 1.1 Actores documentados (modelo de negocio)

| Actor | Descripción | Alcance |
|---|---|---|
| **Administración** | Carga diaria de ingresos, egresos, compras. Define `FECHA_COBRO_ESTIMADA` y `TIPO_CAJA_PREVISTO`. | Módulos 00-07 |
| **Comercial** | Carga y gestiona presupuestos, cambia `ESTADO_COMERCIAL`. | 01_PRESUPUESTOS |
| **Dirección (Dirección)** | Consume tablero, KPI y flujo de fondos. Único autorizado a modificar `00_CONFIG`. | 00, 11, 12, 13 |
| **Sistema (backend / Apps Script)** | Ejecuta triggers, sincronizaciones, cálculos y logs. | Todos |

### 1.2 Perfiles reales del MVP (los que se prueban)

El MVP implementa **dos perfiles**. La correspondencia con los actores documentados es la siguiente:

| Perfil | Código | Usuario | Rol en la UI | Home tras login |
|---|---|---|---|---|
| **Administrador** | `ADMIN` | `$PORTE_ADMIN_USER` | "Administrador" | `/dashboard` |
| **Carga de datos** | `CARGA` | `$PORTE_CARGA_USER` | "Carga de datos" | `/carga` |

> Las credenciales de ambos perfiles se inyectan por variables de entorno (ver `.env.example`). **No se versionan.**

**✅ Línea base de permisos CONFIRMADA** por exploración del 2026-08-06 (CU-RL-07 a CU-RL-11 ejecutados). El perfil no-admin es de **carga operativa**, no de solo consulta.

| Ruta | Módulo | `ADMIN` | `CARGA` |
|---|---|---|---|
| `/dashboard` | Inicio (tablero) | ✅ | 🔒 **Bloqueado** → `/unauthorized` |
| `/config` | Configuración (maestros) | ✅ | 🔒 **Bloqueado** → `/unauthorized` |
| `/carga` | Carga rápida | ✅ | ✅ (es su home) |
| `/presupuestos` | Presupuestos | ✅ | ✅ |
| `/ventas` | Ventas | ✅ | ✅ |
| `/ingresos` | Ingresos | ✅ | ✅ |
| `/egresos` | Egresos | ✅ | ✅ |
| `/proveedores` | Proveedores | ✅ | ✅ |
| `/gastos-fijos` | Gastos fijos | ✅ | ✅ |
| `/variaciones` | Variaciones | ✅ | ✅ |
| `/aprendizajes` | Aprendizajes | ✅ | ✅ |
| `/mis-registros` | Registros | ✅ | ✅ |
| `/profile` | Perfil | ✅ | ✅ |

**La diferencia entre perfiles es de solo 2 rutas.** El bloqueo funciona también por URL directa (no es solo ocultamiento de menú): `CARGA` es redirigido a `/unauthorized` con el mensaje "🔒 Acceso denegado — No tenés permisos para ver esta página".

Diferencias en el menú lateral: `ADMIN` muestra la sección **Administración → Configuración**; `CARGA` muestra **Carga de datos** y no expone el enlace a Configuración. El resto del menú (Módulos y Accesos) es idéntico.

> ⚠️ **Ver §8.3 (OBS-01):** `CARGA` tiene bloqueado el tablero pero acceso completo a `/ventas`, `/proveedores`, `/ingresos` y `/egresos`, que exponen los mismos montos que el tablero agrega. La restricción es cosmética en términos de confidencialidad.

**Notación usada en el catálogo:**

| Marca | Significado |
|---|---|
| `[A]` | Solo Administrador |
| `[A/U]` | Ambos perfiles (la funcionalidad debe comportarse igual) |
| `[U]` | Solo No administrador |
| `[?]` | Perfil aplicable **sin determinar** — se define tras la exploración |

---

## 1-bis. Separación de casos de uso por perfil

### A. Casos exclusivos de Administrador `[A]`

Funcionalidades que, por la documentación, corresponden a Dirección o a gobernanza del sistema. Cada uno genera **automáticamente un caso negativo espejo** para `USER` (ver §3.16).

| CU | Descripción | Fundamento |
|---|---|---|
| CU-MA-01, CU-MA-02, CU-MA-03 | Ver y modificar `00_CONFIG` (categorías, estados, responsables, cuentas) | Roadmap v1.3: "Solo Dirección modifica manualmente esta tabla" |
| CU-TB-01 … CU-TB-17 | Tablero gerencial completo | Doc 3: "para la dirección de Dirección" |
| CU-KP-14 | Ejecutar el botón "Auditar Obras" (`reconstruirKPI()`) | Acción de reconstrucción de datos |
| CU-FF-21 | Ejecutar el botón "Actualizar Proyección" (`reconstruirFlujoFondos()`) | Acción de reconstrucción de datos |
| CU-LG-01 … CU-LG-09 | Consultar `99_LOGS` y ejecutar auditorías/sincronizaciones | Módulo de auditoría del sistema |
| CU-RL-01 … CU-RL-06 | Gestión de usuarios y permisos | Suite nueva (§3.16) |

### B. Casos compartidos por ambos perfiles `[A/U]` — **confirmado**

Todo el bloque transaccional y de consulta es accesible por los dos perfiles. Se ejecutan **dos veces**, una por perfil, verificando que el comportamiento sea idéntico.

| Bloque | CU | Pantalla real |
|---|---|---|
| Proveedores | CU-MA-08 … CU-MA-10 | `/proveedores` (con Editar y Eliminar disponibles para ambos) |
| Presupuestos | CU-PR-01 … CU-PR-15 | `/presupuestos` |
| Ventas | CU-VE-01 … CU-VE-13 | `/ventas` |
| Ingresos | CU-IN-01 … CU-IN-10 | `/ingresos` |
| Egresos | CU-EG-01 … CU-EG-11 | `/egresos` |
| Gastos fijos | CU-GF-01 … CU-GF-05 | `/gastos-fijos` |
| Cuentas de proveedores | CU-CP-01 … CU-CP-07 | `/proveedores` (campo SALDO CC) |
| KPI / desvíos | CU-KP-01 … CU-KP-17 | `/variaciones` y `/aprendizajes` (parcial — ver §8.2) |
| Transversales web | CU-TR-01 … CU-TR-10 | Todas |

> **Hallazgo crítico:** `CARGA` puede crear presupuestos y, por lo tanto, potencialmente cambiar `ESTADO_COMERCIAL` a "Aceptado" —el disparador que genera la venta— y también **editar y eliminar proveedores**. Ver OBS-02.

### C. Casos sin pantalla en el MVP

Módulos documentados que **no existen** en la aplicación. Sus CU quedan suspendidos hasta que se confirme si están fuera de alcance del MVP (ver §8.2).

| Bloque | CU | Estado |
|---|---|---|
| `00_CONFIG` como CU de maestros | CU-MA-01 … CU-MA-03 | Reasignado a `/config` `[A]` |
| Clientes (maestro `0A`) | CU-MA-04 … CU-MA-07 | **Sin módulo propio** |
| Compras (`03`) | CU-CO-01 … CU-CO-14 | **Sin módulo propio** — aparentemente absorbido por `/egresos` |
| Cuentas de clientes (`08`) | CU-CC-01 … CU-CC-08 | **Sin pantalla** |
| Caja y bancos (`10`) | CU-CB-01 … CU-CB-08 | **Sin pantalla** |
| Flujo de fondos (`11`) | CU-FF-01 … CU-FF-23 | **Sin pantalla** — 23 CU, incluida la "prioridad estratégica máxima" del Roadmap |
| Logs (`99`) | CU-LG-01 … CU-LG-09 | `/mis-registros` es un historial de carga por usuario, no un log de auditoría del sistema |

### D. Impacto en el conteo

| Perfil | Casos a ejecutar |
|---|---|
| `ADMIN` | Los aplicables del catálogo + 5 de autenticación |
| `CARGA` | Los mismos casos compartidos + 5 de autenticación + 11 negativos de permisos (§3.16), acotados a `/dashboard` y `/config` |

---

## 2. Reglas de negocio transversales (a verificar en todo CU)

| ID | Regla | Origen |
|---|---|---|
| RN-01 | Todo comienza en un presupuesto. Toda venta proviene de un presupuesto. | Doc 1 §5 |
| RN-02 | El ID `PR-XXXX` es la llave universal y se conserva de Presupuesto → Venta → Compras → Ingresos → Egresos → KPI. | Doc 1 §5 / Roadmap |
| RN-03 | Todo ingreso se imputa a una obra (`ID_OBRA`). | Doc 1 §5 |
| RN-04 | Todo egreso se asocia a una compra (`ID_COMPRA`) **o** directamente a una obra (`ID_OBRA`). | Doc 1 §5 |
| RN-05 | Toda operación pertenece a una categoría económica: COSTO MAT, COSTO M.O., IND. VENDIDOS, IMPUESTOS, COMERCIAL. BENEFICIO **no** es categoría de costo. | Doc 1 §3 |
| RN-06 | Módulos 00-07 son editables. Módulos 08-13 son **solo lectura** (generados por fórmula/script). Edición manual prohibida. | Doc 1 §8 / Doc 2 |
| RN-07 | Toda operación relevante y todo error se registra en `99_LOGS` con formato `[TIMESTAMP] [TIPO] [MÓDULO] MENSAJE`. | Doc 3 |
| RN-08 | No deben mostrarse alertas emergentes (popups) al usuario ante errores; se registran en logs. | Doc 2 Sprint 1 §5 |
| RN-09 | Ninguna venta depende exclusivamente del éxito del trigger `onEdit()`: la sincronización cada 4 h debe recuperar eventos perdidos. | Correcciones R1 |
| RN-10 | Es obligatorio vincular `ID_OBRA` (PR-XXXX) o el comodín `GASTO-FIJO` en compras, para evitar costos flotantes. | Roadmap v1.3 |

---

## 3. Casos de uso por módulo

### 3.1 Maestros — `00_CONFIG`, `0A_CLIENTES`, `04_PROVEEDORES` (Etapa 1)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-MA-01 | Consultar listas maestras de configuración | Positivo | P0 | Sistema inicializado | Abrir `00_CONFIG` | Se listan Categorías, Estados, Responsables y Cuentas |
| CU-MA-02 | Las listas desplegables se alimentan desde `00_CONFIG` | Positivo | P0 | Categoría nueva agregada en CONFIG | Abrir un formulario de Compra/Egreso | La nueva categoría aparece en el desplegable, sin duplicados |
| CU-MA-03 | Solo Dirección modifica `00_CONFIG` | Negativo | P1 | Usuario no autorizado | Intentar editar CONFIG | Edición bloqueada / registrada en logs |
| CU-MA-04 | Alta de cliente con todos los campos | Positivo | P0 | — | Crear cliente: ID_CLIENTE, NOMBRE, TIPO, CONTACTO, TELEFONO, EMAIL, OBSERVACIONES | Cliente creado y disponible para presupuestos |
| CU-MA-05 | Alta de cliente sin campos obligatorios | Negativo | P0 | — | Guardar cliente con NOMBRE vacío | Se rechaza el alta; error registrado; sin popup |
| CU-MA-06 | ID_CLIENTE duplicado | Negativo | P1 | Cliente CLI-001 existe | Crear otro CLI-001 | Se rechaza o se advierte duplicado |
| CU-MA-07 | Validación de formato de email/teléfono | Negativo | P2 | — | Cargar email `abc@` | Se rechaza el formato inválido |
| CU-MA-08 | Alta de proveedor | Positivo | P0 | — | Crear proveedor | Proveedor disponible en Compras |
| CU-MA-09 | `SALDO_CC` del proveedor es campo calculado, no editable | Negativo | P0 | Proveedor con compras | Intentar editar SALDO_CC | Campo de solo lectura (RN-06) |
| CU-MA-10 | `SALDO_CC` = Σ compras en Cuenta Corriente − Σ egresos imputados a esas compras | Positivo | P0 | 1 compra CC de 100.000 y 1 egreso de 40.000 | Consultar proveedor | SALDO_CC = 60.000 |

---

### 3.2 Presupuestos — `01_PRESUPUESTOS` (Etapa 2 / Sprint 1)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-PR-01 | Crear presupuesto completo | Positivo | P0 | Cliente existente | Cargar CLIENTE, DESCRIPCION, CATEGORIA, RESPONSABLE, COSTO_MAT, COSTO_MO, IND_VENDIDOS, IMPUESTOS, COMERCIAL, BENEFICIO, MONTO_TOTAL, ESTADO_COMERCIAL="Enviado" | Presupuesto creado con ID formato `PR-XXXX` |
| CU-PR-02 | Formato y unicidad del ID `PR-XXXX` | Positivo | P0 | — | Crear 3 presupuestos | IDs correlativos, formato `PR-` + 4 dígitos, sin repetición |
| CU-PR-03 | Crear presupuesto sin CLIENTE | Negativo | P0 | — | Guardar con CLIENTE vacío | Rechazado (Doc 2 §5: "CLIENTE no vacío") |
| CU-PR-04 | Crear presupuesto con `MONTO_TOTAL` = 0 | Negativo | P0 | — | Guardar con monto 0 | Rechazado (Doc 2 §5: "MONTO_TOTAL > 0") |
| CU-PR-05 | Crear presupuesto con `MONTO_TOTAL` negativo | Negativo | P0 | — | Guardar con −5000 | Rechazado |
| CU-PR-06 | Coherencia de la descomposición de costos | Borde | P1 | — | Cargar costos cuya suma + BENEFICIO ≠ MONTO_TOTAL | Se advierte / se recalcula según regla definida |
| CU-PR-07 | Estados comerciales válidos | Positivo | P1 | — | Recorrer Enviado → En negociación → Aceptado / Rechazado | Solo se aceptan estados de `00_CONFIG` |
| CU-PR-08 | Cambiar estado a **"Aceptado"** genera la venta | Positivo | **P0** | Presupuesto PR-0001 válido, no existe en Ventas | Cambiar ESTADO_COMERCIAL a "Aceptado" | Se crea automáticamente el registro en Ventas con el **mismo ID PR-0001** |
| CU-PR-09 | Campos copiados al aceptar | Positivo | P0 | CU-PR-08 ejecutado | Consultar la venta generada | Se copian ID, CLIENTE, MONTO_TOTAL, COSTO_MAT, COSTO_MO, IND_VENDIDOS, IMPUESTOS, COMERCIAL, BENEFICIO |
| CU-PR-10 | Inicialización de la venta al aceptar | Positivo | P0 | CU-PR-08 ejecutado | Consultar la venta | FECHA_ACEPTACION = hoy; VENTA_FINAL = MONTO_TOTAL; ANTICIPO_PACTADO = 0; SALDO_PACTADO = VENTA_FINAL; TOTAL_COBRADO = 0; SALDO_PENDIENTE = VENTA_FINAL; ESTADO_OP = "Pendiente anticipo" |
| CU-PR-11 | **Idempotencia**: re-aceptar un presupuesto ya trasladado | Negativo | **P0** | PR-0001 ya existe en Ventas | Cambiar estado a otro y volver a "Aceptado" | **No** se duplica la venta; se registra `WARNING_DUPLICADO` en logs |
| CU-PR-12 | Aceptar presupuesto inválido (sin cliente o monto 0) | Negativo | P0 | Presupuesto incompleto | Cambiar a "Aceptado" | No se genera venta; error en `99_LOGS`; sin popup |
| CU-PR-13 | Recuperación por sincronización periódica | Borde | P0 | Presupuesto "Aceptado" cuyo trigger falló | Ejecutar `sincronizacionCompleta()` | La venta faltante se crea (RN-09) |
| CU-PR-14 | Cambiar de "Aceptado" a "Rechazado" | Borde | P1 | Venta ya generada | Revertir el estado | Comportamiento definido y consistente (la venta no queda huérfana ni se borra silenciosamente) |
| CU-PR-15 | Editar montos del presupuesto después de aceptado | Borde | P1 | Venta generada | Modificar COSTO_MAT en el presupuesto | El BENEFICIO_EST del KPI refleja el estimado original definido; no se corrompe la venta |

---

### 3.3 Ventas — `02_VENTAS` (Etapa 3)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-VE-01 | Consultar cartera de ventas | Positivo | P0 | ≥1 venta | Abrir Ventas | Se listan ID, CLIENTE, VENTA_FINAL, cobros, saldo, ESTADO_OP |
| CU-VE-02 | Definir `VENTA_FINAL` real acordada | Positivo | P0 | Venta creada | Editar VENTA_FINAL ≠ MONTO_TOTAL | Se recalcula SALDO_PENDIENTE y toda la lógica de cobranza sobre VENTA_FINAL |
| CU-VE-03 | Definir plan de pagos | Positivo | P0 | Venta creada | Cargar ANTICIPO_PACTADO y SALDO_PACTADO | ANTICIPO_PACTADO + SALDO_PACTADO = VENTA_FINAL |
| CU-VE-04 | Plan de pagos incoherente | Negativo | P1 | — | ANTICIPO + SALDO ≠ VENTA_FINAL | Se advierte / se rechaza |
| CU-VE-05 | Cargar `FECHA_COBRO_ESTIMADA` (manual, Administración) | Positivo | P0 | Venta con saldo | Cargar fecha futura | Se guarda; alimenta el flujo de fondos; no se recalcula sola |
| CU-VE-06 | Cargar `TIPO_CAJA_PREVISTO` (CAJA_A / CAJA_B) | Positivo | P1 | Venta creada | Seleccionar CAJA_A | Solo acepta CAJA_A o CAJA_B (Correcciones R1) |
| CU-VE-07 | Campos financieros son calculados, no editables | Negativo | **P0** | Venta con cobros | Intentar editar TOTAL_COBRADO / SALDO_PENDIENTE / ANTICIPO_COBRADO | Solo lectura: se calculan 100 % desde Ingresos (RN-06) |
| CU-VE-08 | Estado "Pendiente anticipo" | Positivo | P0 | TOTAL_COBRADO = 0 | Consultar ESTADO_OP | "Pendiente anticipo" |
| CU-VE-09 | Estado "Cobro parcial" | Positivo | P0 | TOTAL_COBRADO > 0 y SALDO_PENDIENTE > 0 | Registrar ingreso parcial | ESTADO_OP = "Cobro parcial" |
| CU-VE-10 | Estado "Cobrado" | Positivo | P0 | SALDO_PENDIENTE ≤ 0 | Cobrar el total | ESTADO_OP = "Cobrado" |
| CU-VE-11 | Sobrecobro del cliente | Borde | P1 | VENTA_FINAL = 100.000 | Registrar ingresos por 110.000 | SALDO_PENDIENTE = −10.000; ESTADO_OP = "Cobrado" |
| CU-VE-12 | Estados operativos del ciclo de obra | Positivo | P1 | — | Recorrer En taller → En ejecución → Entregado → Cobrado | Estados válidos según `00_CONFIG` |
| CU-VE-13 | No se puede crear una venta sin presupuesto | Negativo | **P0** | — | Intentar alta manual de venta | Bloqueado (RN-01) |

---

### 3.4 Compras — `03_COMPRAS` (Etapa 4)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-CO-01 | Registrar compra con obra asociada | Positivo | P0 | Obra PR-0001 activa | Cargar ID_OBRA, PROVEEDOR, CATEGORIA, MONTO, TIPO_CAJA, FECHA_PAGO_ESTIMADA | Compra creada, ESTADO = "Pendiente", SALDO_COMPRA = MONTO |
| CU-CO-02 | Registrar compra sin `ID_OBRA` | Negativo | **P0** | — | Guardar sin obra ni comodín | Rechazado: obligatorio ID_OBRA o `GASTO-FIJO` (RN-10) |
| CU-CO-03 | Compra imputada a `GASTO-FIJO` | Positivo | P1 | — | ID_OBRA = "GASTO-FIJO" | Aceptado; no impacta el KPI de una obra concreta |
| CU-CO-04 | `ID_OBRA` inexistente | Negativo | P0 | — | ID_OBRA = PR-9999 (no existe) | Rechazado; error en `99_LOGS`; celda/campo resaltado |
| CU-CO-05 | Categoría económica obligatoria y válida | Negativo | P0 | — | Guardar sin CATEGORIA | Rechazado o clasificado como no clasificado (ver CU-KP-08) |
| CU-CO-06 | `TIPO_CAJA` CAJA_A/CAJA_B | Positivo | P1 | — | Seleccionar valor | Solo CAJA_A o CAJA_B (Correcciones R1) |
| CU-CO-07 | `IMPORTE_PAGADO` y `SALDO_COMPRA` no editables | Negativo | **P0** | Compra existente | Intentar editar | Solo lectura; calculados por finanzas (Correcciones R1) |
| CU-CO-08 | `SALDO_COMPRA` = MONTO − IMPORTE_PAGADO | Positivo | P0 | Compra 100.000 con egreso 30.000 | Consultar compra | IMPORTE_PAGADO = 30.000; SALDO_COMPRA = 70.000 |
| CU-CO-09 | Estado "Parcial" | Positivo | P0 | Pago parcial registrado | Consultar estado | ESTADO = "Parcial" |
| CU-CO-10 | Estado "Pagado" | Positivo | P0 | SALDO_COMPRA = 0 | Pagar el total | ESTADO = "Pagado" |
| CU-CO-11 | **Sobrepago** de compra | Borde | **P0** | MONTO = 100 | Registrar egresos por 110 | SALDO_COMPRA = −10; se registra `WARNING_SOBREPAGO` en `99_LOGS`; el sobrepago se permite |
| CU-CO-12 | Compra en Cuenta Corriente | Positivo | P0 | — | Condición = "Cuenta Corriente" | Queda Pendiente e impacta la deuda del proveedor |
| CU-CO-13 | Compra en Efectivo/Transferencia inmediata | Positivo | P0 | — | Registrar compra + egreso apuntando al ID_COMPRA | Compra queda Pagada y sale de la deuda corriente |
| CU-CO-14 | Monto de compra 0 o negativo | Negativo | P1 | — | Guardar con MONTO ≤ 0 | Rechazado |

---

### 3.5 Ingresos — `05_INGRESOS` (Etapa 5 / Sprint 2 Lógica A)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-IN-01 | Registrar cobro de anticipo | Positivo | **P0** | Venta PR-0001 en "Pendiente anticipo" | Cargar ID_OBRA, TIPO_INGRESO="ANTICIPO", MONTO, CUENTA, TIPO_CAJA | Se actualizan ANTICIPO_COBRADO, TOTAL_COBRADO, SALDO_PENDIENTE, FECHA_COBRO_ANTICIPO, ESTADO_OP |
| CU-IN-02 | Registrar cobro de saldo | Positivo | P0 | Venta con anticipo cobrado | TIPO_INGRESO = "SALDO" | Se actualizan SALDO_COBRADO, TOTAL_COBRADO, FECHA_ULTIMO_COBRO, ESTADO_OP |
| CU-IN-03 | `TOTAL_COBRADO` = suma de todos los ingresos del `ID_OBRA` | Positivo | **P0** | 3 ingresos de 10k, 20k, 30k sobre PR-0001 | Consultar la venta | TOTAL_COBRADO = 60.000 |
| CU-IN-04 | Ingreso con `ID_OBRA` inexistente | Negativo | **P0** | — | ID_OBRA = PR-9999 | Rechazado; error en `99_LOGS`; registro resaltado |
| CU-IN-05 | Ingreso sin `ID_OBRA` | Negativo | P0 | — | Guardar sin obra | Rechazado (RN-03) |
| CU-IN-06 | Ingreso con monto 0 o negativo | Negativo | P1 | — | MONTO ≤ 0 | Rechazado |
| CU-IN-07 | El ingreso impacta Caja y Bancos | Positivo | **P0** | Cuenta "CUENTA-1" con saldo X | Registrar ingreso de 50.000 en esa cuenta | Saldo de la cuenta = X + 50.000 |
| CU-IN-08 | `TIPO_CAJA` propio del ingreso real | Positivo | P1 | Venta con TIPO_CAJA_PREVISTO = CAJA_A | Registrar ingreso con TIPO_CAJA = CAJA_B | Se respeta el TIPO_CAJA real del ingreso, independiente del previsto (Correcciones R1) |
| CU-IN-09 | Eliminar/anular un ingreso | Borde | P1 | Ingreso registrado | Eliminar el registro | Se recalculan TOTAL_COBRADO, SALDO_PENDIENTE, ESTADO_OP y el saldo de caja |
| CU-IN-10 | Ingreso sobre obra ya "Cobrada" | Borde | P1 | Venta cobrada al 100 % | Registrar ingreso extra | SALDO_PENDIENTE negativo; estado se mantiene "Cobrado" |

---

### 3.6 Egresos — `06_EGRESOS` (Etapa 5 / Sprint 2 Lógica B)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-EG-01 | Pago asociado a una compra | Positivo | **P0** | Compra C-001 Pendiente por 100.000 | Cargar ID_COMPRA, MONTO=100.000, CUENTA, TIPO_CAJA | IMPORTE_PAGADO=100.000; SALDO_COMPRA=0; ESTADO="Pagado" |
| CU-EG-02 | Pago parcial de una compra | Positivo | P0 | Compra por 100.000 | Egreso de 40.000 | SALDO_COMPRA = 60.000; ESTADO = "Parcial" |
| CU-EG-03 | **Egreso directo a obra** (sin compra) | Positivo | **P0** | ID_OBRA ≠ vacío, ID_COMPRA vacío | Cargar mano de obra / combustible / viáticos / herramientas menores con su CATEGORIA | El gasto se imputa directamente a la obra y entra en el costeo real |
| CU-EG-04 | Egreso sin obra ni compra | Negativo | P0 | — | Ambos vacíos | Rechazado (RN-04) |
| CU-EG-05 | `ID_COMPRA` inexistente | Negativo | P0 | — | ID_COMPRA = C-999 | Rechazado; error en `99_LOGS` |
| CU-EG-06 | El egreso impacta Caja y Bancos | Positivo | **P0** | Cuenta con saldo X | Registrar egreso de 20.000 | Saldo = X − 20.000 |
| CU-EG-07 | Registrar **cheque diferido** | Positivo | **P0** | — | ESTADO = "Emitido", FECHA_ACREDITACION futura | El egreso no descuenta caja hoy; queda como compromiso futuro |
| CU-EG-08 | Cheque acreditado | Positivo | P0 | Cheque con FECHA_ACREDITACION pasada | Consultar caja | El importe ya está descontado del saldo |
| CU-EG-09 | Cheque sin fecha de acreditación | Negativo | P1 | ESTADO = "Emitido" | Guardar sin fecha | Rechazado o clasificado como "SIN FECHA" en el flujo |
| CU-EG-10 | Egreso con categoría vacía | Borde | P1 | — | Guardar sin CATEGORIA | Se acumula en `COSTOS_NO_CLASIFICADOS` del KPI (Doc 3 §10) |
| CU-EG-11 | Egreso de monto 0 o negativo | Negativo | P1 | — | MONTO ≤ 0 | Rechazado |

---

### 3.7 Gastos Fijos — `07_GASTOS_FIJOS` (Etapa 6)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-GF-01 | Cargar previsión mensual | Positivo | P0 | — | CONCEPTO, MONTO_PREVISTO, FECHA_PREVISTA, TIPO_CAJA, ESTADO="Estimado" | Gasto previsto creado |
| CU-GF-02 | Registrar el cierre real | Positivo | P0 | Gasto estimado | Cargar MONTO_REAL y cambiar ESTADO | El previsto deja de proyectarse; se usa el real |
| CU-GF-03 | Solo los "Estimado" alimentan la proyección | Positivo | **P0** | 1 estimado + 1 cerrado | Consultar flujo de fondos | Solo el estimado aparece como evento futuro (Doc 3 §3) |
| CU-GF-04 | Gastos estructurales en el resultado operativo | Positivo | P0 | Σ MONTO_REAL = 500.000 | Consultar tablero | Gastos estructurales = 500.000 |
| CU-GF-05 | Gasto sin fecha prevista | Negativo | P1 | — | Guardar sin FECHA_PREVISTA | Rechazado o clasificado "SIN FECHA" |

---

### 3.8 Cuentas Corrientes de Clientes — `08_CUENTAS_CLIENTES` (Etapa 7, solo lectura)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-CC-01 | Consultar cuentas de clientes | Positivo | P0 | Ventas con saldo | Abrir la vista | Columnas: ID_OBRA, CLIENTE, VENTA_FINAL, TOTAL_COBRADO, SALDO_PENDIENTE, FECHA_ULTIMO_COBRO, DIAS_SIN_COBRO, ESTADO_COBRO |
| CU-CC-02 | Cálculo de `DIAS_SIN_COBRO` | Positivo | P0 | Último cobro hace 20 días | Consultar | DIAS_SIN_COBRO = 20 |
| CU-CC-03 | Estado "Al día" | Positivo | P0 | Cobro reciente | Consultar | ESTADO_COBRO = "Al día" |
| CU-CC-04 | Estado "Mora leve" | Positivo | P0 | Días sin cobro en umbral medio | Consultar | ESTADO_COBRO = "Mora leve" |
| CU-CC-05 | Estado "Mora crítica" | Positivo | P0 | Días sin cobro sobre umbral alto | Consultar | ESTADO_COBRO = "Mora crítica" |
| CU-CC-06 | Vista de solo lectura | Negativo | **P0** | — | Intentar editar cualquier celda | Edición bloqueada (RN-06) |
| CU-CC-07 | Sin duplicados por obra | Borde | P1 | Varias ventas del mismo cliente | Consultar | Una fila por ID_OBRA (UNIQUE) |
| CU-CC-08 | Obra sin cobros | Borde | P1 | Venta sin ingresos | Consultar | TOTAL_COBRADO=0; SALDO=VENTA_FINAL; DIAS_SIN_COBRO calculado desde la aceptación (o vacío, según regla) |

---

### 3.9 Cuentas Corrientes de Proveedores — `09_CUENTAS_PROVEEDORES` (Etapa 7, solo lectura)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-CP-01 | Consultar deuda por proveedor | Positivo | P0 | Compras registradas | Abrir la vista | Columnas: PROVEEDOR, COMPRAS_CC, PAGOS_REALIZADOS, SALDO_TOTAL, CHEQUES_PENDIENTES, CHEQUES_A_VENCER_7_DIAS |
| CU-CP-02 | `SALDO_TOTAL` = compras CC − pagos | Positivo | P0 | 200.000 en compras, 80.000 pagados | Consultar | SALDO_TOTAL = 120.000 |
| CU-CP-03 | Cheques a vencer en 7 días | Positivo | **P0** | Cheque emitido con acreditación en 5 días | Consultar | Aparece en CHEQUES_A_VENCER_7_DIAS |
| CU-CP-04 | Cheque a 30 días no entra en el corte de 7 | Borde | P1 | Cheque con acreditación en 30 días | Consultar | Cuenta en CHEQUES_PENDIENTES pero no en los 7 días |
| CU-CP-05 | **Crédito a favor** por sobrepago | Borde | **P0** | SALDO_TOTAL < 0 | Consultar | Proveedor clasificado `CREDITO_A_FAVOR`, saldo en verde, disponible para compensaciones futuras (Correcciones R1) |
| CU-CP-06 | Vista de solo lectura | Negativo | P0 | — | Intentar editar | Bloqueado |
| CU-CP-07 | Proveedor sin movimientos | Borde | P2 | Proveedor recién creado | Consultar | Saldo 0 o no listado, sin errores |

---

### 3.10 Caja y Bancos — `10_CAJA_BANCOS` (Etapa 7, solo lectura)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-CB-01 | Consultar disponibilidades por cuenta | Positivo | **P0** | Cuentas configuradas (CUENTA-1, CUENTA-2, CUENTA-3) | Abrir la vista | Una fila por CUENTA con SALDO y TIPO_CAJA |
| CU-CB-02 | Saldo por cuenta = ingresos − egresos | Positivo | **P0** | Ingresos 300.000, egresos 120.000 en CUENTA-1 | Consultar | SALDO = 180.000 |
| CU-CB-03 | Subtotal caja **CAJA_A** | Positivo | P0 | Movimientos mixtos | Consultar | Subtotal correcto de cuentas/movimientos CAJA_A |
| CU-CB-04 | Subtotal caja **CAJA_B** | Positivo | P0 | Movimientos mixtos | Consultar | Subtotal correcto CAJA_B |
| CU-CB-05 | `TOTAL_GENERAL` = CAJA_A + CAJA_B | Positivo | **P0** | — | Consultar | TOTAL_GENERAL coincide con la suma de subtotales |
| CU-CB-06 | Saldo negativo en una cuenta | Borde | P1 | Egresos > ingresos en la cuenta | Consultar | Se muestra negativo, sin romper el total |
| CU-CB-07 | Vista de solo lectura | Negativo | P0 | — | Intentar editar | Bloqueado |
| CU-CB-08 | Los cheques no acreditados no afectan la caja de hoy | Borde | **P0** | Cheque emitido a futuro | Consultar caja | El saldo no descuenta el cheque hasta su FECHA_ACREDITACION |

---

### 3.11 Flujo de Fondos — `11_FLUJO_FONDOS` (Etapa 8 / Sprints 4-5) — **Prioridad estratégica máxima**

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-FF-01 | Punto de partida = caja actual | Positivo | **P0** | TOTAL_GENERAL = 1.000.000 | Abrir el flujo | El saldo inicial de la proyección es 1.000.000 |
| CU-FF-02 | Cobros esperados como eventos positivos | Positivo | **P0** | Venta con SALDO_PENDIENTE 300.000 y FECHA_COBRO_ESTIMADA 20/07 | Consultar | Evento "+300.000" el 20/07 |
| CU-FF-03 | Solo entran ventas con `SALDO_PENDIENTE > 0` | Negativo | P0 | Venta totalmente cobrada | Consultar | No genera evento de cobro |
| CU-FF-04 | Pagos comprometidos como eventos negativos | Positivo | **P0** | Compra Pendiente/Parcial con SALDO_COMPRA 150.000 y FECHA_PAGO_ESTIMADA 22/07 | Consultar | Evento "−150.000" el 22/07 |
| CU-FF-05 | Compras "Pagado" no generan eventos | Negativo | P0 | Compra saldada | Consultar | Sin evento |
| CU-FF-06 | Cheques diferidos por `FECHA_ACREDITACION` | Positivo | **P0** | Cheque Emitido, acreditación 25/07 | Consultar | Evento "−200.000" el 25/07 |
| CU-FF-07 | **Anti doble conteo** compra pagada con cheque | Borde | **P0** | Compra cancelada mediante cheque emitido a futuro | Consultar | La obligación se toma solo desde `06_EGRESOS.FECHA_ACREDITACION`, no desde `03_COMPRAS` (Doc 3 §5) |
| CU-FF-08 | Gastos fijos previstos como eventos | Positivo | P0 | Gasto "Estimado" 31/07 por 800.000 | Consultar | Evento "−800.000" el 31/07 |
| CU-FF-09 | Orden cronológico y saldo acumulado | Positivo | **P0** | Varios eventos | Consultar | Eventos ordenados por fecha; cada fila muestra el saldo acumulado correcto |
| CU-FF-10 | Matriz diaria a 30 días | Positivo | P0 | — | Ver vista diaria | 30 días con cobros, pagos, gastos fijos, cheques y saldo acumulado |
| CU-FF-11 | Matriz semanal a 90 días | Positivo | P0 | — | Ver vista semanal | 12 semanas agrupadas |
| CU-FF-12 | Escenario **Base** | Positivo | **P0** | — | Seleccionar Base | FACTOR_COBRO = 100 % |
| CU-FF-13 | Escenario **Conservador** | Positivo | **P0** | Cobro esperado 300.000 | Seleccionar Conservador | El cobro se proyecta a 240.000 (80 %) |
| CU-FF-14 | Escenario **Optimista** | Positivo | P0 | Cobro esperado 300.000 | Seleccionar Optimista | El cobro se proyecta a 330.000 (110 %) |
| CU-FF-15 | El factor **solo** afecta cobros | Negativo | **P0** | Pago de 150.000 | Cambiar de Base a Conservador | Los pagos, cheques y gastos fijos permanecen sin alterar |
| CU-FF-16 | Eventos **SIN FECHA** | Borde | P0 | Venta con saldo y sin FECHA_COBRO_ESTIMADA | Consultar | Clasificado "SIN FECHA" y mostrado al inicio del flujo |
| CU-FF-17 | Eventos **VENCIDOS** | Borde | **P0** | Compra con FECHA_PAGO_ESTIMADA pasada e impaga | Consultar | Clasificado "VENCIDOS" y mostrado al inicio del flujo |
| CU-FF-18 | Semáforo **verde** | Positivo | P1 | Saldo proyectado > 30 % de la caja actual | Consultar | Fila en verde |
| CU-FF-19 | Semáforo **amarillo** | Positivo | P1 | Saldo positivo bajo (≤ 30 % de caja) | Consultar | Fila en amarillo |
| CU-FF-20 | Semáforo **rojo** | Positivo | **P0** | Saldo proyectado negativo | Consultar | Fila en rojo |
| CU-FF-21 | Botón **"Actualizar Proyección"** | Positivo | P0 | Datos modificados | Presionar el botón | Se ejecuta la reconstrucción y la proyección refleja los cambios |
| CU-FF-22 | Actualización automática cada 4 h | Positivo | P1 | — | Esperar/forzar el ciclo | La proyección se reconstruye sin intervención |
| CU-FF-23 | Flujo sin datos | Borde | P2 | Sistema vacío | Abrir el flujo | Muestra caja actual y horizonte vacío, sin errores |

---

### 3.12 KPI de Obras — `12_KPI_OBRAS` (Etapa 9 / Sprint 6)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-KP-01 | Solo se auditan obras Entregadas o Cobradas | Positivo | **P0** | Obras en distintos estados | Abrir KPI | Se excluyen "Pendiente anticipo", "En taller" y "En ejecución" |
| CU-KP-02 | Costo real de **Materiales** | Positivo | **P0** | Compras COSTO MAT 200.000 + egresos directos COSTO MAT 50.000 | Consultar | MAT_REAL = 250.000 |
| CU-KP-03 | Costo real de **Mano de Obra** | Positivo | P0 | Egresos COSTO M.O. 120.000 | Consultar | MO_REAL = 120.000 |
| CU-KP-04 | Costos reales Indirectos / Impuestos / Comercial | Positivo | P0 | Egresos por categoría | Consultar | IND_REAL, IMP_REAL, COM_REAL correctos |
| CU-KP-05 | `BENEFICIO_REAL` | Positivo | **P0** | VENTA_FINAL 1.000.000; costos reales 700.000 | Consultar | BENEFICIO_REAL = VENTA_FINAL − MAT − MO − IND − IMP − COM = 300.000 |
| CU-KP-06 | `RENTABILIDAD_REAL` | Positivo | P0 | Caso anterior | Consultar | 300.000 / 1.000.000 = 30 % |
| CU-KP-07 | `EFICIENCIA_PRESUPUESTACION` | Positivo | P0 | BENEFICIO_EST 250.000; BENEFICIO_REAL 300.000 | Consultar | 300.000 / 250.000 = 120 % |
| CU-KP-08 | `COSTOS_NO_CLASIFICADOS` | Borde | **P0** | Egreso sin categoría por 40.000 | Consultar | Se acumula en COSTOS_NO_CLASIFICADOS y **se descuenta igual** del beneficio |
| CU-KP-09 | `SCORE_OBRA` = **A** | Positivo | P0 | Desvío ≤ 5 % | Consultar | Score A |
| CU-KP-10 | `SCORE_OBRA` = **B** | Positivo | P0 | 5 % < desvío ≤ 15 % | Consultar | Score B |
| CU-KP-11 | `SCORE_OBRA` = **C** | Positivo | P0 | 15 % < desvío ≤ 30 % | Consultar | Score C |
| CU-KP-12 | `SCORE_OBRA` = **D** | Positivo | **P0** | Resultado operativo ≤ 0 | Consultar | Score D (prevalece sobre el % de desvío) |
| CU-KP-13 | Límites exactos del score | Borde | P1 | Desvío = 5,0 % / 15,0 % / 30,0 % | Consultar | A / B / C respectivamente (comparación ≤) |
| CU-KP-14 | Botón **"Auditar Obras"** | Positivo | P0 | Datos nuevos | Presionar | Se ejecuta `reconstruirKPI()` y se refrescan los indicadores |
| CU-KP-15 | Obra sin costos reales | Borde | P1 | Obra entregada sin compras ni egresos | Consultar | BENEFICIO_REAL = VENTA_FINAL; sin división por cero |
| CU-KP-16 | `BENEFICIO_ESTIMADO` = 0 | Borde | P1 | Presupuesto con beneficio 0 | Consultar eficiencia | No se muestra error de división por cero |
| CU-KP-17 | Vista de solo lectura | Negativo | P0 | — | Intentar editar | Bloqueado |

---

### 3.13 Tablero Gerencial — `13_TABLERO` (Etapa 10 / Sprint 7)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-TB-01 | Volumen presupuestado | Positivo | P0 | Presupuestos cargados | Abrir tablero | Σ MONTO_TOTAL correcto |
| CU-TB-02 | **Tasa de conversión** | Positivo | **P0** | 10 emitidos, 4 aceptados | Consultar | 40 % |
| CU-TB-03 | Ventas cerradas | Positivo | P0 | Ventas registradas | Consultar | Σ VENTA_FINAL |
| CU-TB-04 | Pipeline | Positivo | P0 | Presupuestos pendientes | Consultar | Σ de presupuestos aún no resueltos |
| CU-TB-05 | Backlog comercial | Positivo | P0 | Obras activas con saldo | Consultar | Σ SALDO_PENDIENTE de obras activas |
| CU-TB-06 | Caja viva actual | Positivo | **P0** | — | Consultar | Coincide con `10_CAJA_BANCOS.TOTAL_GENERAL` |
| CU-TB-07 | Cobertura de deuda | Positivo | P0 | Caja 1.000.000; deuda proveedores 500.000 | Consultar | 2,0 |
| CU-TB-08 | **Punto de quiebre de caja** | Positivo | **P0** | Flujo conservador con saldo negativo el 12/08 | Consultar | Muestra la primera fecha negativa del escenario conservador |
| CU-TB-09 | Caja mínima proyectada | Positivo | **P0** | — | Consultar | Muestra monto, fecha y semana del mínimo del escenario conservador |
| CU-TB-10 | Resultado bruto de obras | Positivo | P0 | KPI calculados | Consultar | Σ BENEFICIO_REAL |
| CU-TB-11 | Gastos estructurales | Positivo | P0 | Gastos fijos reales | Consultar | Σ MONTO_REAL de `07_GASTOS_FIJOS` |
| CU-TB-12 | Resultado operativo | Positivo | **P0** | Bruto 800.000; estructurales 500.000 | Consultar | 300.000 |
| CU-TB-13 | Rentabilidad operativa | Positivo | P0 | Resultado 300.000; ventas 3.000.000 | Consultar | 10 % |
| CU-TB-14 | Consistencia cruzada tablero ↔ vistas | Positivo | **P0** | — | Comparar tablero contra 10, 11 y 12 | Todos los valores coinciden |
| CU-TB-15 | Diseño responsive | Positivo | **P0** | — | Abrir en desktop, tablet y móvil | Tarjetas grandes legibles, sin tablas extensas, sin scroll horizontal |
| CU-TB-16 | Tablero sin datos | Borde | P2 | Sistema vacío | Abrir | Ceros o vacíos, sin `NaN`, `#DIV/0!` ni errores |
| CU-TB-17 | Vista de solo lectura | Negativo | P0 | — | Intentar editar | Bloqueado |

---

### 3.14 Auditoría y Sincronización — `99_LOGS` (transversal)

| ID | Caso de uso | Tipo | Prio | Precondición | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-LG-01 | Formato de log | Positivo | P0 | Operación ejecutada | Consultar logs | `[TIMESTAMP] [TIPO] [MÓDULO] MENSAJE` |
| CU-LG-02 | Log de éxito | Positivo | P1 | KPI recalculado | Consultar | Entrada `SUCCESS / kpi.gs / KPIs de obras recalculados.` |
| CU-LG-03 | Log de `WARNING_DUPLICADO` | Negativo | **P0** | CU-PR-11 | Consultar | Entrada registrada con el ID afectado |
| CU-LG-04 | Log de `WARNING_SOBREPAGO` | Negativo | **P0** | CU-CO-11 | Consultar | Entrada registrada |
| CU-LG-05 | Log de errores de validación | Negativo | P0 | ID_OBRA inexistente | Consultar | Error registrado con módulo y detalle |
| CU-LG-06 | **Sin alertas emergentes** | Negativo | **P0** | Provocar un error de validación | Observar la UI | No aparece popup/alert bloqueante (RN-08) |
| CU-LG-07 | `sincronizacionCompleta()` cada 4 h | Positivo | P0 | Datos desincronizados | Ejecutar el ciclo | Ventas, compras, vistas y KPI quedan consistentes |
| CU-LG-08 | `auditarIntegridad()` detecta huérfanos | Positivo | P1 | Ingreso con obra inexistente | Ejecutar auditoría | Se reporta la inconsistencia en logs |
| CU-LG-09 | `reconstruirVistas()` es idempotente | Borde | P0 | — | Ejecutar dos veces seguidas | Mismo resultado; sin duplicar filas |

---

### 3.15 Transversales de aplicación web (MVP)

| ID | Caso de uso | Tipo | Prio | Flujo | Resultado esperado |
|---|---|---|---|---|---|
| CU-TR-01 | Carga inicial de la aplicación | Positivo | **P0** | Abrir https://porte-mvp.vercel.app/ | Carga < 3 s, sin errores en consola |
| CU-TR-02 | Navegación entre módulos | Positivo | **P0** | Recorrer todo el menú | Todas las rutas responden, sin 404 ni pantallas en blanco |
| CU-TR-03 | Persistencia de datos | Positivo | **P0** | Crear un registro y recargar (F5) | El registro persiste |
| CU-TR-04 | Responsive 1920 / 1024 / 375 px | Positivo | P0 | Redimensionar | Layout usable en las tres resoluciones |
| CU-TR-05 | Navegación con URL directa / deep link | Borde | P1 | Pegar la URL de un módulo | Carga la vista correcta |
| CU-TR-06 | Botón atrás del navegador | Borde | P1 | Navegar y volver | Estado consistente |
| CU-TR-07 | Formato de moneda y separadores | Positivo | P1 | Consultar montos | Formato consistente en todas las vistas |
| CU-TR-08 | Manejo de sesión / acceso | Positivo | P0 | Acceder sin credenciales | Comportamiento acorde al diseño (público o con login) |
| CU-TR-09 | Entrada de texto en campos numéricos | Negativo | P1 | Escribir "abc" en MONTO | Rechazado, sin romper la vista |
| CU-TR-10 | Inyección de caracteres especiales | Negativo | P1 | `<script>alert(1)</script>` en un campo texto | Se escapa correctamente, no se ejecuta |

---

### 3.16 Autenticación, perfiles y permisos — `CU-RL` (suite nueva)

Esta suite cumple dos funciones: **descubrir** el alcance real del perfil `USER` y **verificar** que la separación de permisos se respete. Se ejecuta primero, porque su resultado define qué se prueba con cada perfil en el resto del catálogo.

#### Autenticación

| ID | Caso de uso | Perfil | Tipo | Prio | Flujo | Resultado esperado |
|---|---|---|---|---|---|---|
| CU-RL-01 | Login con credenciales de administrador | `[A]` | Positivo | **P0** | Ingresar usuario/clave de admin | Acceso concedido; se identifica el perfil en la UI |
| CU-RL-02 | Login con credenciales de no administrador | `[U]` | Positivo | **P0** | Ingresar usuario/clave de user | Acceso concedido; se identifica el perfil en la UI |
| CU-RL-03 | Login con credenciales inválidas | `[A/U]` | Negativo | **P0** | Clave incorrecta | Rechazado, con mensaje genérico que no revele si el usuario existe |
| CU-RL-04 | Acceso sin autenticar | `[A/U]` | Negativo | **P0** | Abrir una URL interna sin sesión | Redirige al login; no expone datos |
| CU-RL-05 | Cierre de sesión | `[A/U]` | Positivo | P0 | Logout y luego botón atrás del navegador | La sesión no se recupera |
| CU-RL-06 | Expiración de sesión | `[A/U]` | Borde | P1 | Sesión inactiva prolongada | Se cierra o se renueva según el diseño, sin exponer datos |

#### Descubrimiento del alcance de `USER` (exploratorios)

Estos casos no tienen resultado esperado fijo: su salida **es** la definición del perfil, que luego se congela como línea base.

| ID | Caso de uso | Prio | Flujo | Salida |
|---|---|---|---|---|
| CU-RL-07 | Inventario de navegación de `USER` | **P0** | Login como user y recorrer todo el menú | Lista de módulos visibles vs. ocultos frente al admin |
| CU-RL-08 | Inventario de acciones de `USER` | **P0** | En cada módulo visible, listar botones de crear/editar/eliminar disponibles | Matriz módulo × acción para `USER` |
| CU-RL-09 | Inventario de campos editables de `USER` | P0 | Abrir cada formulario accesible | Campos habilitados vs. solo lectura |
| CU-RL-10 | Diferencia de datos mostrados | **P0** | Comparar la misma pantalla con ambos perfiles | ¿`USER` ve montos, saldos y márgenes completos o enmascarados? |
| CU-RL-11 | Congelar la línea base de permisos | P0 | Consolidar CU-RL-07 a CU-RL-10 | Matriz de permisos definitiva que reemplaza los `[?]` del §1-bis |

#### Verificación negativa de permisos (espejos de los `[A]`)

Se ejecutan **con sesión de `USER`**. Toda funcionalidad que la línea base marque como exclusiva de admin debe estar bloqueada tanto en la UI **como en el backend**.

| ID | Caso de uso | Tipo | Prio | Flujo | Resultado esperado |
|---|---|---|---|---|---|
| CU-RL-12 | `USER` no accede a `00_CONFIG` | Negativo | **P0** | Buscar el módulo de configuración | No visible ni accesible |
| CU-RL-13 | `USER` no modifica listas maestras | Negativo | **P0** | Forzar la URL de configuración | Acceso denegado (espejo de CU-MA-03) |
| CU-RL-14 | `USER` no accede a gestión de usuarios | Negativo | **P0** | Buscar administración de usuarios | No disponible |
| CU-RL-15 | `USER` no accede a `99_LOGS` | Negativo | P0 | Buscar el módulo de auditoría | No disponible (espejo de CU-LG-01) |
| CU-RL-16 | `USER` no ejecuta "Auditar Obras" | Negativo | P0 | Buscar el botón en KPI | Ausente o deshabilitado (espejo de CU-KP-14) |
| CU-RL-17 | `USER` no ejecuta "Actualizar Proyección" | Negativo | P0 | Buscar el botón en Flujo de Fondos | Ausente o deshabilitado (espejo de CU-FF-21) |
| CU-RL-18 | `USER` y el Tablero gerencial | Negativo | **P0** | Intentar acceder al tablero | Según la línea base: bloqueado o visible; debe ser consistente entre menú y URL directa |
| CU-RL-19 | **Escalada de privilegios por URL directa** | Negativo | **P0** | Pegar la URL de cada módulo exclusivo de admin | Denegado en todos los casos; no basta con ocultar el enlace del menú |
| CU-RL-20 | **Escalada de privilegios por API** | Negativo | **P0** | Repetir con el token de `USER` una petición que solo admin puede hacer | El backend responde 401/403; la restricción no es solo de frontend |
| CU-RL-21 | Manipulación del rol en el cliente | Negativo | **P0** | Alterar el rol en localStorage/cookie/JWT del cliente | Sin efecto: el servidor sigue aplicando el permiso real |
| CU-RL-22 | Acceso a datos de solo lectura | Negativo | P0 | Con `USER`, intentar editar una vista 08-13 | Bloqueado para ambos perfiles (RN-06 aplica también al admin) |

> **Nota sobre el admin:** RN-06 no se relaja por ser administrador. Las vistas 08-13 son de solo lectura **para todos**; que un perfil sea admin no habilita la edición manual de datos calculados.

---

## 4. Resumen de cobertura

| Módulo | CU | P0 |
|---|---|---|
| Maestros | 10 | 6 |
| Presupuestos | 15 | 10 |
| Ventas | 13 | 8 |
| Compras | 14 | 9 |
| Ingresos | 10 | 6 |
| Egresos | 11 | 7 |
| Gastos fijos | 5 | 3 |
| Cuentas clientes | 8 | 6 |
| Cuentas proveedores | 7 | 4 |
| Caja y bancos | 8 | 6 |
| Flujo de fondos | 23 | 16 |
| KPI de obras | 17 | 12 |
| Tablero | 17 | 12 |
| Logs / Sincronización | 9 | 6 |
| Transversales web | 10 | 5 |
| **Subtotal funcional** | **177** | **116** |
| Autenticación y permisos (`CU-RL`) | 22 | 18 |
| **TOTAL** | **199** | **134** |

**Distribución por perfil**

| | `ADMIN` | `USER` |
|---|---|---|
| Casos funcionales | 177 | Por determinar (CU-RL-11) |
| Autenticación | 5 | 5 |
| Descubrimiento de alcance | — | 5 |
| Verificación negativa de permisos | — | 11 |
| Transversales web | 10 (incluidos arriba) | 10 |

---

## 5. Escenario E2E maestro (flujo operativo completo)

Este es el caso integrador que valida RN-01 a RN-05 de punta a punta y debe automatizarse primero.

**Perfil de ejecución:** se ejecuta completo con `ADMIN`. Una vez congelada la línea base de permisos (CU-RL-11), se ejecuta una **segunda pasada con `USER`** hasta el punto donde el perfil pierda permisos: ese punto de corte es en sí mismo un resultado a documentar.

| # | Paso | Verificación |
|---|---|---|
| 1 | Alta de cliente "ACME S.A." y proveedor "Metalúrgica Sur" | Ambos disponibles en los desplegables |
| 2 | Crear presupuesto PR-0001: MONTO_TOTAL 1.000.000 (MAT 400k, MO 200k, IND 50k, IMP 100k, COM 50k, BENEFICIO 200k) | ID `PR-0001` generado |
| 3 | Cambiar ESTADO_COMERCIAL a "Aceptado" | Venta PR-0001 creada; SALDO_PENDIENTE 1.000.000; ESTADO_OP "Pendiente anticipo" |
| 4 | Definir VENTA_FINAL 1.000.000; ANTICIPO_PACTADO 400.000; SALDO_PACTADO 600.000; FECHA_COBRO_ESTIMADA +30 días | Plan de pagos coherente |
| 5 | Registrar ingreso ANTICIPO 400.000 en CUENTA-1 | TOTAL_COBRADO 400.000; SALDO 600.000; ESTADO_OP "Cobro parcial"; caja +400.000 |
| 6 | Registrar compra C-001 a Metalúrgica Sur, obra PR-0001, COSTO MAT 380.000, Cuenta Corriente, pago estimado +15 días | Compra "Pendiente"; deuda del proveedor 380.000 |
| 7 | Registrar egreso 180.000 contra C-001 | SALDO_COMPRA 200.000; ESTADO "Parcial"; caja −180.000 |
| 8 | Registrar egreso directo a obra: mano de obra 190.000 (COSTO M.O.) | Costo real de MO imputado a PR-0001 |
| 9 | Emitir cheque diferido 200.000 con acreditación +20 días para saldar C-001 | Compra "Pagada"; caja de hoy sin cambios; evento futuro en el flujo |
| 10 | Consultar Flujo de Fondos escenario Base | Eventos: +600.000 (día 30), −200.000 (día 20, por acreditación del cheque y **no** por la compra), gastos fijos |
| 11 | Cambiar a escenario Conservador | El cobro pasa a 480.000; los pagos no cambian |
| 12 | Registrar ingreso SALDO 600.000 | SALDO_PENDIENTE 0; ESTADO_OP "Cobrado" |
| 13 | Marcar obra como Entregada/Cobrada | La obra entra en el KPI |
| 14 | Consultar KPI de PR-0001 | MAT_REAL 380.000; MO_REAL 190.000; BENEFICIO_REAL 430.000; RENTABILIDAD 43 %; EFICIENCIA 215 %; SCORE según desvío |
| 15 | Consultar Tablero | Caja, backlog, resultado operativo y tasa de conversión consistentes con las vistas |

---

## 6. Ruta de QA propuesta

**Etapa 0 — Base documental (hecha).** Casos de uso derivados de la documentación: este archivo.

**Etapa 1 — Validación de alcance.** Confirmar con el equipo qué módulos de los 14 están efectivamente implementados en el MVP de Vercel y cuáles son solo diseño. Sin esto se reportarían como bugs funcionalidades aún no construidas.

**Etapa 2 — Exploración con ambos perfiles.** Dos recorridos completos del MVP, uno con `ADMIN` y otro con `USER`, ejecutando CU-RL-07 a CU-RL-11. Salidas:
1. Matriz de trazabilidad CU ↔ pantalla real (*Implementado / Parcial / No implementado / Divergente*).
2. **Matriz de permisos definitiva**, que resuelve todos los `[?]` del §1-bis y fija qué se prueba con cada perfil.

**Etapa 3 — Casos de prueba ejecutables.** Convertir cada CU aplicable en casos de prueba con datos concretos, pasos y resultado esperado, **etiquetados por perfil**. Prioridad: los 134 P0, empezando por la suite `CU-RL` y luego el E2E maestro (§5).

**Etapa 4 — Automatización.** Playwright + TypeScript con Page Object Model y **dos `storageState` (uno por perfil)** para no repetir el login en cada test. Orden: autenticación y permisos → E2E maestro → cálculos financieros críticos (flujo de fondos, caja, KPI) → validaciones negativas → responsive.

**Etapa 5 — Reporte.** Ejecución, evidencia (capturas/traces), registro de defectos y resumen de cobertura **por módulo y por perfil**.

---

## 7. Riesgos y preguntas abiertas

| # | Tema | Pregunta a resolver |
|---|---|---|
| 1 | **Alcance real del MVP** | ¿El MVP web replica los 14 módulos o es un subconjunto? |
| 2 | **Umbrales de mora** | Doc 2 define "Al día / Mora leve / Mora crítica" pero no los días de corte. Se requiere el umbral exacto. |
| 3 | **Base del desvío del SCORE_OBRA** | ¿El desvío se mide sobre el beneficio, sobre el costo total o por categoría? |
| 4 | **"Saldo positivo bajo" (semáforo amarillo)** | Verde es > 30 % de la caja actual y rojo es negativo; falta el corte inferior del amarillo. |
| 5 | **Coherencia de la descomposición de costos** | No se define si `MONTO_TOTAL` debe ser exactamente la suma de las 5 categorías + BENEFICIO. |
| 6 | **Reversión de estado** | No se define qué ocurre con la venta si un presupuesto "Aceptado" vuelve a "Rechazado". |
| 7 | **Datos de prueba** | ¿Hay entorno de QA con datos semilla, o se prueba sobre el MVP con datos reales? Cargar datos de prueba en producción es riesgoso. |
| 8 | **Alcance del perfil no-admin** | **Incógnita principal.** El MVP tiene 2 perfiles y aún no está definido qué puede hacer el no-admin. Se resuelve con CU-RL-07 a CU-RL-11. |
| 9 | **Colapso de 3 actores en 2 perfiles** | La documentación define 3 actores (Administración, Comercial, Dirección) pero el MVP tiene 2 perfiles. ¿Cuál de los tres quedó fuera, o cuáles se fusionaron? |
| 10 | **Visibilidad de datos sensibles** | ¿El no-admin ve caja real, separación CAJA_A/CAJA_B, márgenes por obra y punto de quiebre? Es la decisión de permisos de mayor impacto. |
| 11 | **Aislamiento de datos de prueba entre perfiles** | Si ambos perfiles operan sobre el mismo entorno, los tests de un perfil pueden contaminar los del otro. Definir estrategia de datos antes de automatizar. |

---

## 8. Resultado de la exploración (Etapa 2) — 2026-08-06

Recorrido de solo lectura del MVP con ambos perfiles. **No se creó ni modificó ningún registro.**

### 8.1 Estructura real de la aplicación

SPA con navegación por botones (sin `<a href>`), 13 rutas. Menú organizado en tres secciones: **Módulos**, **Accesos** y **Administración** / **Carga de datos** según el perfil.

Valores maestros confirmados en `/config`:

| Lista | Valores |
|---|---|
| CATEGORÍAS | PORTON, CORTINA, ESTRUCTURA, FRENTE ASADOR, SERVICIO, OTRO |
| ESTADO COMERCIAL | Pedido, En presupuestación, Enviado, En negociación, Aceptado, Rechazado, Represupuestado, Cancelado |
| ESTADO OPERATIVO | Pendiente, Planificado, En fabricación, En montaje, Entregado, Cerrado |
| CUENTAS | 4 cuentas configuradas (1 bancaria, 1 billetera virtual, 2 de efectivo) — *nombres reales omitidos* |
| TIPO DE CAJA | 2 valores de clasificación fiscal — *referidos en este documento como `CAJA_A` / `CAJA_B`* |
| TIPO DE INGRESO | ANTICIPO, SALDO, PAGO PARCIAL, OTRO |
| TIPO DE EGRESO | MATERIALES, MANO DE OBRA, FLETE, COMBUSTIBLE, HERRAMIENTAS, SERVICIOS, IMPUESTOS, OTROS |
| Otras | CATEGORÍAS DIRECTAS, CATEGORÍAS INDIRECTAS, CONDICIÓN DE PAGO, TIPO DE VARIACIÓN |

### 8.2 Divergencias documentación ↔ MVP

| # | Documentación | MVP real | Impacto |
|---|---|---|---|
| D-01 | Google Sheets + Apps Script, triggers `onEdit()` | Aplicación web SPA en Vercel | Los CU son válidos a nivel funcional; los mecanismos técnicos (triggers, `.gs`) no son verificables |
| D-02 | `11_FLUJO_FONDOS` — "prioridad estratégica máxima" | **No existe** | 23 CU sin pantalla. Es el módulo más valorado por el Roadmap |
| D-03 | `10_CAJA_BANCOS` | **No existe** | 8 CU sin pantalla. El dashboard no muestra saldos por cuenta |
| D-04 | `08_CUENTAS_CLIENTES` con estados de mora | **No existe** | 8 CU sin pantalla |
| D-05 | `03_COMPRAS` como módulo | **No existe**; aparentemente absorbido por `/egresos` | 14 CU a re-mapear. Sin compras no hay `SALDO_COMPRA` ni estado Pendiente/Parcial/Pagado |
| D-06 | `0A_CLIENTES` como maestro | Sin módulo propio | Los clientes aparecen embebidos en ventas |
| D-07 | 5 categorías económicas (COSTO MAT, COSTO M.O., IND. VENDIDOS, IMPUESTOS, COMERCIAL) | TIPO DE EGRESO con 8 valores + CATEGORÍAS DIRECTAS/INDIRECTAS | **Modelo económico distinto.** Afecta todo el cálculo de KPI |
| D-08 | ESTADO_OP: Pendiente anticipo / Cobro parcial / Cobrado | Pendiente, Planificado, En fabricación, En montaje, Entregado, Cerrado | Los estados del MVP son **operativos de taller**, no de cobranza. CU-VE-08 a CU-VE-10 no aplican como están escritos |
| D-09 | `12_KPI_OBRAS` con SCORE A/B/C/D | `/variaciones` y `/aprendizajes` | Nombres y probablemente lógica distintos; falta confirmar si calculan SCORE |
| D-10 | `99_LOGS` de auditoría del sistema | `/mis-registros` — historial de carga por usuario | No es un log de auditoría; no cumple RN-07 |
| D-11 | 3 actores documentados | 2 perfiles | Comercial y Administración quedaron fusionados en `CARGA` |

### 8.3 Observaciones (candidatas a defecto — requieren confirmación)

| ID | Severidad | Observación |
|---|---|---|
| **OBS-01** | Media | **Restricción de confidencialidad inconsistente.** `CARGA` tiene bloqueado `/dashboard`, pero accede a `/ventas` (todas las ventas con montos), `/proveedores` (SALDO CC por proveedor) e `/ingresos`/`/egresos`. El "TOTAL A COBRAR" del tablero es derivable de datos que `CARGA` sí ve. Si el objetivo es ocultar información financiera, el bloqueo no lo logra. |
| **OBS-02** | **Alta** | **`CARGA` puede editar y eliminar proveedores.** En `/proveedores` los botones "Editar" y "Eliminar" están disponibles para el perfil de carga. Para un perfil de data-entry, `Eliminar` sobre un maestro con saldo de cuenta corriente es un permiso de riesgo. |
| **OBS-03** | Media | **Estado vacío mostrado durante la carga.** En una primera pasada con menor tiempo de espera, `/presupuestos` mostró "0 presupuestos — No hay presupuestos que coincidan con el filtro" e `/ingresos` mostró "Sin ingresos", cuando en realidad **sí había datos**. La app muestra el empty-state en lugar de un indicador de carga, lo que induce a error. |
| **OBS-04** | ~~Media~~ → **Alta** | **Redirección post-login rota en el perfil de carga.** Reproducción dirigida del 2026-08-06: **4 de 8 logins (50 %)** terminan en `/unauthorized` en vez de `/carga`. `ADMIN` es estable (8/8). Promovido a defecto **DEF-03** — ver [reportes/2026-08-06-presupuestos.md](reportes/2026-08-06-presupuestos.md). |
| **OBS-07** | Media | **El botón de crear desaparece cuando la lista tiene datos.** En `/presupuestos`, *Nuevo presupuesto* solo se muestra en el estado vacío. Con registros cargados no hay acceso a la creación en esa pantalla (verificado: no hay botones de ícono ocultos). El alta sigue disponible desde `/carga` y por `/presupuestos/nuevo`. |
| **OBS-08** | Media | **No se pueden eliminar presupuestos.** La vista de detalle solo ofrece *Guardar presupuesto*, sin acción de eliminar ni anular — a diferencia de `/proveedores`, que sí tiene *Editar* y *Eliminar*. Un registro erróneo solo puede neutralizarse pasándolo a "Cancelado". |
| **OBS-09** | Baja | **El ID contiene espacios.** El identificador real es `PR - 0601` (con espacios alrededor del guion), lo que produce URLs como `/presupuestos/PR%20-%200601`. La documentación especifica `PR-XXXX` sin espacios. Frágil para enlaces e integraciones. |
| **OBS-10** | Baja | **Las fechas se muestran en UTC, no en hora local.** Confirmado: un registro creado el 2026-08-06 por la tarde se lista con `FECHA 07/08/2026`, porque en UTC ya era el día 7. Todo lo cargado después de las 21:00 hora local queda fechado al día siguiente, lo que afecta los filtros por fecha y los totales de "HOY". |
| **OBS-05** | Baja | La pantalla de login no expone encabezados ni etiquetas accesibles (`h1`-`h3` vacíos, sin `<label>` detectables). Afecta accesibilidad y la estabilidad de los selectores de automatización. |
| **OBS-06** | Informativa | **El entorno contiene datos reales de producción**: nombres y apellidos de clientes particulares, razones sociales y datos de contacto de proveedores, y una cartera a cobrar de 8 cifras. Ver §8.4. |

### 8.4 Entorno de pruebas

`porte-mvp.vercel.app` **contiene datos reales de producción**. La exploración inicial fue de solo lectura por esa razón.

**Resuelto el 2026-08-06:** se recibió autorización explícita para crear, editar y eliminar registros. Procedimiento adoptado:

- Todos los registros de prueba llevan el prefijo **`QA-TEST-<corrida>`** en el campo Cliente.
- **No se modifican ni eliminan registros preexistentes.**
- Al cerrar cada tanda se limpian los datos generados. Cuando el módulo no permite eliminar (ver OBS-08), se neutralizan pasándolos a estado "Cancelado" y se deja constancia en el reporte para su borrado a nivel de base de datos.

---

## 9. Ejecución

| Fecha | Alcance | Ejecutados | Pasa | Falla | Reporte |
|---|---|---|---|---|---|
| 2026-08-06 | Permisos (ambos perfiles) + Presupuestos (alta y validaciones) | 26 | 22 | 4 | [2026-08-06-presupuestos.md](reportes/2026-08-06-presupuestos.md) |

Suite automatizada en Playwright + TypeScript con Page Object Model (`tests/`). Los 4 fallos corresponden exactamente a los tres defectos abiertos y quedan fijados como regresión.

### Defectos abiertos

| ID | Severidad | Descripción | Caso |
|---|---|---|---|
| **DEF-01** | Alta | Se aceptan presupuestos con importe total 0, contra la regla `MONTO_TOTAL > 0` | CU-PR-04 |
| **DEF-02** | Alta | Se aceptan costos negativos; ningún campo numérico declara `min=0` | CU-PR-05 |
| **DEF-03** | Alta | El login del perfil de carga falla el 50 % de las veces y cae en `/unauthorized` | CU-RL-02 |

### Nota de automatización

Los formularios no exponen `id`, `name` ni atributo `type` en sus campos, ni usan `<label for>`. Los selectores deben construirse por **posición absoluta** sobre `<input>`, lo que es frágil ante cambios de layout. **Se recomienda al equipo de desarrollo agregar `data-testid`** antes de consolidar la suite automatizada.
