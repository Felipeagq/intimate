import { desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db } from "../db/client";
import { user, session } from "../db/schema";
import { adminUser } from "../db/schema-admin";
import { couples, coupleInvites, devotionals, prayerLogs } from "../db/schema-app";
import { fechaLocal, sumarDias } from "./fecha";

/**
 * Consultas del panel.
 *
 * Todo lo que sale de aquí es agregado o de cuenta: correo, estado y fechas.
 * Ninguna función devuelve contenido escrito por un usuario, y es
 * deliberado — el panel no puede mostrar lo que no recibe.
 */

export type Metrica = { valor: number; delta: number | null };

function delta(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

export async function obtenerMetricas() {
  const hoy = fechaLocal("UTC");
  const hace7 = sumarDias(hoy, -7);
  const hace14 = sumarDias(hoy, -14);
  const hace30 = new Date(Date.now() - 30 * 86_400_000);

  const [usuarios] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ultimos30: sql<number>`count(*) filter (where ${user.createdAt} >= ${hace30})::int`,
    })
    .from(user);

  const [parejas] = await db
    .select({
      activas: sql<number>`count(*) filter (where ${couples.estado} = 'activa')::int`,
      archivadas: sql<number>`count(*) filter (where ${couples.estado} = 'archivada')::int`,
    })
    .from(couples);

  // Parejas activas esta semana: ambos miembros oraron en los últimos 7 días.
  const [parejasActivas] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from ${couples} c
    where c.estado = 'activa'
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_a and p.fecha_local >= ${hace7})
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_b and p.fecha_local >= ${hace7})
  `).then((r) => r.rows);

  const [parejasActivasPrevia] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from ${couples} c
    where c.estado = 'activa'
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_a
                    and p.fecha_local >= ${hace14} and p.fecha_local < ${hace7})
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_b
                    and p.fecha_local >= ${hace14} and p.fecha_local < ${hace7})
  `).then((r) => r.rows);

  const [devocionales] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace7})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace14} and ${devotionals.fechaLocal} < ${hace7})::int`,
    })
    .from(devotionals);

  const [invitaciones] = await db
    .select({
      enviadas: sql<number>`count(*)::int`,
      aceptadas: sql<number>`count(*) filter (where ${coupleInvites.usadaEn} is not null)::int`,
    })
    .from(coupleInvites);

  const aceptacion =
    invitaciones.enviadas > 0
      ? Math.round((invitaciones.aceptadas / invitaciones.enviadas) * 100)
      : 0;

  return {
    parejasActivas: {
      valor: parejasActivas?.n ?? 0,
      delta: delta(parejasActivas?.n ?? 0, parejasActivasPrevia?.n ?? 0),
    } satisfies Metrica,
    usuarios: { valor: usuarios?.total ?? 0, delta: null } satisfies Metrica,
    parejasVinculadas: {
      valor: parejas?.activas ?? 0,
      delta: null,
    } satisfies Metrica,
    devocionalesSemana: {
      valor: devocionales?.semana ?? 0,
      delta: delta(devocionales?.semana ?? 0, devocionales?.semanaPrevia ?? 0),
    } satisfies Metrica,
    aceptacionInvitacion: { valor: aceptacion, delta: null } satisfies Metrica,
    parejasArchivadas: {
      valor: parejas?.archivadas ?? 0,
      delta: null,
    } satisfies Metrica,
  };
}

/** Parejas activas por semana, últimas 12 semanas. */
export async function serieParejasActivas() {
  const hoy = fechaLocal("UTC");
  const serie: { semana: string; valor: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const fin = sumarDias(hoy, -7 * i);
    const inicio = sumarDias(fin, -7);

    const { rows } = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from ${couples} c
      where c.estado = 'activa'
        and exists (select 1 from ${prayerLogs} p
                    where p.user_id = c.miembro_a
                      and p.fecha_local >= ${inicio} and p.fecha_local < ${fin})
        and exists (select 1 from ${prayerLogs} p
                    where p.user_id = c.miembro_b
                      and p.fecha_local >= ${inicio} and p.fecha_local < ${fin})
    `);

    serie.push({ semana: inicio, valor: rows[0]?.n ?? 0 });
  }

  return serie;
}

export type CuentaPanel = {
  id: string;
  email: string;
  estado: string;
  creada: Date;
  ultimoAcceso: Date | null;
  pareja: "vinculada" | "archivada" | "sin vincular";
};

export async function buscarCuentas(
  busqueda?: string,
  limite = 50,
): Promise<CuentaPanel[]> {
  const filas = await db
    .select({
      id: user.id,
      email: user.email,
      estado: user.estado,
      creada: user.createdAt,
      ultimoAcceso: sql<Date | null>`max(${session.createdAt})`,
      conPareja: sql<number>`count(distinct ${couples.id}) filter (where ${couples.estado} = 'activa')::int`,
      conArchivada: sql<number>`count(distinct ${couples.id}) filter (where ${couples.estado} = 'archivada')::int`,
    })
    .from(user)
    .leftJoin(session, eq(session.userId, user.id))
    .leftJoin(
      couples,
      sql`${couples.miembroA} = ${user.id} or ${couples.miembroB} = ${user.id}`,
    )
    .where(busqueda ? ilike(user.email, `%${busqueda}%`) : undefined)
    .groupBy(user.id)
    .orderBy(desc(user.createdAt))
    .limit(limite);

  return filas.map((f) => ({
    id: f.id,
    email: f.email,
    estado: f.estado ?? "activa",
    creada: f.creada,
    ultimoAcceso: f.ultimoAcceso,
    pareja:
      f.conPareja > 0
        ? "vinculada"
        : f.conArchivada > 0
          ? "archivada"
          : "sin vincular",
  }));
}

export async function cambiarEstadoCuenta(
  usuarioId: string,
  estado: "activa" | "suspendida" | "eliminación pendiente",
) {
  return db.transaction(async (tx) => {
    const [fila] = await tx
      .update(user)
      .set({ estado, updatedAt: new Date() })
      .where(eq(user.id, usuarioId))
      .returning({ id: user.id, email: user.email });

    if (!fila) throw new Error("No encontramos esa cuenta.");

    // Suspender tiene que cerrar las sesiones abiertas; si no, la persona
    // sigue dentro hasta que caduque su cookie.
    if (estado !== "activa") {
      await tx.delete(session).where(eq(session.userId, usuarioId));
    }

    return fila;
  });
}

export async function listarEquipo() {
  return db
    .select({
      id: adminUser.id,
      email: adminUser.email,
      rol: adminUser.rol,
      mfa: adminUser.twoFactorEnabled,
      creada: adminUser.createdAt,
    })
    .from(adminUser)
    .orderBy(adminUser.createdAt);
}

export async function usuariosActivosDesde(dias: number) {
  const desde = sumarDias(fechaLocal("UTC"), -dias);
  const [fila] = await db
    .select({ n: sql<number>`count(distinct ${prayerLogs.userId})::int` })
    .from(prayerLogs)
    .where(gte(prayerLogs.fechaLocal, desde));
  return fila?.n ?? 0;
}

export async function contarCuentasPorEstado() {
  const filas = await db
    .select({ estado: user.estado, n: sql<number>`count(*)::int` })
    .from(user)
    .groupBy(user.estado);
  return filas;
}
