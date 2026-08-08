# PORTE — Informe de hallazgos

**Fecha:** 8 de agosto de 2026

**Aplicación revisada:** porte-mvp.vercel.app

---

## De qué se trata este informe

Revisamos la aplicación PORTE probándola como lo haría un usuario real: cargando presupuestos, registrando cobros y pagos, entrando con los dos tipos de usuario.

Cada punto es algo verificado y reproducible, con una idea clara de qué riesgo trae. Al final hay un resumen de prioridades.

## Lo más urgente

### 1. Editar un proveedor le borra los datos ⚠️ *(lo más grave)*

Cuando uno abre la ficha de un proveedor para **editar** cualquier dato (por ejemplo, corregir un teléfono), el formulario aparece **vacío**, como si el proveedor no tuviera información cargada. Si uno completa solo lo que quería cambiar y guarda, **se borra todo lo demás**: el nombre del contacto, el rubro, el teléfono, todo lo que no se haya vuelto a escribir a mano.

**Por qué importa:** una simple corrección puede hacer perder, sin ningún aviso, toda la información de un proveedor. Y esa información no se puede recuperar desde la aplicación. Es el problema más peligroso que encontramos, porque destruye datos en una acción cotidiana.

---

### 2. Al iniciar sesión, el usuario de carga entra "rebotado" la mitad de las veces

El usuario de "Carga de datos" (el que se usa en el día a día) **falla al entrar aproximadamente 1 de cada 2 veces**: en lugar de llevarlo a su pantalla, le muestra un cartel de "Acceso denegado". Hay que volver a intentar. El usuario administrador no tiene este problema.

**Por qué importa:** reintentar el ingreso una y otra vez genera desconfianza en la herramienta. Es intermitente pero muy frecuente.

---

### 3. El sistema acepta montos imposibles

En varias pantallas el sistema **guarda importes que no tienen sentido**, sin avisar nada:

- **Presupuestos:** permite guardar un presupuesto con importe **cero**, o con costos **negativos** (por ejemplo, "materiales: −5.000").
- **Cobros (ingresos):** permite registrar un cobro de **monto negativo** (por ejemplo, cobrar "−500") sobre una venta real.
- **Pagos (egresos):** permite registrar un pago **negativo**, e incluso un pago **totalmente vacío** (sin monto, sin proveedor y sin obra asociada).

**Por qué importa:** todos los números del sistema (cuánto se vendió, cuánto se cobró, cuánta plata hay en caja, la rentabilidad de cada obra) se construyen sumando estos registros. Si entran valores imposibles, **todos los reportes quedan mal**. Un cobro negativo, por ejemplo, "descobra" plata que en realidad sí entró. Es el problema de fondo que más ensucia la información del negocio.

---

### 4. El usuario de carga puede modificar y dar de baja proveedores

El usuario de "Carga de datos" puede **editar** proveedores y **darlos de baja**, igual que el administrador. Combinado con el problema N° 1 (editar borra datos), significa que ese usuario puede, sin querer, vaciar la ficha de un proveedor o quitarlo de la lista.

**Por qué importa:** conviene decidir a propósito qué puede y qué no puede hacer cada tipo de usuario. Que quien solo carga datos pueda borrar información maestra es un riesgo que probablemente no se quiera correr. (La baja no borra el proveedor "para siempre" — queda inactivo y es recuperable por quien administre la base de datos.)

---

## Inconsistencias de menor gravedad

### 5. El botón para crear presupuestos desaparece cuando ya hay presupuestos cargados

En la pantalla de Presupuestos, el botón "Nuevo presupuesto" **solo aparece cuando la lista está vacía**. Una vez que hay presupuestos cargados, el botón desaparece de esa pantalla. Todavía se puede crear uno desde la pantalla de "Carga", pero es confuso: el acceso desaparece justo cuando el módulo está en uso normal.

### 6. No se pueden borrar presupuestos ni movimientos

Los presupuestos, cobros y pagos **no tienen opción de eliminar ni de corregir** una vez cargados. Si se registra algo por error, no hay forma de deshacerlo desde la aplicación (lo más que se puede es marcar un presupuesto como "Cancelado"). Los proveedores sí se pueden dar de baja.

**Por qué importa:** en el uso diario los errores de carga son inevitables. No poder corregirlos obliga a convivir con datos equivocados o a pedir intervención técnica.

### 7. Las fechas se muestran con el día cambiado

Todo lo que se carga por la tarde/noche aparece **fechado al día siguiente**. Por ejemplo, algo cargado el 6 a la tarde figura como del día 7. Es un problema de zona horaria (el sistema usa la hora de Londres en lugar de la de Argentina).

**Por qué importa:** afecta los totales de "hoy" (lo ingresado hoy, lo egresado hoy) y los filtros por fecha. Un movimiento de la tarde puede contarse en el día equivocado al cerrar la jornada.

### 8. El bloqueo de pantallas no protege realmente la información

Al usuario de carga se le ocultan dos pantallas (el Tablero y la Configuración), pero la misma información sensible —montos de ventas, deudas, saldos— **sigue estando a la vista** en las otras pantallas que ese usuario sí puede abrir. 

**Por qué importa:** si la intención es que cierta gente no vea ciertos números, hoy no se está logrando. Hay que decidir si eso es un problema o no según quién use cada cuenta.

---

## Sobre seguridad

Revisamos si el usuario de carga podía "hacerse pasar" por administrador o meterse donde no debe. **La buena noticia:** eso está bien protegido — no pudimos ascender de usuario de carga a administrador, ni ver datos de otros usuarios.

**La contraparte:** las reglas que impiden cargar montos imposibles (problema N° 3) están puestas solo en la "pantalla", no en el "cerebro" del sistema. Por eso se pueden esquivar. La recomendación de fondo es mover esas reglas al núcleo del sistema, para que ningún dato imposible pueda entrar, venga de donde venga.

---

## Lo que está en los documentos pero no en la aplicación

Los documentos de diseño de PORTE describen un sistema más completo que el que hoy está publicado. Al comparar uno con otro, encontramos varias funciones que **figuran en el diseño pero no existen en la aplicación**.

### Pantallas completas que faltan

- **Proyección de flujo de fondos.** Es la herramienta para anticipar cuánta plata habrá en 30, 60 y 90 días, cruzando lo que se espera cobrar, lo que hay que pagar y los cheques a vencer. Los documentos la señalan como la función **más importante y de máxima prioridad** de todo el sistema. Hoy **no existe**.
- **Caja y bancos.** La pantalla para ver, en vivo, cuánta plata hay en cada cuenta (banco, billetera virtual, efectivo). Hoy **no existe** como pantalla; los movimientos se cargan, pero no hay una vista consolidada de saldos.
- **Cuentas de clientes.** El resumen de cuánto debe cada cliente, hace cuántos días que no paga y si está en mora. Hoy **no existe**.
- **Tablero gerencial.** El panel con los grandes indicadores del negocio para la dirección (tasa de conversión de presupuestos, liquidez, rentabilidad). Existe una pantalla de "Inicio", pero no reúne los indicadores que el diseño describe.
- **KPI / rentabilidad por obra.** El módulo que compara, obra por obra, lo presupuestado contra lo realmente gastado y le pone una nota (buena/regular/mala). En la aplicación hay pantallas parecidas ("Variaciones", "Aprendizajes"), pero no está claro que calculen esa nota como pide el diseño.

### Registros/maestros que faltan

- **Compras** como registro propio. El diseño separa "la compra" (el compromiso con el proveedor) del "pago" (la salida de plata). En la aplicación eso está unificado dentro de Egresos, y no se ve el estado de cada compra (pendiente, parcial, pagada).
- **Clientes** como listado propio. El diseño prevé una base de clientes; en la aplicación los clientes aparecen sueltos dentro de las ventas, sin una pantalla para gestionarlos.

### Diferencias de criterio (no faltantes, pero distintos)

- **Cómo se clasifican los costos.** El diseño usa cinco categorías económicas fijas (materiales, mano de obra, indirectos, impuestos, comercial). La aplicación usa otra lista distinta. Esto **afecta cómo se calcularía la rentabilidad** de cada obra.
- **Los estados de una obra.** En la aplicación son estados de taller (pendiente → planificado → en fabricación → en montaje → entregado → cerrado). En el diseño estaban pensados en función del cobro (pendiente de anticipo → cobro parcial → cobrado). Son dos miradas distintas del mismo proceso.

### Por qué esto importa

Estas diferencias cambian **qué consideramos un error y qué consideramos "todavía no construido"**. Por eso es la **primera cosa que conviene aclarar** con el equipo de desarrollo:

- Si estas funciones son un recorte **intencional** de la versión de prueba, quedan como trabajo futuro planificado y no hay nada que corregir.
- Si se esperaba que ya estuvieran, entonces hay un desvío importante entre lo diseñado y lo construido.

En particular, llama la atención que la función marcada como **más importante en el diseño (la proyección de flujo de fondos) sea justamente una de las que no está**. Vale la pena confirmar si eso es deliberado.

---

## Resumen y prioridades sugeridas

| # | Hallazgo | Qué tan grave | Recomendación |
|---|---|---|---|
| 1 | Editar un proveedor borra sus datos | **Crítico** | Corregir cuanto antes |
| 3 | Se aceptan montos imposibles (0, negativos, vacíos) | **Alto** | Corregir en el núcleo del sistema |
| 2 | El usuario de carga falla al entrar la mitad de las veces | **Alto** | Corregir cuanto antes |
| 4 | El usuario de carga puede editar/dar de baja proveedores | **Alto** | Decidir permisos por tipo de usuario |
| 7 | Fechas con el día cambiado | Medio | Ajustar zona horaria |
| 6 | No se pueden corregir/borrar cargas erróneas | Medio | Evaluar agregar edición/borrado |
| 5 | El botón de crear presupuesto desaparece | Medio | Mostrarlo siempre |
| 8 | El bloqueo de pantallas no protege datos | Medio | Definir qué debe ver cada usuario |
| — | Funciones del diseño que no están en la app (flujo de fondos, caja, cuentas de clientes, tablero, compras) | A definir | **Aclarar alcance primero** |
