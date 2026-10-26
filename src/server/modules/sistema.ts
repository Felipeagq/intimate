import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { emailEvents } from "../db/schema-sistema";
import { env, almacenamientoHabilitado, correoHabilitado } from "../env";
import { probarSendGrid } from "../email";
import { probarAlmacenamiento } from "./almacenamiento";
import { probarApiBiblica } from "./biblia";

/**
 * Salud del sistema, para que quien opera el producto sepa si algo falla
 * antes de que se lo diga un usuario.
 *
 * Nada de lo que sale de aquí incluye valores de configuración: solo si una
 * variable está definida o no.
 */

export type EstadoComprobacion = "ok" | "fallo" | "sin_configurar";

export type Comprobacion = {
  id: string;
  nombre: string;
  estado: EstadoComprobacion;
  detalle: string;
  ms: number | null;
};

async function medir(
  id: string,
  nombre: string,
  fn: () => Promise<{ ok: boolean; detalle: string }>,
  configurado = true,
): Promise<Comprobacion> {
  if (!configurado) {
    return {
      id,
      nombre,
      estado: "sin_configurar",
      detalle: "No está configurado en este entorno.",
      ms: null,
    };
  }

  const inicio = performance.now();
  try {
    const r = await fn();
    return {
      id,
      nombre,
      estado: r.ok ? "ok" : "fallo",
      detalle: r.detalle,
      ms: Math.round(performance.now() - inicio),
    };
  } catch (e) {
    return {
      id,
      nombre,
      estado: "fallo",
      detalle: e instanceof Error ? e.message : "Error desconocido.",
      ms: Math.round(performance.now() - inicio),
    };
  }
}

/** Pruebas activas: hacen peticiones de verdad, así que van bajo demanda. */
export async function comprobarConexiones(): Promise<Comprobacion[]> {
  return Promise.all([
    medir("db", "Base de datos", async () => {
      await db.execute(sql`select 1`);
      return { ok: true, detalle: "Responde." };
    }),
    medir("correo", "Correo (SendGrid)", probarSendGrid, correoHabilitado),
    medir("s3", "Fotos (S3)", probarAlmacenamiento, almacenamientoHabilitado),
    medir("biblia", "Texto bíblico", probarApiBiblica),
  ]);
}

// ------------------------------------------------------------ Configuración

export type VariableConfig = {
  nombre: string;
  definida: boolean;
  obligatoria: boolean;
};

export type GrupoConfig = { grupo: string; variables: VariableConfig[] };

export function revisarConfiguracion(): {
  grupos: GrupoConfig[];
  avisos: string[];
} {
  const v = (nombre: string, valor: unknown, obligatoria = false): VariableConfig => ({
    nombre,
    definida: Boolean(valor),
    obligatoria,
  });

  const grupos: GrupoConfig[] = [
    {
      grupo: "Núcleo",
      variables: [
        v("DATABASE_URL", env.DATABASE_URL, true),
        v("BETTER_AUTH_SECRET", env.BETTER_AUTH_SECRET, true),
        v("BETTER_AUTH_URL", env.BETTER_AUTH_URL, true),
      ],
    },
    {
      grupo: "Correo",
      variables: [
        v("SENDGRID_API_KEY", env.SENDGRID_API_KEY),
        v("EMAIL", env.EMAIL),
      ],
    },
    {
      grupo: "Fotos de perfil",
      variables: [
        v("S3_BUCKET", env.S3_BUCKET),
        v("S3_REGION", env.S3_REGION),
        v("S3_AWS_ACCESS_KEY_ID", env.S3_AWS_ACCESS_KEY_ID),
        v("S3_AWS_SECRET_ACCESS_KEY", env.S3_AWS_SECRET_ACCESS_KEY),
      ],
    },
    {
      grupo: "Entrar con Google",
      variables: [
        v("GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID),
        v("GOOGLE_CLIENT_SECRET", env.GOOGLE_CLIENT_SECRET),
      ],
    },
  ];

  const avisos: string[] = [];

  // Una configuración a medias falla en silencio: la app arranca, pero la
  // función no aparece, y nadie sabe por qué.
  for (const g of grupos.filter((g) => !g.variables.some((x) => x.obligatoria))) {
    const puestas = g.variables.filter((x) => x.definida).length;
    if (puestas > 0 && puestas < g.variables.length) {
      const faltan = g.variables.filter((x) => !x.definida).map((x) => x.nombre);
      avisos.push(
        `${g.grupo} está a medias: faltan ${faltan.join(", ")}. La función no se activa hasta tener todas.`,
      );
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    /localhost|127\.0\.0\.1/.test(env.BETTER_AUTH_URL)
  ) {
    avisos.push(
      "BETTER_AUTH_URL apunta a localhost en producción: los enlaces de los correos llevarían a cada persona a su propio ordenador.",
    );
  }

  return { grupos, avisos };
}

// ------------------------------------------------------------------- Correos

export async function resumenCorreos(dias = 7) {
  const desde = new Date(Date.now() - dias * 86_400_000);

  const [fila] = await db
    .select({
      enviados: sql<number>`count(*) filter (where ${emailEvents.estado} = 'enviado')::int`,
      fallidos: sql<number>`count(*) filter (where ${emailEvents.estado} = 'fallido')::int`,
    })
    .from(emailEvents)
    .where(gte(emailEvents.createdAt, desde));

  const enviados = fila?.enviados ?? 0;
  const fallidos = fila?.fallidos ?? 0;
  const total = enviados + fallidos;

  return {
    enviados,
    fallidos,
    // null cuando no hubo envíos: 0 % de entrega significaría otra cosa.
    entrega: total > 0 ? Math.round((enviados / total) * 100) : null,
  };
}

export async function correosFallidos(limite = 30) {
  return db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.estado, "fallido"))
    .orderBy(desc(emailEvents.createdAt))
    .limit(limite);
}
