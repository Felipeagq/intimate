/**
 * Prueba la búsqueda de pasajes contra la API real y contra la base.
 *
 *   pnpm test:biblia
 *
 * Va aparte de la prueba principal a propósito: depende de un servicio
 * externo, y una caída ajena no debería marcar como roto el resto del código.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../src/server/db/client";
import { bibleChapters } from "../src/server/db/schema-app";
import { buscarPasaje, TRADUCCION } from "../src/server/modules/biblia";

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean) {
  console.log(`  ${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallos++;
}

// Capítulo que no suele consultarse en otras pruebas, para poder comprobar
// que la primera petición viene de la red y la segunda de la base.
const LIBRO_PRUEBA = 31; // Abdías, 1 capítulo
const CAPITULO_PRUEBA = 1;

async function main() {
  console.log("\n— Pasaje real —");
  const juan = await buscarPasaje("Juan 3:16");
  comprobar("encuentra Juan 3:16", juan.ok);
  if (juan.ok) {
    console.log(`         “${juan.texto}”`);
    comprobar("normaliza la referencia", juan.referencia === "Juan 3:16");
    comprobar("indica la traducción", juan.traduccion === TRADUCCION.nombre);
    comprobar("es el texto correcto", juan.texto.includes("unigénito"));
    comprobar("un solo versículo va sin número delante", !/^\d/.test(juan.texto));
  }

  console.log("\n— Varios versículos —");
  const rango = await buscarPasaje("Ro 8:28-30");
  comprobar("encuentra un rango", rango.ok);
  if (rango.ok) {
    comprobar("normaliza el rango", rango.referencia === "Romanos 8:28-30");
    comprobar(
      "los lleva numerados",
      rango.texto.startsWith("28 ") && rango.texto.includes(" 29 ") && rango.texto.includes(" 30 "),
    );
    comprobar("y no se pasa del rango", !rango.texto.includes(" 31 "));
  }

  console.log("\n— Capítulo completo —");
  const salmo = await buscarPasaje("Salmo 23");
  comprobar("trae el salmo 23 entero", salmo.ok && salmo.texto.startsWith("1 "));

  console.log("\n— Errores —");
  const inexistente = await buscarPasaje("Juan 3:999");
  comprobar(
    "avisa cuando el versículo no existe",
    !inexistente.ok && /solo tiene/.test(inexistente.error),
  );
  const capInexistente = await buscarPasaje("Juan 99:1");
  comprobar("avisa cuando el capítulo no existe", !capInexistente.ok);
  const basura = await buscarPasaje("hola mundo");
  comprobar("rechaza lo que no es una cita", !basura.ok);

  const largo = await buscarPasaje("Salmo 119", "promesa");
  comprobar(
    "rechaza un pasaje que no cabe en una promesa",
    !largo.ok && /muy largo/.test(largo.error),
  );

  console.log("\n— Caché —");
  await db
    .delete(bibleChapters)
    .where(
      and(
        eq(bibleChapters.libro, LIBRO_PRUEBA),
        eq(bibleChapters.capitulo, CAPITULO_PRUEBA),
      ),
    );

  const antes = await db.query.bibleChapters.findFirst({
    where: and(
      eq(bibleChapters.libro, LIBRO_PRUEBA),
      eq(bibleChapters.capitulo, CAPITULO_PRUEBA),
    ),
  });
  comprobar("empieza sin el capítulo guardado", !antes);

  const primera = await buscarPasaje("Abdías 1:1");
  const guardado = await db.query.bibleChapters.findFirst({
    where: and(
      eq(bibleChapters.libro, LIBRO_PRUEBA),
      eq(bibleChapters.capitulo, CAPITULO_PRUEBA),
    ),
  });
  comprobar("la primera consulta lo guarda", primera.ok && Boolean(guardado));
  comprobar(
    "guarda el capítulo entero, no solo lo pedido",
    (guardado?.versiculos.length ?? 0) > 1,
  );

  // Se cambia el texto guardado para demostrar que la segunda consulta lee
  // de la base y no vuelve a la red.
  await db
    .update(bibleChapters)
    .set({ versiculos: [{ verso: 1, texto: "TEXTO-DE-LA-CACHE" }] })
    .where(
      and(
        eq(bibleChapters.libro, LIBRO_PRUEBA),
        eq(bibleChapters.capitulo, CAPITULO_PRUEBA),
      ),
    );
  const segunda = await buscarPasaje("Abdías 1:1");
  comprobar(
    "la segunda consulta sale de la base, no de la red",
    segunda.ok && segunda.texto === "TEXTO-DE-LA-CACHE",
  );

  // Se deja el capítulo como estaba: sin el texto de prueba.
  await db
    .delete(bibleChapters)
    .where(
      and(
        eq(bibleChapters.libro, LIBRO_PRUEBA),
        eq(bibleChapters.capitulo, CAPITULO_PRUEBA),
      ),
    );
}

main()
  .then(() => {
    console.log(
      fallos === 0
        ? "\nTodas las comprobaciones pasaron.\n"
        : `\n${fallos} comprobaciones fallaron.\n`,
    );
    process.exit(fallos === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
