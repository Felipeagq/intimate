import { createHash, randomInt } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { user } from "../db/schema";
import { couples, coupleInvites } from "../db/schema-app";
import { diferenciaEnDias, fechaLocal } from "./fecha";

/** Sin caracteres ambiguos: nada de O/0 ni I/1. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const HORAS_VIGENCIA = 48;
const MAX_INTENTOS = 10;

function hashCodigo(codigo: string) {
  return createHash("sha256").update(codigo.toUpperCase()).digest("hex");
}

function generarCodigo() {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALFABETO[randomInt(ALFABETO.length)];
  return out;
}

export type ParejaActiva = {
  coupleId: string;
  parejaId: string;
  parejaNombre: string;
  parejaEmail: string;
  vinculadaEn: Date;
  diasJuntos: number;
};

export async function obtenerPareja(
  userId: string,
  zona: string,
): Promise<ParejaActiva | null> {
  const fila = await db.query.couples.findFirst({
    where: and(
      eq(couples.estado, "activa"),
      or(eq(couples.miembroA, userId), eq(couples.miembroB, userId)),
    ),
  });

  if (!fila) return null;

  const otroId = fila.miembroA === userId ? fila.miembroB : fila.miembroA;
  const otro = await db.query.user.findFirst({ where: eq(user.id, otroId) });
  if (!otro) return null;

  const desde = fila.vinculadaEn.toISOString().slice(0, 10);

  return {
    coupleId: fila.id,
    parejaId: otro.id,
    parejaNombre: otro.name?.trim() || otro.email.split("@")[0],
    parejaEmail: otro.email,
    vinculadaEn: fila.vinculadaEn,
    diasJuntos: Math.max(0, diferenciaEnDias(desde, fechaLocal(zona))),
  };
}

/** Verifica que la persona sea miembro activo antes de tocar nada suyo. */
export async function exigirMiembro(userId: string, coupleId: string) {
  const fila = await db.query.couples.findFirst({
    where: and(
      eq(couples.id, coupleId),
      eq(couples.estado, "activa"),
      or(eq(couples.miembroA, userId), eq(couples.miembroB, userId)),
    ),
  });
  if (!fila) throw new Error("No eres miembro activo de esta pareja.");
  return fila;
}

export async function crearInvitacion(userId: string) {
  if (await obtenerPareja(userId, "UTC")) {
    throw new Error("Ya estás vinculado a una pareja.");
  }

  const codigo = generarCodigo();
  const expiraEn = new Date(Date.now() + HORAS_VIGENCIA * 3600_000);

  await db.transaction(async (tx) => {
    // Una invitación viva por persona: la anterior se anula.
    await tx.delete(coupleInvites).where(eq(coupleInvites.creadorId, userId));
    await tx.insert(coupleInvites).values({
      codigoHash: hashCodigo(codigo),
      creadorId: userId,
      expiraEn,
    });
  });

  // El código en claro solo existe aquí y en la pantalla de quien invita.
  return { codigo, expiraEn };
}

export async function invitacionVigente(userId: string) {
  const fila = await db.query.coupleInvites.findFirst({
    where: eq(coupleInvites.creadorId, userId),
  });
  if (!fila || fila.usadaEn || fila.expiraEn < new Date()) return null;
  return { expiraEn: fila.expiraEn };
}

/**
 * Acepta una invitación.
 *
 * Devuelve siempre el mismo error genérico: un mensaje distinto para
 * "no existe" y "ya se usó" permitiría descubrir códigos válidos probando.
 */
export async function aceptarInvitacion(userId: string, codigo: string) {
  const generico = new Error("El código no es válido o ya caducó.");

  if (!/^[A-Za-z0-9]{6}$/.test(codigo)) throw generico;
  if (await obtenerPareja(userId, "UTC")) {
    throw new Error("Ya estás vinculado a una pareja.");
  }

  return db.transaction(async (tx) => {
    const invitacion = await tx.query.coupleInvites.findFirst({
      where: eq(coupleInvites.codigoHash, hashCodigo(codigo)),
    });

    if (!invitacion) throw generico;

    await tx
      .update(coupleInvites)
      .set({ intentos: sql`${coupleInvites.intentos} + 1` })
      .where(eq(coupleInvites.id, invitacion.id));

    if (
      invitacion.usadaEn ||
      invitacion.expiraEn < new Date() ||
      invitacion.intentos >= MAX_INTENTOS ||
      invitacion.creadorId === userId
    ) {
      throw generico;
    }

    const [nueva] = await tx
      .insert(couples)
      .values({ miembroA: invitacion.creadorId, miembroB: userId })
      .returning();

    await tx
      .update(coupleInvites)
      .set({ usadaEn: new Date(), usadaPor: userId })
      .where(eq(coupleInvites.id, invitacion.id));

    return nueva;
  });
}

/**
 * Desvincularse. Es inmediato y no avisa a la otra persona: el documento lo
 * pide así para que salir de una relación dañina no exponga a nadie.
 * No se borra nada; el espacio compartido se archiva.
 */
export async function desvincular(userId: string) {
  const pareja = await obtenerPareja(userId, "UTC");
  if (!pareja) return;

  await db
    .update(couples)
    .set({
      estado: "archivada",
      archivadaEn: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(couples.id, pareja.coupleId));
}
