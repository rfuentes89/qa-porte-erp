# Re-verificación tras la actualización de la app

**Fecha:** 12 de agosto de 2026
**Motivo:** el equipo técnico avisó de una actualización. Se re-verificaron todos los defectos y observaciones reportados.
**Método:** suite automatizada completa (48 tests) + verificación manual dirigida con Playwright MCP para lo que la suite no cubre.

---

## Resumen: 8 corregidos, 4 abiertos

| | Defecto | Estado | Evidencia |
|---|---|---|---|
| **DEF-05** | Editar un proveedor/cliente borra los datos | ✅ **CORREGIDO** | El modal de edición ahora **precarga** los datos (verificado en Proveedores y Clientes). Tests CU-MA-11/12 en verde. |
| **DEF-06** | Validaciones solo en el frontend | ✅ **CORREGIDO** | El backend ahora **rechaza** por API un presupuesto sin cliente y con costo negativo. Es la corrección de raíz. |
| **DEF-01** | Se aceptan presupuestos con importe 0 | ✅ **CORREGIDO** | CU-PR-04 en verde: el importe 0 se rechaza. |
| **DEF-02** | Se aceptan costos negativos | ✅ **CORREGIDO** | CU-PR-05 en verde. |
| **DEF-07** | Ingreso con monto negativo | ✅ **CORREGIDO** | CU-IN-06 en verde. |
| **DEF-08** | Egreso negativo / huérfano | ✅ **CORREGIDO** | CU-EG-04/11 en verde. |
| **DEF-09** | Módulo Clientes sin tabla en la base | ✅ **CORREGIDO** | La tabla `clientes` existe; el alta persiste (verificado con un cliente de prueba que sobrevive a la recarga). |
| **DEF-03** | Login del perfil de carga falla el 50 % | ✅ **CORREGIDO (probable)** | 6 de 6 logins consecutivos aterrizaron en `/carga`. Antes fallaba ~50 %; 6/6 seguidos por azar sería 1,5 %. Conviene un monitoreo breve para confirmar. |
| **DEF-04** | El perfil de carga puede dar de baja proveedores | ❌ **SIGUE ABIERTO** | El test DEF-04 falla: el perfil de carga creó y **eliminó** un proveedor. El permiso de escritura no se restringió. |
| **DEF-10** | Nota de rentabilidad en obras en curso | ❌ **SIGUE ABIERTO** | PR-0546 ("En fabricación", gastado $620.000 de $2.533.000 estimado) sigue mostrando nota **"Buena"**. |
| **OBS-16** | El campo Teléfono acepta letras | ❌ **SIGUE ABIERTO** | Se guardó un teléfono `ABCdef-letras!` en Clientes; persiste. |
| **OBS-17** | Un presupuesto Aceptado (PR-0584) no aparece en Ventas | ❌ **SIGUE ABIERTO** | Sigue sin generar su venta. |

**La corrección más importante:** DEF-06. Al validar en el backend, la actualización resolvió de un golpe toda la familia de "montos imposibles" (DEF-01, DEF-02, DEF-07, DEF-08) y el defecto crítico DEF-05. Es exactamente la corrección de raíz que recomendaba el informe.

---

## Novedad: módulo "Asistente" (IA)

La actualización agregó un **Asistente** en el menú: un chat que dice *"Hola, soy el asistente de Porte. Contame qué presupuesto querés cargar — por texto o por audio."* Corresponde a la "Integración IA" prevista en el Roadmap V2 (carga por lenguaje natural). No se probó su funcionamiento en esta pasada; queda como superficie nueva a cubrir.

---

## Lo que sigue igual

- **Bloque 4 del Roadmap sigue ausente:** Flujo de fondos, Caja y bancos, Cuentas de clientes y Compras siguen sin existir (rutas 404). La actualización se enfocó en corregir validaciones y sumar Clientes + Asistente, no en construir el bloque analítico.

---

## Impacto en la suite de tests

- **La feature Asistente rompió 2 Page Objects.** El botón "+" de alta se ubicaba como "último botón sin texto"; el nuevo botón flotante del Asistente pasó a capturar ese selector, rompiendo los tests de alta de Proveedores y Gastos fijos. **Corregido:** ahora el "+" se ubica dentro del encabezado (junto al título), evitando el Asistente.
- **Tests actualizados por corrección:** el test de DEF-06 (CU-RL-20) se invirtió — antes documentaba que el backend aceptaba datos inválidos; ahora verifica que los **rechaza**, y queda como guarda de regresión.
- **Estado final de la suite:** verde salvo el test de **DEF-04**, que sigue rojo a propósito porque el defecto sigue abierto.

---

## Recomendación

Cerrar en el catálogo los 8 defectos corregidos y concentrar el trabajo restante en:

1. **DEF-04** — restringir a nivel de política (RLS) que el perfil de carga pueda dar de baja maestros. Es el único defecto de permisos que queda.
2. **DEF-10** — mostrar la nota de rentabilidad solo en obras Entregadas/Cerradas.
3. **OBS-16** — validar el formato del teléfono.
4. **OBS-17** — revisar por qué PR-0584 no generó su venta.
5. Confirmar **DEF-03** con un monitoreo breve del login de carga.
