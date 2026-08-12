/**
 * Textos de la interfaz, verificados contra la app real.
 *
 * Fuente única para las cadenas que los tests asertan o buscan. Convención del
 * scaffold ("single source of truth per value class" + "verify message strings
 * against the real app"): ningún mensaje de UI se escribe suelto en un spec.
 *
 * Las rutas de la aplicación viven en `perfiles.ts` (`RUTAS`), que ya cumple el
 * mismo rol para las URLs.
 */

/** Mensajes que la aplicación muestra y que los tests verifican. */
export const MENSAJES = {
  /** Cartel al acceder a una ruta sin permiso (perfil de carga en /dashboard, /config). */
  accesoDenegado: 'No tenés permisos para ver esta página',
  /** Aviso del diálogo de baja de proveedor: la baja es lógica, no física. */
  bajaLogicaProveedor: 'No se borra físicamente',
} as const;

/** Etiquetas de botones/acciones reutilizadas por los Page Objects. */
export const BOTONES = {
  guardar: 'Guardar',
  guardarPresupuesto: 'Guardar presupuesto',
  editar: 'Editar',
  eliminar: 'Eliminar',
  cancelar: 'Cancelar',
  nuevoCliente: 'Nuevo cliente',
} as const;
