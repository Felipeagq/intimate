/**
 * Interpreta una cita bíblica escrita a mano.
 *
 * La gente escribe "Juan 3:16", "Jn 3:16-18", "1 Co 13", "I Corintios 13:4-7",
 * "salmo 23" o "Ro. 8.28". Este módulo lo reduce a un libro, un capítulo y,
 * si los hay, un rango de versículos. Es una función pura: no toca red ni
 * base de datos, así que se puede probar a fondo.
 *
 * Los números de libro siguen el orden canónico protestante (Génesis = 1,
 * Apocalipsis = 66), que es el que usa la API bíblica.
 */

type Libro = { nr: number; nombre: string; alias: string[] };

/**
 * `alias` va sin acentos, en minúsculas y sin espacios ni puntos: así se
 * compara contra el texto ya normalizado. Los libros numerados llevan el
 * número pegado ("1co"), que es como se normaliza "1 Co." al comparar.
 */
export const LIBROS: Libro[] = [
  { nr: 1, nombre: "Génesis", alias: ["genesis", "gn", "gen", "ge"] },
  { nr: 2, nombre: "Éxodo", alias: ["exodo", "ex", "exo"] },
  { nr: 3, nombre: "Levítico", alias: ["levitico", "lv", "lev", "le"] },
  { nr: 4, nombre: "Números", alias: ["numeros", "nm", "num", "nu"] },
  { nr: 5, nombre: "Deuteronomio", alias: ["deuteronomio", "dt", "deu", "de"] },
  { nr: 6, nombre: "Josué", alias: ["josue", "jos", "jsh"] },
  { nr: 7, nombre: "Jueces", alias: ["jueces", "jue", "jc"] },
  { nr: 8, nombre: "Rut", alias: ["rut", "rt"] },
  { nr: 9, nombre: "1 Samuel", alias: ["1samuel", "1s", "1sa", "1sam"] },
  { nr: 10, nombre: "2 Samuel", alias: ["2samuel", "2s", "2sa", "2sam"] },
  { nr: 11, nombre: "1 Reyes", alias: ["1reyes", "1r", "1re", "1rey"] },
  { nr: 12, nombre: "2 Reyes", alias: ["2reyes", "2r", "2re", "2rey"] },
  { nr: 13, nombre: "1 Crónicas", alias: ["1cronicas", "1cr", "1cro"] },
  { nr: 14, nombre: "2 Crónicas", alias: ["2cronicas", "2cr", "2cro"] },
  { nr: 15, nombre: "Esdras", alias: ["esdras", "esd"] },
  { nr: 16, nombre: "Nehemías", alias: ["nehemias", "neh", "ne"] },
  { nr: 17, nombre: "Ester", alias: ["ester", "est", "es"] },
  { nr: 18, nombre: "Job", alias: ["job", "jb"] },
  { nr: 19, nombre: "Salmos", alias: ["salmos", "salmo", "sal", "sl", "ps"] },
  { nr: 20, nombre: "Proverbios", alias: ["proverbios", "pr", "prov", "pro"] },
  { nr: 21, nombre: "Eclesiastés", alias: ["eclesiastes", "ec", "ecl", "ecle"] },
  {
    nr: 22,
    nombre: "Cantares",
    alias: [
      "cantares",
      "cantar",
      "cnt",
      "cant",
      "cantardeloscantares",
      "cantaresdesalomon",
    ],
  },
  { nr: 23, nombre: "Isaías", alias: ["isaias", "is", "isa"] },
  { nr: 24, nombre: "Jeremías", alias: ["jeremias", "jer", "jr"] },
  { nr: 25, nombre: "Lamentaciones", alias: ["lamentaciones", "lm", "lam"] },
  { nr: 26, nombre: "Ezequiel", alias: ["ezequiel", "ez", "eze"] },
  { nr: 27, nombre: "Daniel", alias: ["daniel", "dn", "dan"] },
  { nr: 28, nombre: "Oseas", alias: ["oseas", "os", "ose"] },
  { nr: 29, nombre: "Joel", alias: ["joel", "jl"] },
  { nr: 30, nombre: "Amós", alias: ["amos", "am"] },
  { nr: 31, nombre: "Abdías", alias: ["abdias", "abd", "ab"] },
  { nr: 32, nombre: "Jonás", alias: ["jonas", "jon"] },
  { nr: 33, nombre: "Miqueas", alias: ["miqueas", "miq", "mi"] },
  { nr: 34, nombre: "Nahúm", alias: ["nahum", "nah", "na"] },
  { nr: 35, nombre: "Habacuc", alias: ["habacuc", "hab", "hb"] },
  { nr: 36, nombre: "Sofonías", alias: ["sofonias", "sof"] },
  { nr: 37, nombre: "Hageo", alias: ["hageo", "hag"] },
  { nr: 38, nombre: "Zacarías", alias: ["zacarias", "zac", "zc"] },
  { nr: 39, nombre: "Malaquías", alias: ["malaquias", "mal"] },
  { nr: 40, nombre: "Mateo", alias: ["mateo", "mt", "mat"] },
  { nr: 41, nombre: "Marcos", alias: ["marcos", "mr", "mc", "mar"] },
  { nr: 42, nombre: "Lucas", alias: ["lucas", "lc", "luc"] },
  { nr: 43, nombre: "Juan", alias: ["juan", "jn", "jua"] },
  { nr: 44, nombre: "Hechos", alias: ["hechos", "hch", "hec"] },
  { nr: 45, nombre: "Romanos", alias: ["romanos", "ro", "rom", "rm"] },
  { nr: 46, nombre: "1 Corintios", alias: ["1corintios", "1co", "1cor"] },
  { nr: 47, nombre: "2 Corintios", alias: ["2corintios", "2co", "2cor"] },
  { nr: 48, nombre: "Gálatas", alias: ["galatas", "ga", "gal", "gl"] },
  { nr: 49, nombre: "Efesios", alias: ["efesios", "ef", "efe"] },
  { nr: 50, nombre: "Filipenses", alias: ["filipenses", "fil", "flp"] },
  { nr: 51, nombre: "Colosenses", alias: ["colosenses", "col"] },
  { nr: 52, nombre: "1 Tesalonicenses", alias: ["1tesalonicenses", "1ts", "1tes"] },
  { nr: 53, nombre: "2 Tesalonicenses", alias: ["2tesalonicenses", "2ts", "2tes"] },
  { nr: 54, nombre: "1 Timoteo", alias: ["1timoteo", "1ti", "1tim"] },
  { nr: 55, nombre: "2 Timoteo", alias: ["2timoteo", "2ti", "2tim"] },
  { nr: 56, nombre: "Tito", alias: ["tito", "tit", "tt"] },
  { nr: 57, nombre: "Filemón", alias: ["filemon", "flm", "filem"] },
  { nr: 58, nombre: "Hebreos", alias: ["hebreos", "he", "heb"] },
  { nr: 59, nombre: "Santiago", alias: ["santiago", "stg", "sant", "snt"] },
  { nr: 60, nombre: "1 Pedro", alias: ["1pedro", "1p", "1pe", "1ped"] },
  { nr: 61, nombre: "2 Pedro", alias: ["2pedro", "2p", "2pe", "2ped"] },
  { nr: 62, nombre: "1 Juan", alias: ["1juan", "1jn", "1jua"] },
  { nr: 63, nombre: "2 Juan", alias: ["2juan", "2jn", "2jua"] },
  { nr: 64, nombre: "3 Juan", alias: ["3juan", "3jn", "3jua"] },
  { nr: 65, nombre: "Judas", alias: ["judas", "jud"] },
  { nr: 66, nombre: "Apocalipsis", alias: ["apocalipsis", "ap", "apoc"] },
];

const POR_ALIAS = new Map<string, Libro>();
for (const libro of LIBROS) {
  for (const alias of libro.alias) POR_ALIAS.set(alias, libro);
}

export type Referencia = {
  libro: Libro;
  capitulo: number;
  /** null = el capítulo completo. */
  desde: number | null;
  hasta: number | null;
};

export type ResultadoParseo =
  | { ok: true; referencia: Referencia }
  | { ok: false; error: string };

/**
 * Minúsculas y sin acentos. Solo se quita el punto de las abreviaturas
 * ("Ro." → "Ro"), el que va pegado a una letra: el que separa capítulo de
 * versículo ("8.28") tiene que sobrevivir.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/(?<=[a-z])\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PREFIJOS: Record<string, string> = {
  "1": "1",
  "2": "2",
  "3": "3",
  i: "1",
  ii: "2",
  iii: "3",
  primera: "1",
  segunda: "2",
  tercera: "3",
  primero: "1",
  segundo: "2",
  tercero: "3",
};

/**
 *   [prefijo numérico] nombre  capítulo [ : versículo [ - versículo ] ]
 *
 * Los prefijos romanos o en palabras ("I", "Primera", "Primera de") exigen
 * un espacio detrás; si no, la "I" de "Isaías" se leería como "1" y buscaría "saías".
 * Los dígitos pueden ir pegados ("1Co").
 *
 * El separador capítulo/versículo puede ser ":", "." o ",", porque así se
 * escribe en distintos países. Los rangos entre capítulos ("3:16-4:2") no se
 * admiten: un devocional trabaja un tramo, no un tramo que cruza capítulos.
 */
const PATRON =
  /^(?:(?:(1|2|3)\s*|(iii|ii|i|primera|segunda|tercera|primero|segundo|tercero)(?:\s+de)?\s+))?([a-z][a-z ]*?)\s*(\d{1,3})(?:\s*[:.,]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?$/;

export function interpretarReferencia(entrada: string): ResultadoParseo {
  const texto = normalizar(entrada);

  if (!texto) return { ok: false, error: "Escribe una cita, por ejemplo Juan 3:16." };
  if (texto.length > 80) return { ok: false, error: "Esa cita es demasiado larga." };

  const m = PATRON.exec(texto);
  if (!m) {
    return {
      ok: false,
      error:
        "No entendí esa cita. Prueba con un formato como Juan 3:16, Salmo 23 o 1 Corintios 13:4-7.",
    };
  }

  const [, prefijoDigito, prefijoPalabra, nombreCrudo, cap, ini, fin] = m;

  const prefijoCrudo = prefijoDigito ?? prefijoPalabra;
  const prefijo = prefijoCrudo ? PREFIJOS[prefijoCrudo] : "";
  const clave = `${prefijo}${nombreCrudo.replace(/\s+/g, "")}`;
  const libro = POR_ALIAS.get(clave);

  if (!libro) {
    return {
      ok: false,
      error: `No reconozco el libro "${nombreCrudo.trim()}". Revisa cómo está escrito.`,
    };
  }

  const capitulo = Number(cap);
  if (capitulo < 1) return { ok: false, error: "El capítulo debe ser 1 o mayor." };

  if (ini === undefined) {
    return {
      ok: true,
      referencia: { libro, capitulo, desde: null, hasta: null },
    };
  }

  const desde = Number(ini);
  const hasta = fin === undefined ? desde : Number(fin);

  if (desde < 1) return { ok: false, error: "El versículo debe ser 1 o mayor." };
  if (hasta < desde) {
    return {
      ok: false,
      error: `El rango está al revés: ${desde}-${hasta}. El versículo final no puede ser menor que el inicial.`,
    };
  }

  return { ok: true, referencia: { libro, capitulo, desde, hasta } };
}

/** "Juan 3:16", "Juan 3:16-18" o "Salmos 23". */
export function formatearReferencia(r: Referencia): string {
  if (r.desde === null) return `${r.libro.nombre} ${r.capitulo}`;
  if (r.desde === r.hasta) return `${r.libro.nombre} ${r.capitulo}:${r.desde}`;
  return `${r.libro.nombre} ${r.capitulo}:${r.desde}-${r.hasta}`;
}
