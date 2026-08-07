# Reporte de ejecución — Módulo Presupuestos

**Fecha:** 2026-08-06
**Entorno:** MVP en producción
**Perfil:** `ADMIN`
**Alcance:** primeros casos P0 del módulo Presupuestos + reproducción dirigida de OBS-04

---

## Resumen

| Resultado | Cantidad |
|---|---|
| ✅ Pasa | 4 |
| ❌ Falla | 3 |
| **Total ejecutado** | **7** |

**2 defectos funcionales** de validación y **1 defecto de autenticación** confirmado por reproducción.

---

## Casos ejecutados

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| CU-PR-03 | Presupuesto sin CLIENTE debe rechazarse | ✅ **Pasa** | El formulario no navega y marca el campo obligatorio |
| CU-PR-04 | Presupuesto con importe total 0 debe rechazarse | ❌ **Falla** | Se guardó y quedó como PR-0597 / PR-0599 |
| CU-PR-05 | Presupuesto con costo negativo debe rechazarse | ❌ **Falla** | Aceptó `Costo materiales = -5000`; quedó como PR-0598 / PR-0600 |
| CU-PR-01 | Alta de presupuesto válido | ✅ **Pasa** | PR-0601 creado correctamente |
| CU-PR-02 | Aparece en el listado con ID `PR-XXXX` | ✅ **Pasa** | `PR - 0601 · Pedido · MONTO $ 1.000.000,00` |
| CU-TR-09 | Campo numérico no acepta texto | ✅ **Pasa** | Bloqueado por el navegador vía `type=number` |
| CU-RL-02 | Login del perfil de carga lleva a su pantalla de inicio | ❌ **Falla** | 4 de 8 intentos terminaron en `/unauthorized` |

**Verificación complementaria (CU-PR-01):** el `MONTO_TOTAL` se calculó como la suma de las seis categorías cargadas (400.000 + 200.000 + 50.000 + 100.000 + 50.000 + 200.000 = **$1.000.000**), consistente con lo esperado.

---

## Defectos

### DEF-01 — Se aceptan presupuestos con importe total 0 · Severidad **Alta** · `CU-PR-04`

La documentación exige `MONTO_TOTAL > 0` (Documento 2, Sprint 1 §5). El sistema guarda el presupuesto con todas las categorías de costo vacías.

**Reproducción**
1. Entrar a `/presupuestos/nuevo`.
2. Completar únicamente el campo *Cliente*.
3. Dejar los seis campos numéricos vacíos.
4. Pulsar *Guardar presupuesto*.

**Resultado:** se guarda y aparece en el listado con importe $0,00.
**Esperado:** rechazo con mensaje de validación.

**Impacto:** un presupuesto de importe 0 que pase a "Aceptado" genera una venta con `VENTA_FINAL = 0`, lo que distorsiona el backlog comercial, la tasa de conversión y —al dividir por `VENTA_FINAL`— el cálculo de rentabilidad del KPI.

---

### DEF-02 — Se aceptan costos negativos · Severidad **Alta** · `CU-PR-05`

**Reproducción**
1. Entrar a `/presupuestos/nuevo`.
2. Completar *Cliente*.
3. Cargar `Costo materiales = -5000`.
4. Pulsar *Guardar presupuesto*.

**Resultado:** se guarda con el costo negativo.
**Esperado:** rechazo.

**Impacto:** un costo negativo infla artificialmente el beneficio estimado y contamina el análisis de desvíos, que es el propósito declarado del módulo de aprendizaje. Ninguno de los campos numéricos declara `min=0`.

---

### DEF-03 — El login del perfil de carga falla el 50 % de las veces · Severidad **Alta** · `CU-RL-02`

Antes registrado como OBS-04 con severidad media. La reproducción dirigida lo confirma como defecto sistemático.

**Reproducción:** iniciar sesión con el perfil de carga en una sesión limpia. Repetir.

| Intento | Aterrizaje | | Intento | Aterrizaje |
|---|---|---|---|---|
| 1 | ❌ `/unauthorized` | | 5 | ✅ `/carga` |
| 2 | ❌ `/unauthorized` | | 6 | ✅ `/carga` |
| 3 | ✅ `/carga` | | 7 | ✅ `/carga` |
| 4 | ❌ `/unauthorized` | | 8 | ❌ `/unauthorized` |

**Resultado:** 4 de 8 (50 %) terminan en "🔒 Acceso denegado".
**Esperado:** 8 de 8 en `/carga`.

**Causa probable:** condición de carrera entre la redirección por defecto a `/dashboard` y la resolución asíncrona del rol. El perfil `ADMIN` no presenta el problema (8 de 8 estables en `/dashboard`), lo que es consistente con esa hipótesis: `ADMIN` sí tiene permiso sobre la ruta por defecto.

**Impacto:** el usuario de carga —el de uso diario— debe reintentar el login la mitad de las veces. Es el defecto de mayor impacto percibido.

---

## Observaciones nuevas

### OBS-07 — El botón de crear desaparece cuando la lista tiene datos · Severidad **Media**

En `/presupuestos` el botón *Nuevo presupuesto* solo se muestra en el estado vacío. Con registros cargados no existe ningún acceso a la creación en esa pantalla (verificado: no hay botones de ícono ocultos). El alta sigue siendo accesible desde `/carga` o entrando directo a `/presupuestos/nuevo`.

### OBS-08 — No se pueden eliminar presupuestos · Severidad **Media**

La vista de detalle (`/presupuestos/{id}`) solo ofrece *Guardar presupuesto*. No hay acción de eliminar ni de anular, a diferencia de `/proveedores`, que sí ofrece *Editar* y *Eliminar*. Un registro cargado por error solo puede neutralizarse cambiándole el estado a "Cancelado".

### OBS-09 — El ID contiene espacios y viaja codificado en la URL · Severidad **Baja**

El identificador es literalmente `PR - 0601` (con espacios alrededor del guion), lo que produce URLs como `/presupuestos/PR%20-%200601`. La documentación especifica el formato `PR-XXXX` sin espacios. Es frágil para enlaces, integraciones y automatización.

### OBS-10 — La fecha se muestra en UTC, no en hora local · Severidad **Baja** · *confirmada*

El presupuesto creado el 2026-08-06 por la tarde (hora local) se lista con `FECHA 07/08/2026`.

**Causa confirmada:** al momento de la corrida, la hora UTC ya era `2026-08-07T02:29`. La aplicación muestra la fecha en UTC en lugar de la zona horaria local (Argentina, UTC-3).

**Impacto:** todo registro cargado después de las 21:00 hora local aparece fechado al día siguiente. Afecta el filtro *Desde / Hasta* de `/mis-registros`, los totales de "REGISTROS HOY" e "INGRESADO HOY" de la pantalla de carga, y la imputación de movimientos al cierre del día.

---

## Suite automatizada

Los casos quedaron implementados en Playwright + TypeScript con Page Object Model. Resultado de la corrida completa:

```
26 tests · 22 pasan · 4 fallan
```

Los 4 fallos son exactamente los defectos documentados —la suite los deja fijados como regresión y volverá a verde cuando se corrijan:

| Test | Defecto |
|---|---|
| `CU-RL-02 · el perfil de carga ingresa y aterriza en su pantalla de carga` | DEF-03 |
| `DEF-03 · 6 logins consecutivos` (3 de 6 fallaron en esta corrida) | DEF-03 |
| `CU-PR-04 · rechaza un presupuesto con importe total 0` | DEF-01 |
| `CU-PR-05 · rechaza costos negativos` | DEF-02 |

Los 19 tests de permisos confirman la línea base: `CARGA` accede a las 11 rutas compartidas y es rechazado en `/dashboard` y `/config`, también por URL directa.

> **Nota:** la configuración usa `retries: 0` a propósito. Con reintentos, DEF-03 —que falla el 50 % de las veces— pasaría en el segundo intento y quedaría oculto.

---

## Datos de prueba

Se crearon 8 presupuestos con la marca `QA-TEST` a lo largo de las corridas. Como el módulo no permite eliminar (OBS-08), **quedaron neutralizados con estado "Cancelado"** y descripción `ANULAR - registro de prueba QA, sin validez`:

| ID | Marca |
|---|---|
| PR - 0597 | QA-TEST-0806A-MONTO0 |
| PR - 0598 | QA-TEST-0806A-NEG |
| PR - 0599 | QA-TEST-0806B-MONTO0 |
| PR - 0600 | QA-TEST-0806B-NEG |
| PR - 0601 | QA-TEST-0806B-OK |
| PR - 0602 | QA-TEST-08070229-MONTO0 |
| PR - 0603 | QA-TEST-08070230-NEG |
| PR - 0604 | QA-TEST-08070230-OK |

Limpieza ejecutada con `npx tsx tests/utils/limpiar-datos-qa.ts` — los 8 verificados en estado "Cancelado".

> ⚠️ **Requiere acción:** estos 8 registros deben eliminarse a nivel de base de datos. Al estar en "Cancelado" no afectan el pipeline ni el backlog, pero ocupan números de la secuencia `PR-XXXX`.

---

## Notas de automatización

Los formularios **no exponen `id`, `name` ni atributo `type`** en sus campos, y no usan `<label for>`. Los selectores deben construirse por posición absoluta sobre `<input>`, lo que es frágil ante cambios de layout.

**Recomendación para el equipo de desarrollo:** agregar `data-testid` a los campos y botones de acción. Sin eso, la suite automatizada se romperá ante cualquier reordenamiento del formulario.

Índices relevados en `/presupuestos/nuevo`:

| Índice | Campo |
|---|---|
| 0 | Buscador del encabezado (no pertenece al formulario) |
| 1 | Cliente `*` |
| 2 | Descripción |
| 3-8 | Costo materiales, Costo M.O., Indirectos, Impuestos, Comercial, Beneficio |
| 9 | Vencimiento |
| 10 | Observaciones (`textarea`) |
