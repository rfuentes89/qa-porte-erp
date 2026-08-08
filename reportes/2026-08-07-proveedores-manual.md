# Reporte de sesión manual — Módulo Proveedores

**Fecha:** 2026-08-07
**Tipo:** testing manual / exploratorio
**Entorno:** MVP en producción
**Perfiles:** `ADMIN` y `CARGA`
**Objetivo:** verificar OBS-02 (¿el perfil de carga puede editar y eliminar proveedores?)

---

## Resumen

OBS-02 queda **confirmada y promovida a defecto (DEF-04)**. En el camino apareció un defecto más grave que no estaba en el radar: **editar un proveedor borra todos los campos que no se vuelvan a tipear a mano (DEF-05)**.

| Resultado | |
|---|---|
| Defectos nuevos | 2 (DEF-04, DEF-05) |
| Observaciones nuevas | 3 (OBS-11, OBS-12, OBS-13) |
| Hallazgos retractados | 1 (ver *Falsos positivos*) |
| Tests automatizados agregados | 5 |

---

## DEF-05 — Editar un proveedor borra sus datos · Severidad **Crítica**

El modal de edición **abre con todos los campos vacíos** en lugar de precargar los valores del proveedor. Al guardar, los campos vacíos sobrescriben los datos existentes.

**Reproducción**

1. Entrar a `/proveedores`.
2. Pulsar *Editar* en cualquier proveedor.
3. Observar que Nombre, Rubro, Contacto, Teléfono, Plazo y Observaciones están vacíos, aunque el encabezado del modal sí muestra el nombre del proveedor.
4. Escribir únicamente un nombre nuevo.
5. Pulsar *Guardar*.

**Verificación controlada** (sobre un proveedor descartable, no sobre datos reales):

| Momento | Estado del registro |
|---|---|
| Tras el alta | `QA-TEST-PROV2` · Rubro `RUBRO-ORIGINAL` · Contacto `CONTACTO-ORIGINAL` |
| Modal de edición | los 6 campos vacíos (`value` y `defaultValue` en blanco, tras 8 s de espera) |
| Tras editar solo el nombre | `QA-TEST-PROV2-RENOMBRADO` · **sin rubro** · **sin contacto** |

**Esperado:** el modal precarga los datos actuales y guardar modifica solo lo que se cambió.

**Impacto.** Cualquier corrección menor —un teléfono, una observación— destruye silenciosamente el resto de la ficha. No hay aviso ni confirmación. Sobre proveedores reales con saldo en cuenta corriente, se pierden los datos de contacto de forma irrecuperable desde la interfaz. Es el defecto de mayor riesgo encontrado hasta ahora.

---

## DEF-04 — El perfil de carga tiene permisos de escritura sobre proveedores · Severidad **Alta**

Confirma OBS-02. El perfil de carga puede **editar** y **dar de baja** proveedores, exactamente igual que el administrador.

**Evidencia**

- Los botones *Editar* y *Eliminar* están presentes y habilitados para ambos perfiles (verificado sobre el DOM real: `disabled=false`, `pointer-events:auto`, `opacity:1`).
- El modal de edición ofrece los 7 campos editables y el botón *Guardar* habilitado para el perfil de carga.
- Una edición hecha con el perfil de carga **se persistió** correctamente.
- Una baja hecha con el perfil de carga **se ejecutó**: `PATCH 204` contra el backend y el proveedor desapareció del listado.

**No es solo un tema de interfaz:** el backend acepta la operación. Ocultar los botones no alcanzaría como corrección.

**Atenuante:** la baja es **lógica, no física**. El propio diálogo lo aclara: *"Se dará de baja. No se borra físicamente, queda inactivo."* El registro es recuperable a nivel de base de datos.

**A definir con el negocio:** ¿debe un perfil de carga de datos poder dar de baja maestros? Combinado con DEF-05, el mismo perfil puede además vaciar la ficha de un proveedor sin querer.

---

## Observaciones nuevas

### OBS-11 — El backend es Supabase, consultado directo desde el navegador · Severidad **Alta / a evaluar**

El tráfico de escritura va del cliente a `…supabase.co/rest/v1/proveedores` sin pasar por un servidor propio. La aplicación es de front-end contra la API REST de Supabase.

**Consecuencia:** los permisos **no pueden depender de la interfaz**. Lo único que separa a un perfil de otro a nivel de datos son las políticas de Row Level Security de Supabase. Si son permisivas, el token del perfil de carga puede operar sobre cualquier tabla —incluidas las que la interfaz le bloquea, como configuración— usando peticiones directas.

**No lo probé.** Verificarlo implica escribir directamente contra la base y quería tu visto bueno antes. Es la verificación de seguridad de mayor valor pendiente (corresponde a CU-RL-20 del catálogo).

### OBS-12 — Los diálogos no exponen roles de accesibilidad · Severidad **Media**

Ni el modal de edición ni el de confirmación de baja declaran `role="dialog"` o `aria-modal`. No aparecen en el árbol de accesibilidad.

**Impacto:** un lector de pantalla no anuncia la apertura del diálogo ni confina el foco dentro de él. Un usuario no vidente puede confirmar una baja sin enterarse de que se le preguntó. Además vuelve frágil la automatización, que debe ubicarlos por texto.

### OBS-13 — El botón de alta no tiene nombre accesible · Severidad **Media**

El alta de proveedores es un botón "+" solo-ícono, sin texto, sin `aria-label` y sin `title`. Un lector de pantalla lo anuncia como "botón" a secas. Es también la razón por la que un relevamiento por texto no lo detecta.

---

## Falsos positivos — retractados

> Se dejan documentados a propósito: el camino de diagnóstico es más útil que la conclusión, y este error se va a repetir en otros proyectos.

### ❌ "No se pueden crear proveedores" — **retractado**

Un inventario de botones por texto no encontró ningún acceso al alta, y `/proveedores/nuevo` responde *"Proveedor no encontrado"* (la ruta se interpreta como el id de un proveedor). Conclusión errónea: no existe el alta.

**La realidad:** sí existe, es el botón "+" del encabezado. Al no tener texto ni nombre accesible, es invisible para cualquier inventario textual. **Apareció recién en una captura de pantalla.**

### ❌ "El perfil de carga no puede eliminar" — **retractado**

Tras pulsar *Eliminar*, la consulta al DOM por `[role=dialog]`, `[aria-modal]`, `[class*=modal]` y `[class*=confirm]` no devolvió nada, y el proveedor seguía existiendo. Parecía que el backend rechazaba la operación.

**La realidad:** el diálogo de confirmación **sí se abría** (ver OBS-12: no expone ningún rol ni clase reconocible). Mi verificación simplemente no lo veía, así que nunca se llegó a confirmar la baja. Al anclar el localizador en el texto del diálogo, la baja se ejecutó sin problema.

**Lección aplicable a cualquier sesión de este tipo:** ante un clic que "no hace nada", la captura de pantalla manda sobre el árbol de accesibilidad. Un no-op silencioso casi siempre es un problema de la herramienta, no del producto.

---

## Cobertura automatizada agregada

`tests/pages/ProveedoresPage.ts` + `tests/proveedores.spec.ts`, con las dos rarezas de la pantalla documentadas en el Page Object.

| Test | Caso | Resultado |
|---|---|---|
| Alta de proveedor con todos sus datos | CU-MA-08 | ✅ pasa |
| La baja es lógica, no física | — | ✅ pasa |
| El modal de edición precarga los datos actuales | CU-MA-11 | ❌ DEF-05 |
| Editar un campo no debe borrar los demás | CU-MA-12 | ❌ DEF-05 |
| El perfil de carga no debería poder dar de baja proveedores | DEF-04 | ❌ DEF-04 |

Cada test crea su propio proveedor descartable y lo da de baja al terminar. Los proveedores reales no se tocan en ningún momento.

---

## Datos de prueba

Se crearon 6 proveedores `QA-TEST`, todos dados de baja al cerrar la sesión (verificado: ninguno queda activo). Como la baja es lógica, **siguen existiendo como inactivos en la base** y conviene borrarlos junto con los 8 presupuestos del reporte anterior.

Limpieza: `npx tsx tests/utils/limpiar-datos-qa.ts`, que ahora cubre presupuestos y proveedores.

---

## Nota sobre el entorno de pruebas

El servidor MCP de Playwright quedó configurado en `.mcp.json` sin `--extension` —modo aislado— pero sus herramientas no estaban disponibles en esta sesión, así que el recorrido se hizo con la instalación local de Playwright aplicando la misma metodología: navegar, inspeccionar, verificar contra el DOM real y contra capturas, reproducir dos veces en sesiones limpias antes de afirmar nada.
