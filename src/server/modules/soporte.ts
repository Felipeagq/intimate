import { and, asc, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { user } from "../db/schema";
import { adminUser } from "../db/schema-admin";
import { supportNotes, supportTickets } from "../db/schema-soporte";
import {
  enviarEmail,
  enviarEmailSinBloquear,
  plantillaAvisoReporteUrgente,
  plantillaRespuestaSoporte,
} from "../email";
import { env } from "../env";

/**
 * Bandeja de soporte.
 *
 * Es la única parte del panel que muestra texto escrito por una persona, y
 * solo porque ese texto es un mensaje dirigido al equipo. Nada de lo que la
 * persona escribió dentro de la app se adjunta jamás.
 */

export const CATEGORIAS = {
  ayuda: "Tengo una duda o un problema",
  reporte_abuso: "Quiero reportar un abuso o algo que me preocupa",
  eliminar_cuenta: "Quiero eliminar mi cuenta",
  otro: "Otro motivo",
} as const;

export type Categoria = keyof typeof CATEGORIAS;
export const CATEGORIAS_CLAVES = Object.keys(CATEGORIAS) as [Categoria, ...Categoria[]];

export type EstadoTicket = "nuevo" | "en_curso" | "resuelto";

export const LARGO_MENSAJE = { min: 10, max: 4000 } as const;

// Frenos para el formulario público, que no exige sesión.
const MAX_POR_CORREO_AL_DIA = 3;
const MAX_GLOBAL_POR_HORA = 60;

const esquemaTicket = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
  categoria: z.enum(CATEGORIAS_CLAVES),
  mensaje: z
    .string()
    .trim()
    .min(LARGO_MENSAJE.min, "Cuéntanos un poco más, por favor.")
    .max(LARGO_MENSAJE.max, "El mensaje es demasiado largo."),
});

export async function crearTicket(entrada: {
  email: string;
  categoria: string;
  mensaje: string;
  verificado: boolean;
  userId?: string | null;
}) {
  const datos = esquemaTicket.parse(entrada);

  const haceUnDia = new Date(Date.now() - 86_400_000);
  const haceUnaHora = new Date(Date.now() - 3_600_000);

  const [delCorreo] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(
      and(eq(supportTickets.email, datos.email), gte(supportTickets.createdAt, haceUnDia)),
    );
  if ((delCorreo?.n ?? 0) >= MAX_POR_CORREO_AL_DIA) {
    throw new Error(
      "Ya enviaste varios mensajes hoy. Los estamos leyendo y te responderemos pronto.",
    );
  }

  const [global] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, haceUnaHora));
  if ((global?.n ?? 0) >= MAX_GLOBAL_POR_HORA) {
    throw new Error("Estamos recibiendo muchos mensajes. Inténtalo más tarde.");
  }

  // Si el correo corresponde a una cuenta, se enlaza para que soporte la
  // encuentre rápido. No se le dice nada a quien escribe: responder distinto
  // según exista o no la cuenta revelaría qué correos están registrados.
  let userId = entrada.userId ?? null;
  if (!userId) {
    const cuenta = await db.query.user.findFirst({
      where: eq(user.email, datos.email),
      columns: { id: true },
    });
    userId = cuenta?.id ?? null;
  }

  const urgente = datos.categoria === "reporte_abuso";

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId,
      email: datos.email,
      verificado: entrada.verificado,
      categoria: datos.categoria,
      prioridad: urgente ? "urgente" : "normal",
      mensaje: datos.mensaje,
    })
    .returning({ id: supportTickets.id });

  if (urgente) await avisarAlEquipo(ticket.id);

  return { id: ticket.id };
}

/** Avisa a quien pueda atenderlo. Sin el mensaje: ver la plantilla. */
async function avisarAlEquipo(ticketId: string) {
  const equipo = await db
    .select({ email: adminUser.email })
    .from(adminUser)
    .where(inArray(adminUser.rol, ["admin", "soporte"]));

  const enlace = `${env.BETTER_AUTH_URL}/admin/bandeja/${ticketId}`;
  const { texto, html } = plantillaAvisoReporteUrgente({ enlace });

  await Promise.all(
    equipo.map((m) =>
      enviarEmailSinBloquear({
        tipo: "soporte",
        para: m.email,
        asunto: "Reporte urgente en la bandeja de Intimate",
        texto,
        html,
      }),
    ),
  );
}

// ------------------------------------------------------------- Lectura

export type FiltroTickets = "abiertos" | EstadoTicket | "todos";

export async function listarTickets(filtro: FiltroTickets = "abiertos", limite = 100) {
  const condicion =
    filtro === "todos"
      ? undefined
      : filtro === "abiertos"
        ? ne(supportTickets.estado, "resuelto")
        : eq(supportTickets.estado, filtro);

  return db
    .select()
    .from(supportTickets)
    .where(condicion)
    .orderBy(
      // Los urgentes sin resolver, siempre arriba.
      sql`(case when ${supportTickets.prioridad} = 'urgente' and ${supportTickets.estado} <> 'resuelto' then 0 else 1 end)`,
      desc(supportTickets.createdAt),
    )
    .limit(limite);
}

export async function obtenerTicket(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;

  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, id),
  });
  if (!ticket) return null;

  const notas = await db
    .select()
    .from(supportNotes)
    .where(eq(supportNotes.ticketId, id))
    .orderBy(asc(supportNotes.createdAt));

  return { ticket, notas };
}

export async function contarPendientes() {
  const [fila] = await db
    .select({
      nuevos: sql<number>`count(*) filter (where ${supportTickets.estado} = 'nuevo')::int`,
      urgentes: sql<number>`count(*) filter (where ${supportTickets.prioridad} = 'urgente' and ${supportTickets.estado} <> 'resuelto')::int`,
    })
    .from(supportTickets);

  return { nuevos: fila?.nuevos ?? 0, urgentes: fila?.urgentes ?? 0 };
}

// ----------------------------------------------------------- Acciones

async function existe(id: string) {
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error("No encontramos ese mensaje.");
  }
  const fila = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, id),
  });
  if (!fila) throw new Error("No encontramos ese mensaje.");
  return fila;
}

export async function cambiarEstadoTicket(id: string, estado: EstadoTicket) {
  const ticket = await existe(id);

  await db
    .update(supportTickets)
    .set({
      estado,
      updatedAt: new Date(),
      // Reabrir borra la fecha de resolución: ya no está resuelto.
      resueltoEn: estado === "resuelto" ? new Date() : null,
    })
    .where(eq(supportTickets.id, id));

  return { email: ticket.email };
}

export async function asignarTicket(id: string, asignadoA: string | null) {
  const ticket = await existe(id);

  await db
    .update(supportTickets)
    .set({
      asignadoA,
      // Tomar un mensaje nuevo lo pone en curso: ya alguien lo está viendo.
      ...(asignadoA && ticket.estado === "nuevo" ? { estado: "en_curso" } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, id));

  return { email: ticket.email };
}

export async function agregarNota(id: string, autor: string, contenido: string) {
  const ticket = await existe(id);
  const texto = z.string().trim().min(1, "Escribe algo.").max(2000).parse(contenido);

  await db
    .insert(supportNotes)
    .values({ ticketId: id, autor, tipo: "nota", contenido: texto });
  await db
    .update(supportTickets)
    .set({ updatedAt: new Date() })
    .where(eq(supportTickets.id, id));

  return { email: ticket.email };
}

/**
 * Responde por correo. El envío va primero: si falla, no queda guardado como
 * enviado algo que nunca salió, y quien responde ve el error y puede
 * reintentar.
 */
export async function responderTicket(id: string, autor: string, respuesta: string) {
  const ticket = await existe(id);
  const texto = z.string().trim().min(1, "Escribe la respuesta.").max(4000).parse(respuesta);

  const { texto: plano, html } = plantillaRespuestaSoporte({
    respuesta: texto,
    enlaceAyuda: `${env.BETTER_AUTH_URL}/ayuda`,
  });

  await enviarEmail({
    tipo: "soporte",
    para: ticket.email,
    asunto: "Respuesta del equipo de Intimate",
    texto: plano,
    html,
  });

  await db
    .insert(supportNotes)
    .values({ ticketId: id, autor, tipo: "respuesta", contenido: texto });

  await db
    .update(supportTickets)
    .set({
      updatedAt: new Date(),
      ...(ticket.estado === "nuevo" ? { estado: "en_curso" } : {}),
    })
    .where(eq(supportTickets.id, id));

  return { email: ticket.email };
}
