import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../db/client";
import { devotionals, devotionalResponses } from "../db/schema-app";
import { exigirMiembro } from "./pareja";
import { fechaLocal } from "./fecha";
import { registrarOracion } from "./oracion";

type Fila = typeof devotionals.$inferSelect;

export type DevocionalPareja = {
  id: string;
  fechaLocal: string;
  pasaje: string;
  titulo: string | null;
  textoPasaje: string | null;
  elegidoPorMi: boolean;
  miRespuesta: string | null;
  respuestaPareja: string | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  /** Solo se revela cuando ambos escribieron. */
  revelado: boolean;
};

export type DevocionalPersonal = {
  id: string;
  fechaLocal: string;
  pasaje: string;
  textoPasaje: string | null;
  observacion: string | null;
  aplicacion: string | null;
  oracion: string | null;
  completado: boolean;
};

/**
 * Única puerta por la que sale un devocional de pareja, para que la regla del
 * revelado viva en un solo sitio. La respuesta del otro no se incluye hasta
 * que ambos escribieron: ocultarla solo en la interfaz dejaría el texto en el
 * HTML que viaja al navegador.
 */
async function vistaDePareja(
  fila: Fila,
  userId: string,
  parejaId: string,
): Promise<DevocionalPareja> {
  const respuestas = await db
    .select()
    .from(devotionalResponses)
    .where(eq(devotionalResponses.devotionalId, fila.id));

  const mia = respuestas.find((r) => r.autorId === userId);
  const suya = respuestas.find((r) => r.autorId === parejaId);
  const revelado = Boolean(mia && suya);

  return {
    id: fila.id,
    fechaLocal: fila.fechaLocal,
    pasaje: fila.pasaje,
    titulo: fila.titulo,
    textoPasaje: fila.textoPasaje,
    elegidoPorMi: fila.autorId === userId,
    miRespuesta: mia?.contenido ?? null,
    respuestaPareja: revelado ? (suya?.contenido ?? null) : null,
    yoRespondi: Boolean(mia),
    parejaRespondio: Boolean(suya),
    revelado,
  };
}

function vistaPersonal(fila: Fila): DevocionalPersonal {
  return {
    id: fila.id,
    fechaLocal: fila.fechaLocal,
    pasaje: fila.pasaje,
    textoPasaje: fila.textoPasaje,
    observacion: fila.observacion,
    aplicacion: fila.aplicacion,
    oracion: fila.oracion,
    completado: fila.completado,
  };
}

// --------------------------------------------------------- Devocional de pareja

export async function devocionalDeParejaHoy(
  userId: string,
  coupleId: string,
  parejaId: string,
  zona: string,
): Promise<DevocionalPareja | null> {
  await exigirMiembro(userId, coupleId);

  const devocional = await db.query.devotionals.findFirst({
    where: and(
      eq(devotionals.coupleId, coupleId),
      eq(devotionals.scope, "pareja"),
      eq(devotionals.fechaLocal, fechaLocal(zona)),
    ),
  });

  if (!devocional) return null;
  return vistaDePareja(devocional, userId, parejaId);
}

export async function crearDevocionalDePareja(
  userId: string,
  coupleId: string,
  zona: string,
  datos: { pasaje: string; titulo?: string; textoPasaje?: string },
) {
  await exigirMiembro(userId, coupleId);
  const hoy = fechaLocal(zona);

  // Uno por día: si los dos abren la pantalla a la vez y ambos proponen un
  // pasaje, el segundo recibe un mensaje en lugar de crear un duplicado que
  // dejaría el devocional del día a suerte de cuál leyera la consulta. El
  // índice único de la tabla es el que lo garantiza de verdad; esto solo
  // convierte el choque en un mensaje entendible.
  const existente = await db.query.devotionals.findFirst({
    where: and(
      eq(devotionals.coupleId, coupleId),
      eq(devotionals.scope, "pareja"),
      eq(devotionals.fechaLocal, hoy),
    ),
  });
  if (existente) {
    throw new Error(
      "Ya hay un devocional de pareja para hoy. Ábrelo y escribe tu respuesta.",
    );
  }

  const [fila] = await db
    .insert(devotionals)
    .values({
      autorId: userId,
      coupleId,
      scope: "pareja",
      fechaLocal: hoy,
      pasaje: datos.pasaje,
      titulo: datos.titulo ?? null,
      textoPasaje: datos.textoPasaje ?? null,
    })
    .returning();

  return fila;
}

export async function guardarRespuesta(
  userId: string,
  devotionalId: string,
  contenido: string,
  zona: string,
) {
  const devocional = await db.query.devotionals.findFirst({
    where: eq(devotionals.id, devotionalId),
  });
  if (!devocional?.coupleId) throw new Error("Devocional no encontrado.");
  await exigirMiembro(userId, devocional.coupleId);

  await db
    .insert(devotionalResponses)
    .values({ devotionalId, autorId: userId, contenido })
    .onConflictDoUpdate({
      target: [devotionalResponses.devotionalId, devotionalResponses.autorId],
      set: { contenido, updatedAt: new Date() },
    });

  // Un devocional de pareja también cuenta como oración del día, pero solo el
  // de hoy: responder uno de la semana pasada no puede rellenar la racha hacia
  // atrás.
  if (devocional.fechaLocal === fechaLocal(zona)) {
    await registrarOracion(userId, zona, { origen: "devocional" });
  }

  return { registroDeHoy: devocional.fechaLocal === fechaLocal(zona) };
}

// ------------------------------------------------------ Devocional personal

/**
 * El devocional personal en el que se está trabajando hoy. Desde que se puede
 * tener más de uno por día, es el más reciente: los anteriores se abren desde
 * el historial.
 */
export async function devocionalPersonalAbierto(userId: string, zona: string) {
  const [fila] = await db
    .select()
    .from(devotionals)
    .where(
      and(
        eq(devotionals.autorId, userId),
        eq(devotionals.scope, "personal"),
        eq(devotionals.fechaLocal, fechaLocal(zona)),
      ),
    )
    .orderBy(desc(devotionals.updatedAt))
    .limit(1);

  return fila ?? null;
}

export async function crearDevocionalPersonal(
  userId: string,
  zona: string,
  datos: { pasaje: string; textoPasaje?: string },
) {
  const [fila] = await db
    .insert(devotionals)
    .values({
      autorId: userId,
      scope: "personal",
      fechaLocal: fechaLocal(zona),
      pasaje: datos.pasaje,
      textoPasaje: datos.textoPasaje ?? null,
    })
    .returning();

  return fila;
}

/**
 * Guarda el borrador del SOAP. Se llama en cada paso, así que cerrar la app a
 * mitad y volver deja el devocional donde estaba.
 *
 * Con `id` edita ese devocional (el historial permite retomar uno de otro
 * día); sin `id` continúa el de hoy o lo crea.
 */
export async function guardarDevocionalPersonal(
  userId: string,
  zona: string,
  datos: {
    id?: string;
    pasaje: string;
    textoPasaje?: string;
    observacion?: string;
    aplicacion?: string;
    oracion?: string;
    completado?: boolean;
  },
) {
  const existente = datos.id
    ? await db.query.devotionals.findFirst({
        where: and(
          eq(devotionals.id, datos.id),
          // El dueño y el tipo se comprueban en la consulta: un id de otra
          // persona simplemente no existe para ella.
          eq(devotionals.autorId, userId),
          eq(devotionals.scope, "personal"),
        ),
      })
    : await devocionalPersonalAbierto(userId, zona);

  if (datos.id && !existente) throw new Error("Devocional no encontrado.");

  const valores = {
    pasaje: datos.pasaje,
    textoPasaje: datos.textoPasaje ?? null,
    observacion: datos.observacion ?? null,
    aplicacion: datos.aplicacion ?? null,
    oracion: datos.oracion ?? null,
    completado: datos.completado ?? false,
    updatedAt: new Date(),
  };

  const fila = existente
    ? (
        await db
          .update(devotionals)
          .set(valores)
          .where(eq(devotionals.id, existente.id))
          .returning()
      )[0]
    : (
        await db
          .insert(devotionals)
          .values({
            autorId: userId,
            scope: "personal",
            fechaLocal: fechaLocal(zona),
            ...valores,
          })
          .returning()
      )[0];

  // Cuenta para la racha solo si incluye la sección Oración, como define el
  // documento, y solo si es el devocional de hoy: terminar uno de hace tres
  // días no revive la racha de ese día.
  if (
    datos.completado &&
    datos.oracion?.trim() &&
    fila.fechaLocal === fechaLocal(zona)
  ) {
    await registrarOracion(userId, zona, { origen: "devocional" });
  }

  return fila;
}

// ----------------------------------------------------------------- Historial

export type ItemDevocional = {
  id: string;
  tipo: "personal" | "pareja";
  fechaLocal: string;
  pasaje: string;
  titulo: string | null;
  /** Personal: terminado. Pareja: los dos escribieron. */
  completado: boolean;
  /** Solo para los de pareja. */
  elegidoPorMi: boolean;
  yoRespondi: boolean;
  parejaRespondio: boolean;
};

export type TipoHistorial = "todos" | "personal" | "pareja";

/**
 * Todo lo que esta persona ha hecho: sus devocionales personales y los de la
 * pareja a la que pertenece hoy.
 *
 * La lista no lleva ningún texto escrito —ni el propio ni el del otro—, solo
 * el pasaje y en qué estado quedó. Así una pantalla de resumen no puede
 * filtrar la respuesta de la pareja antes del revelado.
 */
export async function listarDevocionales(
  userId: string,
  coupleId: string | null,
  opciones: { tipo?: TipoHistorial; limite?: number } = {},
): Promise<ItemDevocional[]> {
  const tipo = opciones.tipo ?? "todos";
  const limite = opciones.limite ?? 200;

  if (coupleId && tipo !== "personal") await exigirMiembro(userId, coupleId);
  if (tipo === "pareja" && !coupleId) return [];

  const mios = and(
    eq(devotionals.autorId, userId),
    eq(devotionals.scope, "personal"),
  );
  const deLaPareja =
    coupleId && tipo !== "personal"
      ? and(
          eq(devotionals.coupleId, coupleId),
          eq(devotionals.scope, "pareja"),
        )
      : undefined;

  const filtro =
    tipo === "pareja" ? deLaPareja : deLaPareja ? or(mios, deLaPareja) : mios;

  const filas = await db
    .select()
    .from(devotionals)
    .where(filtro)
    .orderBy(desc(devotionals.fechaLocal), desc(devotionals.createdAt))
    .limit(limite);

  // Quién respondió cada devocional de pareja, en una sola consulta.
  const idsDePareja = filas.filter((f) => f.scope === "pareja").map((f) => f.id);
  const respuestas = idsDePareja.length
    ? await db
        .select({
          devotionalId: devotionalResponses.devotionalId,
          autorId: devotionalResponses.autorId,
        })
        .from(devotionalResponses)
        .where(inArray(devotionalResponses.devotionalId, idsDePareja))
    : [];

  const autores = new Map<string, Set<string>>();
  for (const r of respuestas) {
    const set = autores.get(r.devotionalId) ?? new Set<string>();
    set.add(r.autorId);
    autores.set(r.devotionalId, set);
  }

  return filas.map((fila) => {
    if (fila.scope !== "pareja") {
      return {
        id: fila.id,
        tipo: "personal" as const,
        fechaLocal: fila.fechaLocal,
        pasaje: fila.pasaje,
        titulo: fila.titulo,
        completado: fila.completado,
        elegidoPorMi: true,
        yoRespondi: fila.completado,
        parejaRespondio: false,
      };
    }

    // Solo los dos miembros pueden responder, así que "alguien más" es la
    // pareja: no hace falta traer su id para saber si ya escribió.
    const set = autores.get(fila.id) ?? new Set<string>();
    const yoRespondi = set.has(userId);
    const parejaRespondio = [...set].some((a) => a !== userId);

    return {
      id: fila.id,
      tipo: "pareja" as const,
      fechaLocal: fila.fechaLocal,
      pasaje: fila.pasaje,
      titulo: fila.titulo,
      completado: yoRespondi && parejaRespondio,
      elegidoPorMi: fila.autorId === userId,
      yoRespondi,
      parejaRespondio,
    };
  });
}

export type DevocionalEncontrado =
  | { tipo: "personal"; personal: DevocionalPersonal }
  | { tipo: "pareja"; pareja: DevocionalPareja };

/**
 * Un devocional por su id, con el control de acceso dentro: devuelve null
 * tanto si no existe como si no es de esta persona, para no confirmar la
 * existencia de un id ajeno.
 */
export async function obtenerDevocional(
  userId: string,
  id: string,
): Promise<DevocionalEncontrado | null> {
  const fila = await db.query.devotionals.findFirst({
    where: eq(devotionals.id, id),
  });
  if (!fila) return null;

  if (fila.scope === "personal") {
    if (fila.autorId !== userId) return null;
    return { tipo: "personal", personal: vistaPersonal(fila) };
  }

  if (!fila.coupleId) return null;

  // Pertenecer a la pareja: si no, el devocional no existe para quien pregunta.
  let miembros;
  try {
    miembros = await exigirMiembro(userId, fila.coupleId);
  } catch {
    return null;
  }

  const parejaId =
    miembros.miembroA === userId ? miembros.miembroB : miembros.miembroA;

  return { tipo: "pareja", pareja: await vistaDePareja(fila, userId, parejaId) };
}
