# PORTE — Informe de estado

**Fecha:** 12 de agosto de 2026
**Aplicación:** porte-mvp.vercel.app

---

## De qué se trata este informe

Este documento describe **cómo está hoy la aplicación PORTE**: qué hace bien y qué conviene todavía corregir o definir. Está escrito en lenguaje claro, sin tecnicismos, y cada punto fue verificado probando la aplicación como lo haría un usuario real.

El sistema atravesó una etapa de correcciones importante y hoy se encuentra en un **buen estado operativo**: se puede cotizar, vender, cobrar, pagar y gestionar los maestros, con validaciones que evitan la mayoría de los errores de carga. Lo que queda pendiente son ajustes puntuales y, sobre todo, funciones del diseño original que aún no están construidas.

---

## Lo que la aplicación hace bien

- **El circuito de trabajo completo funciona.** Se carga un presupuesto, y al aceptarlo se convierte automáticamente en una venta (conservando el mismo número). Sobre esa venta se registran los cobros y los pagos, y cada movimiento actualiza solo los saldos y el estado de cobro de la obra. Se cotiza y se carga una sola vez.

- **El sistema valida lo que se carga.** No permite guardar importes imposibles: rechaza presupuestos en cero o con costos negativos, cobros y pagos negativos, y pagos sin datos. Esta validación es sólida: no se puede esquivar ni cargando por otras vías. Es el cambio de fondo más importante, porque mantiene limpios todos los números del negocio.

- **Se pueden corregir y deshacer las cargas.** Presupuestos, cobros, pagos, proveedores y clientes tienen opción de **editar** y de **dar de baja**, con aviso de confirmación. Un error de carga ya no obliga a convivir con el dato equivocado.

- **La información se conserva al editar.** Abrir la ficha de un proveedor o cliente para corregir un dato muestra la información ya cargada; cambiar un campo no borra el resto.

- **El acceso está bien protegido.** Hay dos tipos de usuario (administrador y carga de datos). Un usuario de carga no puede "ascender" a administrador ni ver datos de otros usuarios: la separación de identidades es correcta.

- **Nuevo: un asistente con inteligencia artificial.** Permite cargar presupuestos hablándole en lenguaje natural (por texto, voz o adjuntando la foto/PDF de un comprobante). Entiende el pedido, valida la categoría contra las opciones válidas y pregunta para confirmar. Importante: **respeta las mismas validaciones** que el resto del sistema — probamos pedirle un presupuesto con montos negativos y se negó a cargarlo.

---

## Lo que todavía conviene corregir

### 1. El usuario de carga puede dar de baja proveedores y clientes · Prioridad **Alta**

El usuario de "Carga de datos" puede **dar de baja** proveedores (y clientes), igual que el administrador. Conviene decidir a propósito qué puede y qué no puede hacer cada tipo de usuario: que quien solo carga datos pueda eliminar información maestra es un permiso de riesgo que probablemente no se quiera dar.

*(Atenuante: la baja no borra el registro para siempre — queda inactivo y es recuperable a nivel de base de datos.)*

### 2. La nota de rentabilidad aparece antes de tiempo · Prioridad **Media**

En una obra **todavía en fabricación**, la aplicación ya le pone una nota de rentabilidad ("Buena"). El problema es que esa nota es engañosa: la obra parece muy rentable **solo porque todavía no se gastó lo que falta**. La nota debería mostrarse recién cuando la obra está terminada, para no sacar conclusiones prematuras.

### 3. El bloqueo de pantallas no protege la información · Prioridad **Media / a definir**

Al usuario de carga se le ocultan dos pantallas (el Tablero y la Configuración), pero la misma información sensible —montos de ventas, deudas, saldos— sigue estando a la vista en las otras pantallas que ese usuario sí puede abrir. Si la intención es que cierta gente no vea ciertos números, hoy no se está logrando. Hay que decidir si eso es un problema según quién use cada cuenta.

### 4. Las fechas se muestran con el día cambiado · Prioridad **Baja**

Lo que se carga por la tarde/noche aparece **fechado al día siguiente**, porque el sistema usa la hora de referencia de Londres en lugar de la de Argentina. Afecta los totales de "hoy" y los filtros por fecha: un movimiento de la tarde puede contarse en el día equivocado.

### 5. El campo Teléfono acepta letras · Prioridad **Baja**

El campo Teléfono (en proveedores y clientes) admite letras y símbolos, sin validar el formato. No rompe cuentas, pero ensucia los datos de contacto.

### 6. Un presupuesto aceptado no generó su venta · Prioridad **Baja / a revisar**

La conversión de presupuesto a venta funciona en general, pero se detectó **un caso puntual** (un presupuesto aceptado) que no generó su venta correspondiente, sin una causa evidente. Conviene que el equipo revise por qué ese caso quedó afuera.

---

## Lo que está en los documentos pero no en la aplicación

Los documentos de diseño de PORTE describen un sistema más completo que el publicado. Estas funciones **figuran en el diseño pero todavía no existen** en la aplicación. No las contamos como errores —puede ser un recorte intencional de esta etapa— pero conviene tenerlas a la vista.

### Pantallas que faltan

- **Proyección de flujo de fondos.** Anticipar cuánta plata habrá en 30, 60 y 90 días, cruzando cobros esperados, pagos, cheques a vencer y gastos fijos. El diseño la marca como la función **más importante y de máxima prioridad** de todo el sistema, y hoy **no existe**.
- **Caja y bancos.** Ver, en vivo, cuánta plata hay en cada cuenta. Los movimientos se cargan, pero no hay una vista consolidada de saldos.
- **Cuentas de clientes.** El resumen de cuánto debe cada cliente, hace cuántos días que no paga y si está en mora.
- **Tablero gerencial.** El panel con los grandes indicadores para la dirección (tasa de conversión, liquidez, rentabilidad). Existe una pantalla de "Inicio", pero no reúne todos esos indicadores.
- **Compras** como registro propio. El diseño separa la compra (el compromiso con el proveedor) del pago (la salida de plata); hoy está unificado dentro de Egresos, sin ver el estado de cada compra.

### Diferencias de criterio

- **Clasificación de costos** y **estados de obra**: la aplicación usa listas distintas de las del diseño, lo que cambia cómo se calcularía la rentabilidad y cómo se sigue el avance de una obra.

### Por qué importa

Conviene **aclarar con el equipo** si estas funciones son un recorte intencional de la versión de prueba (trabajo futuro planificado) o un desvío respecto de lo esperado. Llama la atención que la función marcada como más importante en el diseño —la proyección de flujo de fondos— sea justamente una de las que faltan.

---

## Resumen de prioridades

| # | Pendiente | Qué tan grave | Recomendación |
|---|---|---|---|
| 1 | El usuario de carga puede dar de baja proveedores/clientes | **Alto** | Decidir permisos por tipo de usuario |
| 2 | La nota de rentabilidad aparece en obras en curso | Medio | Mostrarla solo en obras terminadas |
| 3 | El bloqueo de pantallas no protege datos | Medio | Definir qué debe ver cada usuario |
| 4 | Fechas con el día cambiado (zona horaria) | Bajo | Ajustar a la hora de Argentina |
| 5 | El teléfono acepta letras | Bajo | Validar el formato |
| 6 | Un presupuesto aceptado sin su venta | Bajo | Revisar el caso puntual |
| — | Funciones del diseño que faltan (flujo de fondos, caja, cuentas de clientes, tablero, compras) | A definir | **Aclarar alcance con el equipo** |

**En una frase:** hoy PORTE registra y controla bien la operación diaria, con validaciones sólidas y un asistente que suma. Lo que queda es afinar permisos y algunos detalles, y definir cuándo se construye el bloque de proyección y análisis (flujo de fondos, caja, tablero) que el diseño considera el corazón del sistema.
