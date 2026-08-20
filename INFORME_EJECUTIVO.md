# PORTE — Informe de estado

**Fecha:** 20 de agosto de 2026
**Aplicación:** porte-mvp.vercel.app

---

## De qué se trata este informe

Este documento describe **cómo está hoy la aplicación PORTE**: qué hace bien y qué conviene todavía corregir o definir. Está escrito en lenguaje claro, sin tecnicismos, y cada punto fue verificado probando la aplicación —tanto como la usaría una persona real como enviando datos directamente al sistema, para distinguir lo que valida la pantalla de lo que valida el sistema por dentro.

El sistema atravesó una etapa de correcciones y crecimiento importante, y hoy se encuentra en un **buen estado operativo**: se puede cotizar, vender, cobrar, pagar, gestionar los maestros y, además, **proyectar la liquidez**. Lo que queda pendiente son ajustes de **permisos e integridad de datos**, algunos detalles menores y funciones del diseño original que aún no están construidas.

---

## Lo que la aplicación hace bien

- **El circuito de trabajo completo funciona.** Se carga un presupuesto, y al aceptarlo se convierte automáticamente en una venta (conservando el mismo número). Sobre esa venta se registran los cobros y los pagos, y cada movimiento actualiza los saldos y el estado de cobro de la obra. Se cotiza y se carga una sola vez.

- **La interfaz evita los errores de carga habituales.** Al usar las pantallas, el sistema no deja guardar importes imposibles: bloquea presupuestos en cero o con costos negativos, cobros y pagos negativos, y pagos sin datos. Para el uso diario, esto mantiene los números limpios. *(Con un matiz importante sobre dónde vive esta validación: ver el punto 2 de la sección siguiente.)*

- **Se pueden corregir y deshacer las cargas.** Presupuestos, cobros, pagos, proveedores y clientes tienen opción de **editar** y de **dar de baja**, con aviso de confirmación. Un error de carga ya no obliga a convivir con el dato equivocado.

- **La información se conserva al editar.** Abrir la ficha de un proveedor o cliente para corregir un dato muestra la información ya cargada; cambiar un campo no borra el resto.

- **La identidad de los usuarios está protegida.** Hay dos tipos de usuario (administrador y carga de datos). Se verificó directamente que un usuario de carga **no puede ascender a administrador** ni **modificar la ficha de otro usuario**: ambos intentos son rechazados por el sistema. Esta es la protección de fondo y se mantiene firme.

- **Proyecta la liquidez (módulo Finanzas).** La aplicación muestra cuánta plata hay en cada cuenta (banco, billeteras, efectivo) y, sobre todo, **una proyección de caja hacia adelante**: anticipa en qué fecha la caja se quedaría en negativo (el "descalce"), cuál sería el saldo mínimo y qué cobertura haría falta, cruzando cobros, pagos, cheques y compromisos. Es la función que el diseño consideraba la **más importante** de todo el sistema, y hasta hace poco no existía.

- **El cliente de un presupuesto es un dato real.** Al cotizar, el cliente se elige de una lista (ya no se escribe suelto) y el sistema **exige que exista de verdad**: si se intenta cargar un cliente inexistente, lo rechaza. Esta validación sí la aplica el sistema por dentro, no solo la pantalla.

- **Un asistente con inteligencia artificial.** Permite cargar presupuestos hablándole en lenguaje natural (por texto, voz o adjuntando la foto/PDF de un comprobante). Entiende el pedido, valida la categoría contra las opciones válidas y pregunta para confirmar. Respeta las mismas validaciones de la interfaz — al pedirle un presupuesto con montos negativos, se negó a cargarlo.

---

## Lo que todavía conviene corregir

### 1. El usuario de carga puede dar de baja proveedores y clientes · Prioridad **Alta**

El usuario de "Carga de datos" puede **dar de baja** proveedores (y clientes), igual que el administrador. Conviene decidir a propósito qué puede y qué no puede hacer cada tipo de usuario: que quien solo carga datos pueda eliminar información maestra es un permiso de riesgo que probablemente no se quiera dar.

*(Atenuante: la baja no borra el registro para siempre — queda inactivo y es recuperable.)*

### 2. La validación de montos vive solo en la pantalla, no en el sistema · Prioridad **Media / Alta**

Este punto **corrige una afirmación de informes anteriores.** La pantalla bloquea los montos imposibles (cero, negativos), y eso cubre el uso normal. Pero se comprobó que **esa validación existe únicamente en la interfaz**: el sistema por dentro **sí acepta** un presupuesto con importe cero o con costos negativos cuando el dato entra por fuera del formulario.

Importa porque la aplicación se comunica directamente con la base de datos desde el navegador: cualquier usuario con sesión (incluso el de carga) que no use la pantalla podría meter un número inválido. No es una falla visible en el día a día, pero **deja la puerta abierta a datos sucios** que ensuciarían los totales y la rentabilidad.

**Recomendación:** repetir la validación de montos también en la base de datos (que rechace importes ≤ 0 y costos negativos), como ya se hace correctamente con el cliente. Así la regla vale siempre, se cargue por donde se cargue.

### 3. El bloqueo de pantallas no protege la información · Prioridad **Media / a definir**

Al usuario de carga se le ocultan dos pantallas (el Tablero y la Configuración), pero la misma información sensible —montos de ventas, deudas, saldos— sigue estando a la vista en las otras pantallas que ese usuario sí puede abrir. **Con el módulo Finanzas esto se acentúa:** el usuario de carga también puede abrirlo y ver la posición de caja completa de la empresa (incluida la separación de efectivo) y la proyección de liquidez. Si la intención es que cierta gente no vea ciertos números, hoy no se está logrando. Hay que decidir si eso es un problema según quién use cada cuenta.

### 4. Las fechas se muestran con el día cambiado · Prioridad **Baja**

Lo que se carga por la tarde/noche aparece **fechado al día siguiente**, porque el sistema usa la hora de referencia de Londres en lugar de la de Argentina. Afecta los totales de "hoy" y los filtros por fecha: un movimiento de la tarde puede contarse en el día equivocado.

### 5. El campo Teléfono acepta letras · Prioridad **Baja**

El campo Teléfono (en proveedores y clientes) admite letras y símbolos, sin validar el formato. No rompe cuentas, pero ensucia los datos de contacto.

### 6. Un presupuesto aceptado no generó su venta · Prioridad **Baja / a revisar**

La conversión de presupuesto a venta funciona en general, pero se detectó **un caso puntual** (un presupuesto aceptado) que no generó su venta correspondiente, sin una causa evidente. Conviene que el equipo revise por qué ese caso quedó afuera.

### 7. El usuario de carga ve la ficha de los demás usuarios · Prioridad **Baja**

El usuario de carga puede ver el **nombre y el rol** del administrador (antes solo veía su propia ficha). Es exposición de datos menores —no de contraseñas ni de nada crítico— y no permite modificar nada, pero conviene ajustarlo si se quiere que cada usuario vea solo lo suyo.

---

## Lo que está en los documentos pero no en la aplicación

Los documentos de diseño de PORTE describen un sistema más completo que el publicado. Estas funciones **figuran en el diseño pero todavía no existen** en la aplicación. No las contamos como errores —puede ser un recorte intencional de esta etapa— pero conviene tenerlas a la vista.

> **Buena noticia:** las dos pantallas más importantes que faltaban —**Caja y bancos** y la **Proyección de flujo de fondos**— ya se construyeron (módulo Finanzas). La lista de abajo es lo que todavía queda.

### Pantallas que faltan

- **Cuentas de clientes.** El resumen de cuánto debe cada cliente, hace cuántos días que no paga y si está en mora.
- **Tablero gerencial.** El panel con los grandes indicadores para la dirección (tasa de conversión, liquidez, rentabilidad). Existe una pantalla de "Inicio", pero no reúne todos esos indicadores.
- **Compras** como registro propio. El diseño separa la compra (el compromiso con el proveedor) del pago (la salida de plata); hoy está unificado dentro de Egresos, sin ver el estado de cada compra.

### Diferencias de criterio

- **Clasificación de costos** y **estados de obra**: la aplicación usa listas distintas de las del diseño, lo que cambia cómo se calcularía la rentabilidad y cómo se sigue el avance de una obra.

### Por qué importa

Conviene **aclarar con el equipo** si estas funciones son un recorte intencional de la versión de prueba (trabajo futuro planificado) o un desvío respecto de lo esperado.

---

## Resumen de prioridades

| # | Pendiente | Qué tan grave | Recomendación |
|---|---|---|---|
| 1 | El usuario de carga puede dar de baja proveedores/clientes | **Alto** | Decidir permisos por tipo de usuario |
| 2 | La validación de montos vive solo en la pantalla, no en el sistema | **Medio / Alto** | Validar los montos también en la base de datos |
| 3 | El bloqueo de pantallas no protege datos (agravado con Finanzas) | Medio | Definir qué debe ver cada usuario |
| 4 | Fechas con el día cambiado (zona horaria) | Bajo | Ajustar a la hora de Argentina |
| 5 | El teléfono acepta letras | Bajo | Validar el formato |
| 6 | Un presupuesto aceptado sin su venta | Bajo | Revisar el caso puntual |
| 7 | El usuario de carga ve la ficha de otros usuarios | Bajo | Limitar la lectura a la propia ficha |
| — | Funciones del diseño que faltan (cuentas de clientes, tablero gerencial, compras) | A definir | **Aclarar alcance con el equipo** |

**En una frase:** hoy PORTE registra, controla **y proyecta** bien la operación diaria —al ciclo de cotizar–vender–cobrar–pagar se sumó la proyección de liquidez, la función que el diseño consideraba central—. Lo que queda es afinar **permisos** (quién puede dar de baja maestros y quién debe ver la información financiera) y **cerrar la validación de montos del lado del sistema**, además de algunos detalles menores.
