/** Perfiles de la aplicación y sus credenciales. */

export type Rol = 'ADMIN' | 'CARGA';

export interface Credenciales {
  readonly rol: Rol;
  readonly usuario: string;
  readonly clave: string;
  /** Ruta a la que debe aterrizar tras un login exitoso. */
  readonly home: string;
}

function requerir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Copiá .env.example a .env y completala.`);
  }
  return valor;
}

export function credenciales(rol: Rol): Credenciales {
  return rol === 'ADMIN'
    ? { rol, usuario: requerir('PORTE_ADMIN_USER'), clave: requerir('PORTE_ADMIN_PASS'), home: '/dashboard' }
    : { rol, usuario: requerir('PORTE_CARGA_USER'), clave: requerir('PORTE_CARGA_PASS'), home: '/carga' };
}

/** Rutas de la aplicación y qué perfil tiene acceso a cada una. */
export const RUTAS = {
  dashboard: '/dashboard',
  carga: '/carga',
  presupuestos: '/presupuestos',
  presupuestoNuevo: '/presupuestos/nuevo',
  ventas: '/ventas',
  ingresos: '/ingresos',
  egresos: '/egresos',
  proveedores: '/proveedores',
  gastosFijos: '/gastos-fijos',
  variaciones: '/variaciones',
  aprendizajes: '/aprendizajes',
  registros: '/mis-registros',
  perfil: '/profile',
  config: '/config',
} as const;

export type Ruta = (typeof RUTAS)[keyof typeof RUTAS];

/** Ruta a la que redirige la aplicación cuando el perfil no tiene permiso. */
export const RUTA_SIN_PERMISO = '/unauthorized';

/**
 * Línea base de permisos confirmada por exploración (2026-08-06).
 * `CARGA` accede a todo salvo el tablero y la configuración maestra.
 */
export const RUTAS_SOLO_ADMIN: readonly Ruta[] = [RUTAS.dashboard, RUTAS.config];

export const RUTAS_COMPARTIDAS: readonly Ruta[] = [
  RUTAS.carga, RUTAS.presupuestos, RUTAS.ventas, RUTAS.ingresos, RUTAS.egresos,
  RUTAS.proveedores, RUTAS.gastosFijos, RUTAS.variaciones, RUTAS.aprendizajes,
  RUTAS.registros, RUTAS.perfil,
];
