import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  weeklyCheckins,
  checkinResponses,
  couplePlanProgress,
} from "../db/schema-app";
import { exigirMiembro } from "./pareja";
import { fechaLocal, inicioDeSemana } from "./fecha";
import {
  PREGUNTAS_CHECKIN,
  TEMAS_PLAN,
  TOTAL_SEMANAS_PLAN,
} from "@/content/plan-noviazgo";

export type CheckinSemana = {
  id: string | null;
  semanaInicio: string;
  preguntas: readonly string[];
  misRespuestas: string[] | null;
  respuestasPareja: string[] | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  revelado: boolean;
};

export async function checkinDeLaSemana(
  userId: string,
  coupleId: string,
  parejaId: string,
  zona: string,
): Promise<CheckinSemana> {
  await exigirMiembro(userId, coupleId);

  const semanaInicio = inicioDeSemana(fechaLocal(zona));

  const checkin = await db.query.weeklyCheckins.findFirst({
    where: and(
      eq(weeklyCheckins.coupleId, coupleId),
      eq(weeklyCheckins.semanaInicio, semanaInicio),
    ),
  });

  if (!checkin) {
    return {
      id: null,
      semanaInicio,
      preguntas: PREGUNTAS_CHECKIN,
      misRespuestas: null,
      respuestasPareja: null,
      yoRespondi: false,
      parejaRespondio: false,
      revelado: false,
    };
  }

  const respuestas = await db
    .select()
    .from(checkinResponses)
    .where(eq(checkinResponses.checkinId, checkin.id));

  const mias = respuestas.find((r) => r.autorId === userId);
  const suyas = respuestas.find((r) => r.autorId === parejaId);
  const revelado = Boolean(mias && suyas);

  return {
    id: checkin.id,
    semanaInicio,
    preguntas: PREGUNTAS_CHECKIN,
    misRespuestas: mias?.respuestas ?? null,
    // Igual que el devocional: lo del otro no sale del servidor hasta que
    // los dos han respondido.
    respuestasPareja: revelado ? (suyas?.respuestas ?? null) : null,
    yoRespondi: Boolean(mias),
    parejaRespondio: Boolean(suyas),
    revelado,
  };
}

export async function responderCheckin(
  userId: string,
  coupleId: string,
  zona: string,
  respuestas: string[],
) {
  await exigirMiembro(userId, coupleId);

  if (respuestas.length !== PREGUNTAS_CHECKIN.length) {
    throw new Error("Faltan respuestas.");
  }

  const semanaInicio = inicioDeSemana(fechaLocal(zona));

  await db.transaction(async (tx) => {
    const [checkin] = await tx
      .insert(weeklyCheckins)
      .values({ coupleId, semanaInicio })
      .onConflictDoUpdate({
        target: [weeklyCheckins.coupleId, weeklyCheckins.semanaInicio],
        set: { semanaInicio },
      })
      .returning();

    await tx
      .insert(checkinResponses)
      .values({ checkinId: checkin.id, autorId: userId, respuestas })
      .onConflictDoUpdate({
        target: [checkinResponses.checkinId, checkinResponses.autorId],
        set: { respuestas },
      });
  });
}

// --------------------------------------------- Plan "Conociéndonos a fondo"

export async function avancePlan(userId: string, coupleId: string) {
  await exigirMiembro(userId, coupleId);

  const fila = await db.query.couplePlanProgress.findFirst({
    where: eq(couplePlanProgress.coupleId, coupleId),
  });

  const semana = fila?.semanaActual ?? 1;
  const completados = fila?.temasCompletados ?? [];
  const temaActual = TEMAS_PLAN[Math.min(semana - 1, TEMAS_PLAN.length - 1)];

  return {
    semana,
    totalSemanas: TOTAL_SEMANAS_PLAN,
    temaActual,
    completados: TEMAS_PLAN.filter((t) => completados.includes(t.slug)),
    siguientes: TEMAS_PLAN.filter(
      (t) => !completados.includes(t.slug) && t.slug !== temaActual.slug,
    ),
  };
}

export async function completarTema(
  userId: string,
  coupleId: string,
  slug: string,
) {
  await exigirMiembro(userId, coupleId);

  if (!TEMAS_PLAN.some((t) => t.slug === slug)) {
    throw new Error("Ese tema no existe en el plan.");
  }

  await db.transaction(async (tx) => {
    const fila = await tx.query.couplePlanProgress.findFirst({
      where: eq(couplePlanProgress.coupleId, coupleId),
    });

    const completados = new Set(fila?.temasCompletados ?? []);
    completados.add(slug);

    await tx
      .insert(couplePlanProgress)
      .values({
        coupleId,
        semanaActual: Math.min(completados.size + 1, TOTAL_SEMANAS_PLAN),
        temasCompletados: [...completados],
      })
      .onConflictDoUpdate({
        target: couplePlanProgress.coupleId,
        set: {
          semanaActual: Math.min(completados.size + 1, TOTAL_SEMANAS_PLAN),
          temasCompletados: [...completados],
          updatedAt: new Date(),
        },
      });
  });
}
