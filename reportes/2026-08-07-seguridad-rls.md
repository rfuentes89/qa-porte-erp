# Reporte de seguridad — Row Level Security (Supabase)

**Fecha:** 2026-08-07
**Tipo:** prueba de seguridad a nivel de datos (CU-RL-20 / CU-RL-21)
**Entorno:** MVP beta (autorización explícita del responsable para crear/borrar)
**Alcance:** resolver OBS-11 — ¿los permisos los aplica el backend o solo la interfaz?
**Reproducción:** `npx playwright test tests/seguridad-rls.spec.ts`

---

## Contexto

PORTE es una SPA que consulta **Supabase (PostgREST) directamente desde el navegador** (`https://<proyecto>.supabase.co/rest/v1/…`). No hay servidor propio intermedio. La `apikey` es una clave **publicable** (`sb_publishable…`), pensada para ser pública. Por lo tanto **la única frontera de permisos a nivel de datos son las políticas de Row Level Security (RLS)**; cualquier persona autenticada tiene un JWT con el que puede llamar a la API REST saltándose la interfaz.

Dato clave: el JWT **no contiene el rol**. Ambos perfiles traen `role: authenticated` y `app_metadata` vacío. El rol de negocio vive en la tabla `profiles` (`admin` vs `data_entry`).

---

## Resultados

### ✅ Lo que RLS protege bien

| Prueba | Resultado |
|---|---|
| **Escalada de privilegios** (CARGA hace `PATCH profiles set role=admin` sobre su propia fila) | **Bloqueada.** La operación devuelve 0 filas afectadas; el rol permanece `data_entry`. |
| **Edición del propio perfil** (CARGA cambia `profiles.nombre`) | **Bloqueada.** 0 filas afectadas. |
| **Visibilidad de `profiles`** | Cada usuario ve **solo su propia fila**, admin incluido. |
| **Borrado físico de presupuestos** | No hay política de `DELETE` para **ningún** rol; ni admin puede hacer `DELETE` (el borrado es lógico vía `activo`). |

La protección del vector más crítico —que un usuario de carga se auto-eleve a administrador— **está correctamente implementada**.

### ⚠️ Lo que RLS no cubre

#### DEF-06 — Las validaciones de negocio son solo del frontend · Severidad **Alta**

El perfil de carga insertó por API REST, saltándose la interfaz, un presupuesto que la UI rechaza:

```
POST /rest/v1/presupuestos
{ "cliente": "", "costo_mat": -99999, "estado_comercial": "Cancelado", ... }
-> 201 Created
```

El backend **aceptó un presupuesto sin cliente y con un costo de −99.999**. Las validaciones que en la interfaz bloquean estos casos (DEF-01 importe 0, DEF-02 costos negativos, cliente obligatorio) **no existen a nivel de base de datos**: son controles de JavaScript en el navegador.

**Este es el origen común de DEF-01 y DEF-02.** No alcanza con corregir el formulario: mientras la única barrera sea el frontend, cualquier usuario autenticado —o cualquiera que extraiga el token, que viaja en el navegador— puede inyectar registros financieros inválidos que envenenan todo lo que el sistema calcula encima (KPI, flujo de fondos, tablero).

#### OBS-14 — Toda la base financiera es legible por el perfil de carga vía API · Severidad **Media**

Con el token de carga se leen por REST directo las 9 tablas principales: `presupuestos, ventas, ingresos, egresos, proveedores, gastos_fijos, variaciones, aprendizajes, profiles`. Como el perfil de carga ya ve esos datos en la interfaz, no es una fuga nueva; pero confirma que **la restricción de la UI sobre `/dashboard` no protege ninguna información** (OBS-01): los mismos datos —y más— están a un `fetch` de distancia.

---

## Conclusión sobre OBS-11

**Resuelta.** El backend aplica RLS y protege correctamente lo esencial (rol y escalada de privilegios). Pero **la lógica de validación de negocio no está en el backend**, sino en el frontend, y por lo tanto es evitable. El bloqueo de rutas de la interfaz (`/dashboard`, `/config`) es cosmético en términos de datos: no hay tabla `config` (las listas maestras parecen constantes del frontend), y el tablero solo agrega datos que el perfil de carga ya puede leer.

---

## Recomendaciones

| Prioridad | Acción |
|---|---|
| **Alta** | Mover las validaciones de negocio al backend: `CHECK (monto_total > 0)`, `CHECK (costo_mat >= 0)`, `NOT NULL`/no-vacío en cliente, sobre las tablas `presupuestos`, `ventas`, `ingresos`, `egresos`. Son la única barrera real. |
| **Alta** | Revisar las políticas RLS de escritura por rol: si un `data_entry` no debería dar de baja proveedores (DEF-04), la política `UPDATE`/soft-delete de `proveedores` debe distinguir rol, no solo autenticación. |
| Media | Confirmar que las listas maestras de `/config` no sean escribibles por la API por ningún perfil que no sea admin (no se halló tabla; verificar que efectivamente sean constantes del frontend y no una tabla con otro nombre). |
| Baja | Considerar que la clave publicable + un login de carga expone todo el dataset por API. Aunque es el modelo previsto de Supabase, conviene decidir conscientemente qué tablas deben ser legibles por el rol de carga. |

---

## Nota de método y seguridad de la prueba

- Todas las operaciones destructivas fueron **reversibles**: el intento de escalada se revirtió automáticamente; el presupuesto inyectado se marcó inactivo con el token de admin.
- La sonda quedó como spec de Playwright en TypeScript (`tests/seguridad-rls.spec.ts`), que lee credenciales de `.env` y **no contiene secretos**.
- La `apikey` publicable y los tokens no se versionan: aparecen solo en tráfico y `localStorage` en tiempo de ejecución.
- Autorización: el responsable confirmó por escrito que el entorno es beta sin datos reales y habilitó crear/borrar información.
