/**
 * Datos de muestra del panel. Todo es agregado o de cuenta:
 * ninguna pantalla del panel muestra contenido escrito por un usuario.
 */

export const metricas = {
  parejasActivas: { valor: 412, delta: 8.4 },
  usuariosActivos: { valor: 1148, delta: 5.1 },
  parejasVinculadas: { valor: 638, delta: 3.2 },
  devocionalesSemana: { valor: 2871, delta: -2.6 },
  aceptacionInvitacion: { valor: 61, delta: 4.0 },
  retencionD30: { valor: 44, delta: 1.8 },
};

/** Parejas activas por semana, últimas 12 semanas. */
export const serieParejas = [
  248, 266, 281, 275, 299, 318, 327, 341, 356, 372, 389, 412,
];

export const cuentas = [
  {
    id: "u_8fa2",
    email: "sofia@ejemplo.com",
    estado: "activa" as const,
    creada: "2026-02-11",
    ultimoAcceso: "2026-10-25",
    pareja: "vinculada",
    plan: "gratis",
  },
  {
    id: "u_3bd7",
    email: "mateo@ejemplo.com",
    estado: "activa" as const,
    creada: "2026-02-14",
    ultimoAcceso: "2026-10-24",
    pareja: "vinculada",
    plan: "gratis",
  },
  {
    id: "u_c41e",
    email: "daniela@ejemplo.com",
    estado: "suspendida" as const,
    creada: "2026-06-02",
    ultimoAcceso: "2026-09-18",
    pareja: "sin vincular",
    plan: "gratis",
  },
  {
    id: "u_9a05",
    email: "jorge@ejemplo.com",
    estado: "activa" as const,
    creada: "2026-08-30",
    ultimoAcceso: "2026-10-25",
    pareja: "archivada",
    plan: "gratis",
  },
  {
    id: "u_77c3",
    email: "valentina@ejemplo.com",
    estado: "eliminación pendiente" as const,
    creada: "2026-04-19",
    ultimoAcceso: "2026-10-21",
    pareja: "sin vincular",
    plan: "gratis",
  },
];

export const eventosAuditoria = [
  {
    id: "e1",
    actor: "felipe@feanware.com",
    rol: "admin",
    accion: "cuenta.suspender",
    objetivo: "u_c41e",
    ip: "190.85.x.x",
    fecha: "2026-10-25T14:22:00Z",
  },
  {
    id: "e2",
    actor: "ana@feanware.com",
    rol: "soporte",
    accion: "acceso.reenviar",
    objetivo: "u_9a05",
    ip: "181.49.x.x",
    fecha: "2026-10-25T11:03:00Z",
  },
  {
    id: "e3",
    actor: "felipe@feanware.com",
    rol: "admin",
    accion: "config.version_minima",
    objetivo: "1.4.0",
    ip: "190.85.x.x",
    fecha: "2026-10-24T19:41:00Z",
  },
  {
    id: "e4",
    actor: "ana@feanware.com",
    rol: "soporte",
    accion: "cuenta.consultar",
    objetivo: "u_8fa2",
    ip: "181.49.x.x",
    fecha: "2026-10-24T16:12:00Z",
  },
  {
    id: "e5",
    actor: "sistema",
    rol: "—",
    accion: "cuenta.eliminar_programada",
    objetivo: "u_77c3",
    ip: "—",
    fecha: "2026-10-23T02:00:00Z",
  },
];

export const equipo = [
  {
    email: "felipe@feanware.com",
    rol: "admin" as const,
    mfa: "passkey",
    ultimoAcceso: "2026-10-25",
  },
  {
    email: "ana@feanware.com",
    rol: "soporte" as const,
    mfa: "TOTP",
    ultimoAcceso: "2026-10-25",
  },
  {
    email: "carlos@feanware.com",
    rol: "lectura" as const,
    mfa: "TOTP",
    ultimoAcceso: "2026-10-19",
  },
];
