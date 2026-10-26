/**
 * Datos de muestra para desarrollar las vistas antes de conectar Neon.
 * Se reemplazan por casos de uso de `src/server/modules` cuando exista el
 * acceso a datos. Ningún dato real vive aquí.
 */

export const usuario = {
  nombre: "Sharid",
  email: "sofia@ejemplo.com",
  zonaHoraria: "America/Bogota",
};

export const pareja = {
  nombre: "Felipe",
  vinculadaEn: "2026-02-14",
  diasJuntos: 254,
  rachaPareja: 24,
  rachaMasLarga: 41,
};

export const devocionalHoy = {
  pasaje: "Eclesiastés 4:9-12",
  titulo: "Cordón de tres dobleces",
  texto:
    "Mejores son dos que uno, porque tienen mejor paga de su trabajo. Porque si cayeren, el uno levantará a su compañero; pero ¡ay del solo! que cuando cayere, no habrá segundo que lo levante.",
  miRespuesta:
    "Me costó pedir ayuda esta semana. Entendí que no es debilidad: fuimos hechos para sostenernos.",
  respuestaPareja: null as string | null,
  yoRespondi: true,
  parejaRespondio: false,
};

export const rachas = {
  actual: 24,
  masLarga: 41,
  diaDeGraciaUsado: false,
  constanciaDelMes: 86,
  minutosEstaSemana: 142,
};

/** Mapa de calor: 0 = sin oración, 1 = día de gracia, 2 = oró, 3 = devocional. */
export const mapaCalor: number[] = Array.from({ length: 119 }, (_, i) => {
  const seed = (i * 37) % 11;
  if (seed === 0) return 0;
  if (seed === 1) return 1;
  if (seed < 6) return 2;
  return 3;
});

export const peticiones = [
  {
    id: "p1",
    titulo: "El trabajo de Mateo",
    detalle: "Que haya claridad con la oferta que está esperando.",
    estado: "activa" as const,
    compartida: true,
    fecha: "2026-10-18",
  },
  {
    id: "p2",
    titulo: "Nuestra conversación sobre finanzas",
    detalle: "Que podamos hablarlo con calma y sin pelear.",
    estado: "activa" as const,
    compartida: true,
    fecha: "2026-10-21",
  },
  {
    id: "p3",
    titulo: "La salud de mi mamá",
    detalle: "Resultados de los exámenes.",
    estado: "respondida" as const,
    compartida: false,
    fecha: "2026-09-30",
    respondidaEn: "2026-10-12",
    nota: "Salieron bien. Dios fue bueno.",
  },
];

export const promesas = [
  {
    id: "pr1",
    cita: "Jeremías 29:11",
    texto:
      "Porque yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz y no de mal, para daros el fin que esperáis.",
    contexto: "Cuando no sabía si quedarme en la ciudad o volver a casa.",
    fecha: "2026-03-02",
    cumplida: false,
    etiquetas: ["dirección", "futuro"],
  },
  {
    id: "pr2",
    cita: "Isaías 41:10",
    texto: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.",
    contexto: "La semana de la entrevista.",
    fecha: "2026-05-19",
    cumplida: true,
    cumplidaEn: "2026-07-01",
    testimonio: "Me dieron el puesto, pero lo que más recuerdo es la paz.",
    etiquetas: ["temor"],
  },
  {
    id: "pr3",
    cita: "Salmo 37:4",
    texto: "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.",
    contexto: "Orando por nuestra relación.",
    fecha: "2026-08-11",
    cumplida: false,
    etiquetas: ["relación"],
  },
];

export const acuerdos = [
  {
    id: "a1",
    titulo: "Pureza y límites físicos",
    descripcion:
      "Nos cuidamos mutuamente. No pasamos la noche solos en casa del otro.",
    estado: "vigente" as const,
    fecha: "2026-02-20",
    confirmadoPorAmbos: true,
    proximaRevision: "2026-11-20",
  },
  {
    id: "a2",
    titulo: "Un devocional juntos, mínimo tres veces por semana",
    descripcion: "Martes, jueves y domingo. Si uno falla, no hay reclamo.",
    estado: "vigente" as const,
    fecha: "2026-03-05",
    confirmadoPorAmbos: true,
    proximaRevision: "2026-12-05",
  },
  {
    id: "a3",
    titulo: "Redes sociales",
    descripcion:
      "Nada de publicar discusiones. Las cuentas son de cada uno y se respetan.",
    estado: "en revisión" as const,
    fecha: "2026-09-14",
    confirmadoPorAmbos: false,
    proximaRevision: null,
  },
];

export const afirmaciones = [
  {
    id: "af1",
    de: "Mateo",
    mensaje:
      "Gracias por cómo oraste por mí ayer. Me dio calma que no sabía que necesitaba.",
    fecha: "2026-10-24",
    favorita: true,
  },
  {
    id: "af2",
    de: "Sofía",
    mensaje: "Me gusta ver cómo tratas a tu hermana. Dice mucho de quién eres.",
    fecha: "2026-10-20",
    favorita: false,
  },
];

export const checkInSemanal = {
  semana: "20 al 26 de octubre",
  preguntas: [
    "¿Cómo estuvo tu semana con Dios?",
    "¿En qué sentiste que te cuidé esta semana?",
    "¿Hay algo que quedó sin decir?",
  ],
  yoRespondi: true,
  parejaRespondio: false,
};

export const conociendonos = {
  temaActual: "Finanzas",
  semana: 7,
  totalSemanas: 18,
  completados: ["Fe", "Familia de origen", "Conflictos", "Tiempo libre", "Amistades", "Trabajo"],
  siguientes: ["Hijos", "Llamado", "Salud", "Sexualidad en el matrimonio"],
};
