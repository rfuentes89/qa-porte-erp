# PORTE — Informe de hallazgos en lenguaje claro

**Fecha:** 8 de agosto de 2026
**Aplicación revisada:** porte-mvp.vercel.app
**Para:** Desarrolladores y Product Owner

---

## De qué se trata este informe

Revisamos la aplicación PORTE probándola como lo haría un usuario real: cargando presupuestos, registrando cobros y pagos, entrando con los dos tipos de usuario. Este documento resume **qué cosas encontramos que no funcionan como deberían**, explicadas sin términos técnicos, y **por qué importan para el negocio**.

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

## Una nota sobre seguridad (con una buena noticia)

Revisamos si el usuario de carga podía "hacerse pasar" por administrador o meterse donde no debe. **La buena noticia:** eso está bien protegido — no pudimos ascender de usuario de carga a administrador, ni ver datos de otros usuarios.

**La contraparte:** las reglas que impiden cargar montos imposibles (problema N° 3) están puestas solo en la "pantalla", no en el "cerebro" del sistema. Por eso se pueden esquivar. La recomendación de fondo es mover esas reglas al núcleo del sistema, para que ningún dato imposible pueda entrar, venga de donde venga.

---

## Algo que conviene aclarar con el equipo: la app no coincide con los documentos

Los documentos de diseño de PORTE describen varias funciones que **hoy no existen en la aplicación**. Las más importantes:

- **Proyección de flujo de fondos** (prever cuánta plata habrá en 30/60/90 días). Los documentos la marcan como la función *más importante* del sistema, y no está.
- **Caja y bancos** (ver el saldo de cada cuenta) y **Cuentas de clientes** (deudas y mora por cliente): tampoco están como pantallas.
- La forma de clasificar los costos y los estados de las obras es **distinta** a la de los documentos.

**Por qué importa:** no sabemos si esto es porque la versión de prueba es un recorte intencional o porque quedó pendiente. **Es la primera cosa que conviene aclarar**, porque cambia qué consideramos "error" y qué "todavía no construido". No lo reportamos como fallas hasta confirmarlo.

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
| — | La app no coincide con los documentos de diseño | A definir | **Aclarar alcance primero** |
