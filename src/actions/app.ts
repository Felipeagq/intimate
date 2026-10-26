"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contextoApp } from "@/server/session";
import * as oracionModulo from "@/server/modules/oracion";
import * as promesasModulo from "@/server/modules/promesas";
import * as parejaModulo from "@/server/modules/pareja";
import * as devocionalModulo from "@/server/modules/devocional";
import * as acuerdosModulo from "@/server/modules/acuerdos";
import * as checkinModulo from "@/server/modules/checkin";

export type Resultado<T = undefined> =
  | { ok: true; datos?: T }
  | { ok: false; error: string };

/**
 * Envuelve cada acción: obtiene el contexto, valida y traduce los errores a
 * algo que la interfaz pueda mostrar. Nunca deja salir un error de base de
 * datos tal cual, que podría revelar estructura interna.
 */
async function ejecutar<T>(
  fn: (ctx: Awaited<ReturnType<typeof contextoApp>>) => Promise<T>,
  rutas: string[] = [],
): Promise<Resultado<T>> {
  try {
    const ctx = await contextoApp();
    const datos = await fn(ctx);
    for (const ruta of rutas) revalidatePath(ruta);
    return { ok: true, datos };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Datos inválidos." };
    }
    if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

function exigirPareja(ctx: Awaited<ReturnType<typeof contextoApp>>) {
  if (!ctx.pareja) throw new Error("Todavía no estás vinculado a una pareja.");
  return ctx.pareja;
}

// ---------------------------------------------------------------- Oración

export async function registrarOracion(minutos?: number) {
  return ejecutar(
    (ctx) =>
      oracionModulo.registrarOracion(ctx.userId, ctx.zona, {
        minutos: minutos && minutos > 0 ? minutos : undefined,
        origen: minutos ? "temporizador" : "check-in",
      }),
    ["/inicio", "/oracion"],
  );
}

const esquemaPeticion = z.object({
  titulo: z.string().trim().min(2, "Escribe un título.").max(120),
  detalle: z.string().trim().max(2000).optional(),
  compartida: z.boolean().optional(),
});

export async function crearPeticion(entrada: z.input<typeof esquemaPeticion>) {
  return ejecutar((ctx) => {
    const datos = esquemaPeticion.parse(entrada);
    return oracionModulo.crearPeticion(ctx.userId, {
      ...datos,
      coupleId: ctx.pareja?.coupleId ?? null,
    });
  }, ["/oracion"]);
}

export async function cambiarEstadoPeticion(
  peticionId: string,
  estado: "activa" | "respondida" | "archivada",
  nota?: string,
) {
  return ejecutar(
    (ctx) =>
      oracionModulo.cambiarEstadoPeticion(ctx.userId, peticionId, estado, nota),
    ["/oracion"],
  );
}

// --------------------------------------------------------------- Promesas

const esquemaPromesa = z.object({
  cita: z.string().trim().min(2, "Escribe la cita bíblica.").max(80),
  texto: z.string().trim().min(5, "Escribe el versículo.").max(2000),
  contexto: z.string().trim().max(2000).optional(),
  etiquetas: z.array(z.string().trim().max(30)).max(8).optional(),
});

export async function crearPromesa(entrada: z.input<typeof esquemaPromesa>) {
  return ejecutar((ctx) => {
    const datos = esquemaPromesa.parse(entrada);
    return promesasModulo.crearPromesa(ctx.userId, datos);
  }, ["/promesas", "/inicio"]);
}

export async function marcarPromesaCumplida(
  promesaId: string,
  testimonio?: string,
) {
  return ejecutar(
    (ctx) => promesasModulo.marcarCumplida(ctx.userId, promesaId, testimonio),
    ["/promesas"],
  );
}

// ----------------------------------------------------------------- Pareja

export async function crearInvitacion() {
  return ejecutar((ctx) => parejaModulo.crearInvitacion(ctx.userId), [
    "/vincular",
  ]);
}

export async function aceptarInvitacion(codigo: string) {
  return ejecutar(
    (ctx) =>
      parejaModulo.aceptarInvitacion(ctx.userId, codigo.trim().toUpperCase()),
    ["/vincular", "/pareja", "/inicio"],
  );
}

export async function desvincular() {
  return ejecutar((ctx) => parejaModulo.desvincular(ctx.userId), [
    "/pareja",
    "/inicio",
    "/ajustes",
  ]);
}

// ------------------------------------------------------------- Devocional

// El editor limita el texto visible a 4.000 caracteres; guardado como Markdown
// ocupa más por los símbolos de formato, así que el tope del servidor es mayor.
const LIMITE_RICO = 8000;

const RUTAS_DEVOCIONAL = ["/devocional", "/devocional/historial", "/inicio"];

const esquemaDevocionalPareja = z.object({
  pasaje: z.string().trim().min(2, "Escribe el pasaje.").max(120),
  titulo: z.string().trim().max(120).optional(),
  textoPasaje: z.string().trim().max(4000).optional(),
});

export async function crearDevocionalDePareja(
  entrada: z.input<typeof esquemaDevocionalPareja>,
) {
  return ejecutar(async (ctx) => {
    const pareja = exigirPareja(ctx);
    const datos = esquemaDevocionalPareja.parse(entrada);
    const fila = await devocionalModulo.crearDevocionalDePareja(
      ctx.userId,
      pareja.coupleId,
      ctx.zona,
      datos,
    );
    // Solo el id: la pantalla navega al devocional recién creado y la fila
    // completa no le hace falta.
    return { id: fila.id };
  }, RUTAS_DEVOCIONAL);
}

export async function guardarRespuestaDevocional(
  devotionalId: string,
  contenido: string,
) {
  return ejecutar((ctx) => {
    const texto = z
      .string()
      .trim()
      .min(1, "Escribe algo antes de guardar.")
      .max(LIMITE_RICO)
      .parse(contenido);
    return devocionalModulo.guardarRespuesta(
      ctx.userId,
      devotionalId,
      texto,
      ctx.zona,
    );
  }, RUTAS_DEVOCIONAL);
}

const esquemaSoap = z.object({
  // Con id edita ese devocional; sin id continúa el de hoy o lo crea. El
  // módulo comprueba que el id sea de esta persona.
  id: z.string().uuid().optional(),
  pasaje: z.string().trim().min(2, "Escribe el pasaje.").max(120),
  textoPasaje: z.string().trim().max(4000).optional(),
  observacion: z.string().trim().max(LIMITE_RICO).optional(),
  aplicacion: z.string().trim().max(LIMITE_RICO).optional(),
  oracion: z.string().trim().max(LIMITE_RICO).optional(),
  completado: z.boolean().optional(),
});

export async function guardarDevocionalPersonal(
  entrada: z.input<typeof esquemaSoap>,
) {
  return ejecutar(
    async (ctx) => {
      const datos = esquemaSoap.parse(entrada);
      const fila = await devocionalModulo.guardarDevocionalPersonal(
        ctx.userId,
        ctx.zona,
        datos,
      );
      // La pantalla se queda con el id para que los guardados siguientes
      // editen este devocional en lugar de crear otro.
      return { id: fila.id };
    },
    [...RUTAS_DEVOCIONAL, "/oracion"],
  );
}

const esquemaDevocionalNuevo = z.object({
  pasaje: z.string().trim().min(2, "Escribe el pasaje.").max(120),
  textoPasaje: z.string().trim().max(4000).optional(),
});

export async function crearDevocionalPersonal(
  entrada: z.input<typeof esquemaDevocionalNuevo>,
) {
  return ejecutar(async (ctx) => {
    const datos = esquemaDevocionalNuevo.parse(entrada);
    const fila = await devocionalModulo.crearDevocionalPersonal(
      ctx.userId,
      ctx.zona,
      datos,
    );
    return { id: fila.id };
  }, RUTAS_DEVOCIONAL);
}

// ---------------------------------------------------------------- Acuerdos

const esquemaAcuerdo = z.object({
  titulo: z.string().trim().min(3, "Escribe un título.").max(120),
  descripcion: z.string().trim().max(2000).optional(),
  proximaRevision: z.string().trim().optional(),
});

export async function crearAcuerdo(entrada: z.input<typeof esquemaAcuerdo>) {
  return ejecutar((ctx) => {
    const pareja = exigirPareja(ctx);
    const datos = esquemaAcuerdo.parse(entrada);
    return acuerdosModulo.crearAcuerdo(ctx.userId, pareja.coupleId, datos);
  }, ["/pareja"]);
}

export async function confirmarAcuerdo(acuerdoId: string) {
  return ejecutar((ctx) => {
    const pareja = exigirPareja(ctx);
    return acuerdosModulo.confirmarAcuerdo(
      ctx.userId,
      pareja.coupleId,
      acuerdoId,
    );
  }, ["/pareja"]);
}

export async function enviarAfirmacion(mensaje: string) {
  return ejecutar((ctx) => {
    const pareja = exigirPareja(ctx);
    const texto = z
      .string()
      .trim()
      .min(2, "Escribe un mensaje.")
      .max(1000)
      .parse(mensaje);
    return acuerdosModulo.enviarAfirmacion(
      ctx.userId,
      pareja.coupleId,
      pareja.parejaId,
      texto,
    );
  }, ["/pareja"]);
}

export async function alternarFavorita(afirmacionId: string) {
  return ejecutar(
    (ctx) => acuerdosModulo.alternarFavorita(ctx.userId, afirmacionId),
    ["/pareja"],
  );
}

// ---------------------------------------------------------------- Check-in

export async function responderCheckin(respuestas: string[]) {
  return ejecutar((ctx) => {
    const pareja = exigirPareja(ctx);
    const datos = z
      .array(z.string().trim().min(1, "Responde todas las preguntas.").max(2000))
      .parse(respuestas);
    return checkinModulo.responderCheckin(
      ctx.userId,
      pareja.coupleId,
      ctx.zona,
      datos,
    );
  }, ["/pareja", "/inicio"]);
}

export async function completarTemaPlan(slug: string) {
  return ejecutar((ctx) => {
    const pareja = exigirPareja(ctx);
    return checkinModulo.completarTema(ctx.userId, pareja.coupleId, slug);
  }, ["/pareja"]);
}
