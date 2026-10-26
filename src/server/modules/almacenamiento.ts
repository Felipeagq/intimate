import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { almacenamientoHabilitado, env } from "../env";

/**
 * Fotos de perfil en S3.
 *
 * El bucket es privado. Las imágenes no se sirven por URL pública ni
 * siquiera con una ruta difícil de adivinar: cada vez que se muestra una
 * foto se firma un enlace que caduca. En una app donde la gente escribe lo
 * más íntimo que escribe, una foto de perfil accesible para cualquiera que
 * tenga el enlace no es aceptable.
 *
 * La subida va directa del navegador a S3 con un permiso temporal: la
 * imagen nunca pasa por el cómputo de Amplify, que tiene límite de tamaño
 * de petición.
 */

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB tras recortar en el navegador
const VIGENCIA_SUBIDA = 60 * 5; // 5 minutos para completar la subida
const VIGENCIA_LECTURA = 60 * 60; // 1 hora de vida del enlace de lectura

let cliente: S3Client | null = null;

function s3() {
  if (!almacenamientoHabilitado) {
    throw new Error(
      "El almacenamiento de fotos no está configurado. Faltan S3_BUCKET, " +
        "S3_REGION, S3_AWS_ACCESS_KEY_ID o S3_AWS_SECRET_ACCESS_KEY.",
    );
  }

  cliente ??= new S3Client({
    region: env.S3_REGION!,
    credentials: {
      accessKeyId: env.S3_AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_AWS_SECRET_ACCESS_KEY!,
    },
  });

  return cliente;
}

/**
 * Prefijo de las fotos dentro del bucket.
 *
 * S3_FOLDER permite compartir un bucket entre proyectos o entornos sin que
 * se pisen: por ejemplo "intimate/produccion". Si está vacío, cuelga de la
 * raíz.
 */
function prefijoAvatares(userId: string) {
  const carpeta = env.S3_FOLDER ? `${env.S3_FOLDER}/` : "";
  return `${carpeta}avatares/${userId}/`;
}

export function esTipoPermitido(tipo: string): boolean {
  return (TIPOS_PERMITIDOS as readonly string[]).includes(tipo);
}

/**
 * Firma un permiso para que el navegador suba un archivo concreto.
 *
 * La ruta la decide el servidor e incluye el id del usuario, así nadie
 * puede pedir permiso para escribir sobre la foto de otra persona. El tipo
 * y el tamaño se validan aquí, no solo en el navegador.
 */
export async function firmarSubidaDeFoto(
  userId: string,
  tipo: string,
  tamano: number,
) {
  if (!esTipoPermitido(tipo)) {
    throw new Error("Solo se admiten imágenes JPG, PNG o WebP.");
  }
  if (tamano <= 0 || tamano > TAMANO_MAXIMO) {
    throw new Error("La imagen supera el tamaño permitido.");
  }

  const extension = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const clave = `${prefijoAvatares(userId)}${randomUUID()}.${extension}`;

  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: clave,
      ContentType: tipo,
      ContentLength: tamano,
    }),
    { expiresIn: VIGENCIA_SUBIDA },
  );

  return { url, clave };
}

/** Enlace de lectura temporal. Devuelve null si no hay foto o falla. */
export async function urlDeFoto(clave: string | null): Promise<string | null> {
  if (!clave || !almacenamientoHabilitado) return null;

  // Una foto antigua guardada como URL completa se devuelve tal cual.
  if (clave.startsWith("http")) return clave;

  try {
    return await getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: env.S3_BUCKET!, Key: clave }),
      { expiresIn: VIGENCIA_LECTURA },
    );
  } catch {
    // Una foto que no se puede firmar no debe romper la pantalla entera.
    return null;
  }
}

/** Firma varias de una vez, para la pareja o para listas. */
export async function urlsDeFotos(
  claves: (string | null)[],
): Promise<(string | null)[]> {
  return Promise.all(claves.map((c) => urlDeFoto(c)));
}

export async function borrarFoto(clave: string | null) {
  if (!clave || clave.startsWith("http") || !almacenamientoHabilitado) return;

  try {
    await s3().send(
      new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: clave }),
    );
  } catch {
    // Dejar un archivo huérfano es preferible a bloquear al usuario.
  }
}

/** La ruta pertenece a quien dice: evita escribir sobre la foto de otro. */
export function claveEsDelUsuario(clave: string, userId: string) {
  return clave.startsWith(prefijoAvatares(userId));
}

/**
 * Comprueba que se pueda escribir y borrar en el bucket, que es lo que la
 * app necesita de verdad. Escribe un archivo diminuto y lo borra.
 *
 * No usa `HeadBucket` a propósito: exige un permiso (ListBucket) que una
 * política de IAM mínima puede no tener aunque las fotos funcionen, y daría
 * una falsa alarma.
 */
export async function probarAlmacenamiento(): Promise<{
  ok: boolean;
  detalle: string;
}> {
  if (!almacenamientoHabilitado) {
    return { ok: false, detalle: "Faltan variables S3_*." };
  }

  const carpeta = env.S3_FOLDER ? `${env.S3_FOLDER}/` : "";
  const clave = `${carpeta}salud/ping-${Date.now()}.txt`;

  try {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: clave,
        Body: "ok",
        ContentType: "text/plain",
      }),
    );
    await s3().send(
      new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: clave }),
    );
    return { ok: true, detalle: "Escribe y borra en el bucket." };
  } catch (e) {
    const nombre = e instanceof Error ? e.name : "Error";
    return {
      ok: false,
      detalle:
        nombre === "AccessDenied"
          ? "Acceso denegado: la política de IAM necesita PutObject y DeleteObject sobre la carpeta."
          : `No se pudo escribir en el bucket (${nombre}).`,
    };
  }
}
