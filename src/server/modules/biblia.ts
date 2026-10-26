import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { bibleChapters } from "../db/schema-app";
import {
  formatearReferencia,
  interpretarReferencia,
} from "./referencia-biblica";

/**
 * Texto bíblico.
 *
 * Traducción: Reina-Valera 1909, que es de dominio público (se publicó antes
 * de 1923). Es una elección legal, no de gusto: la Reina-Valera 1960, que es
 * la que la mayoría reconoce, tiene derechos de autor y no se puede servir
 * sin licencia. El costo es el lenguaje: la 1909 conserva giros antiguos
 * ("díjole", "á" como preposición).
 *
 * El texto lo sirve la API pública de getBible. No hay garantía de que siga
 * disponible, por eso cada capítulo se guarda la primera vez que se pide.
 */
export const TRADUCCION = { id: "valera", nombre: "Reina-Valera 1909" } as const;

const API = "https://api.getbible.net/v2";
const ESPERA_MS = 6000;

/**
 * Límites por uso. Coinciden con los de los formularios donde se guarda el
 * texto, para no traer un pasaje que luego no se puede guardar.
 */
export const LIMITES = { devocional: 4000, promesa: 2000 } as const;
export type Uso = keyof typeof LIMITES;

type Versiculo = { verso: number; texto: string };

// Lo que devuelve un servicio externo no se da por bueno: se valida la forma.
const esquemaCapitulo = z.object({
  verses: z
    .array(
      z.object({
        verse: z.number().int().positive(),
        text: z.string().max(3000),
      }),
    )
    .min(1)
    .max(200),
});

export type ResultadoPasaje =
  | { ok: true; referencia: string; texto: string; traduccion: string }
  | { ok: false; error: string };

async function pedirCapitulo(
  libro: number,
  capitulo: number,
): Promise<Versiculo[] | null> {
  // La dirección se arma solo con enteros ya validados, nunca con texto de
  // la persona: no hay forma de dirigir esta petición a otro servidor.
  if (!Number.isInteger(libro) || libro < 1 || libro > 66) return null;
  if (!Number.isInteger(capitulo) || capitulo < 1 || capitulo > 150) return null;

  const url = `${API}/${TRADUCCION.id}/${libro}/${capitulo}.json`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!res.ok) return null;

    const datos = esquemaCapitulo.safeParse(await res.json());
    if (!datos.success) return null;

    return datos.data.verses.map((v) => ({
      verso: v.verse,
      texto: v.text.trim(),
    }));
  } catch {
    // Sin red, tiempo agotado o respuesta que no es JSON: se trata igual.
    return null;
  }
}

async function obtenerCapitulo(
  libro: number,
  capitulo: number,
): Promise<Versiculo[] | null> {
  const guardado = await db.query.bibleChapters.findFirst({
    where: and(
      eq(bibleChapters.traduccion, TRADUCCION.id),
      eq(bibleChapters.libro, libro),
      eq(bibleChapters.capitulo, capitulo),
    ),
  });
  if (guardado) return guardado.versiculos;

  const versiculos = await pedirCapitulo(libro, capitulo);
  if (!versiculos) return null;

  await db
    .insert(bibleChapters)
    .values({ traduccion: TRADUCCION.id, libro, capitulo, versiculos })
    // Dos personas pidiendo el mismo capítulo a la vez no es un error.
    .onConflictDoNothing();

  return versiculos;
}

export async function buscarPasaje(
  entrada: string,
  uso: Uso = "devocional",
): Promise<ResultadoPasaje> {
  const interpretada = interpretarReferencia(entrada);
  if (!interpretada.ok) return { ok: false, error: interpretada.error };

  const r = interpretada.referencia;
  const versiculos = await obtenerCapitulo(r.libro.nr, r.capitulo);

  if (!versiculos) {
    return {
      ok: false,
      error: `No pudimos traer ${r.libro.nombre} ${r.capitulo}. Puede que ese capítulo no exista, o que el servicio no responda ahora. Puedes escribir el texto a mano.`,
    };
  }

  const ultimo = Math.max(...versiculos.map((v) => v.verso));

  if (r.desde !== null && (r.desde > ultimo || (r.hasta ?? 0) > ultimo)) {
    return {
      ok: false,
      error: `${r.libro.nombre} ${r.capitulo} solo tiene ${ultimo} versículos.`,
    };
  }

  const tramo =
    r.desde === null
      ? versiculos
      : versiculos.filter((v) => v.verso >= r.desde! && v.verso <= r.hasta!);

  if (tramo.length === 0) {
    return {
      ok: false,
      error: `No encontramos esos versículos en ${r.libro.nombre} ${r.capitulo}.`,
    };
  }

  // Un solo versículo va limpio; varios llevan su número, para poder
  // seguir la lectura.
  const texto =
    tramo.length === 1 && r.desde !== null
      ? tramo[0].texto
      : tramo.map((v) => `${v.verso} ${v.texto}`).join(" ");

  const maximo = LIMITES[uso];
  if (texto.length > maximo) {
    return {
      ok: false,
      error: `Ese pasaje es muy largo (${texto.length} caracteres; el límite es ${maximo}). Elige un tramo más corto, por ejemplo ${r.libro.nombre} ${r.capitulo}:1-10.`,
    };
  }

  return {
    ok: true,
    referencia: formatearReferencia(r),
    texto,
    traduccion: TRADUCCION.nombre,
  };
}

/** Comprueba que la API bíblica responda, sin pasar por la caché. */
export async function probarApiBiblica(): Promise<{
  ok: boolean;
  detalle: string;
}> {
  // Abdías 1: el capítulo más corto, para que la prueba pese casi nada.
  const versiculos = await pedirCapitulo(31, 1);
  return versiculos
    ? { ok: true, detalle: `Responde (${TRADUCCION.nombre}).` }
    : { ok: false, detalle: "No responde. Las consultas ya guardadas siguen funcionando." };
}
