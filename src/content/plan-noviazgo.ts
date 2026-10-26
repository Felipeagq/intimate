/**
 * Contenido editorial del producto, versionado en el repositorio.
 *
 * Tono interdenominacional evangélico: se apoya en lo común —Escritura,
 * oración, propósito— y evita dar por supuesta una doctrina concreta.
 * Primer borrador escrito por Claude; pendiente de revisión pastoral antes
 * de que lo vean parejas reales.
 */

/** Las tres preguntas del check-in semanal, en orden. */
export const PREGUNTAS_CHECKIN = [
  "¿Cómo estuvo tu semana con Dios?",
  "¿En qué sentiste que te cuidé esta semana?",
  "¿Hay algo que quedó sin decir?",
] as const;

export type TemaPlan = {
  slug: string;
  titulo: string;
  descripcion: string;
  preguntas: string[];
};

/**
 * Plan "Conociéndonos a fondo": una conversación por semana.
 * El orden importa: empieza por lo que une y deja lo más delicado para
 * cuando la pareja ya tiene práctica hablando.
 */
export const TEMAS_PLAN: TemaPlan[] = [
  {
    slug: "fe",
    titulo: "Fe",
    descripcion: "Dónde empezó tu historia con Dios y cómo es hoy.",
    preguntas: [
      "¿Cómo llegaste a la fe y quién tuvo que ver en eso?",
      "¿Cómo se ve tu vida con Dios en una semana normal, sin adornos?",
      "¿Qué parte de tu fe te cuesta más vivir?",
      "¿Qué esperas que compartamos espiritualmente dentro de cinco años?",
    ],
  },
  {
    slug: "familia-de-origen",
    titulo: "Familia de origen",
    descripcion: "Lo que aprendiste en casa, para bien y para mal.",
    preguntas: [
      "¿Cómo se resolvían los conflictos en tu casa?",
      "¿Qué quieres repetir de la familia en la que creciste?",
      "¿Qué no quieres repetir por nada del mundo?",
      "¿Qué tan cerca esperas estar de tus papás cuando te cases?",
    ],
  },
  {
    slug: "conflictos",
    titulo: "Conflictos",
    descripcion: "Cómo peleamos, que importa más que cuánto.",
    preguntas: [
      "Cuando te enojas, ¿te cierras o explotas?",
      "¿Qué necesitas de mí cuando estás molesto?",
      "¿Hay algo que te haya dolido y no me hayas dicho?",
      "¿Cómo sabemos que una conversación ya terminó bien?",
    ],
  },
  {
    slug: "tiempo-libre",
    titulo: "Tiempo y descanso",
    descripcion: "Qué hacemos cuando no hay nada que hacer.",
    preguntas: [
      "¿Cómo descansas de verdad?",
      "¿Cuánto tiempo a solas necesitas para estar bien?",
      "¿Qué te gustaría que hiciéramos juntos y todavía no hacemos?",
    ],
  },
  {
    slug: "amistades",
    titulo: "Amistades",
    descripcion: "Quién está alrededor de los dos.",
    preguntas: [
      "¿Quiénes son las personas que te dicen la verdad?",
      "¿Hay amistades mías que te incomoden?",
      "¿Qué lugar queremos que tenga nuestra iglesia en nuestra vida juntos?",
    ],
  },
  {
    slug: "trabajo",
    titulo: "Trabajo y estudio",
    descripcion: "El tiempo que no nos pertenece.",
    preguntas: [
      "¿Qué tan importante es tu carrera en tus planes?",
      "¿Cuántas horas estás dispuesto a trabajar cuando tengamos familia?",
      "¿Qué harías si tuvieras que elegir entre un ascenso y estar más en casa?",
    ],
  },
  {
    slug: "finanzas",
    titulo: "Finanzas",
    descripcion: "El tema que más parejas evitan y más desgasta.",
    preguntas: [
      "¿Cómo se manejaba el dinero en tu casa?",
      "¿Tienes deudas hoy? ¿Cuánto te incomoda hablar de esto?",
      "¿Las cuentas serían juntas, separadas o las dos cosas?",
      "¿Qué papel tienen la generosidad y el diezmo para ti?",
      "¿Quién llevaría las cuentas del día a día?",
    ],
  },
  {
    slug: "hijos",
    titulo: "Hijos",
    descripcion: "Si queremos, cuántos y cómo los criaríamos.",
    preguntas: [
      "¿Quieres tener hijos? ¿Cuántos, y cuándo?",
      "¿Cómo te gustaría criarlos en la fe?",
      "¿Qué harías si no pudiéramos tenerlos?",
      "¿Quién cuidaría de ellos los primeros años?",
    ],
  },
  {
    slug: "llamado",
    titulo: "Llamado y propósito",
    descripcion: "Hacia dónde creemos que Dios nos lleva.",
    preguntas: [
      "¿Qué crees que Dios te pidió hacer con tu vida?",
      "¿Estarías dispuesto a mudarte de ciudad o de país por eso?",
      "¿Cómo encaja lo que yo quiero hacer con lo tuyo?",
    ],
  },
  {
    slug: "salud",
    titulo: "Salud y límites",
    descripcion: "Cuerpo, mente y lo que cada uno necesita.",
    preguntas: [
      "¿Hay algo de tu salud que yo deba saber?",
      "¿Has ido a terapia o lo considerarías?",
      "¿Qué hábitos quieres cambiar y en cuáles necesitas ayuda?",
    ],
  },
  {
    slug: "pureza",
    titulo: "Pureza y límites físicos",
    descripcion: "Un acuerdo explícito, no una suposición.",
    preguntas: [
      "¿Qué límites queremos poner y por qué?",
      "¿Qué hacemos cuando uno de los dos los cruza?",
      "¿A quién le damos permiso de preguntarnos cómo vamos?",
    ],
  },
  {
    slug: "pasado",
    titulo: "Nuestro pasado",
    descripcion: "Lo que traemos, dicho con gracia y sin interrogatorio.",
    preguntas: [
      "¿Hay algo de tu historia que quieras contarme cuando estés listo?",
      "¿Qué necesitas de mí para que ese tema sea seguro?",
    ],
  },
];

export type PlantillaAcuerdo = {
  titulo: string;
  descripcion: string;
  categoria: "límites" | "tiempo" | "espiritual" | "redes" | "metas";
};

/** Plantillas que la pareja adapta; nunca se aplican solas. */
export const PLANTILLAS_ACUERDO: PlantillaAcuerdo[] = [
  {
    titulo: "Pureza y límites físicos",
    descripcion:
      "Definimos juntos hasta dónde llegamos y qué hacemos si uno de los dos cruza el límite. Nos cuidamos; no nos vigilamos.",
    categoria: "límites",
  },
  {
    titulo: "Devocional juntos",
    descripcion:
      "Nos encontramos a leer y orar un número fijo de veces por semana. Si uno falla, no hay reclamo ni cobro.",
    categoria: "espiritual",
  },
  {
    titulo: "Tiempo a solas de cada uno",
    descripcion:
      "Cada uno conserva su tiempo personal con Dios, sus amistades y su descanso, sin pedir permiso.",
    categoria: "tiempo",
  },
  {
    titulo: "Redes sociales",
    descripcion:
      "No publicamos discusiones ni usamos las redes para mandarnos mensajes indirectos. Las cuentas son de cada uno.",
    categoria: "redes",
  },
  {
    titulo: "Cómo discutimos",
    descripcion:
      "No gritamos, no nos vamos sin avisar y no sacamos cosas viejas. Si uno necesita parar, lo dice y retomamos.",
    categoria: "límites",
  },
  {
    titulo: "Rendición de cuentas",
    descripcion:
      "Elegimos a una pareja o un pastor a quien le damos permiso de preguntarnos cómo vamos de verdad.",
    categoria: "espiritual",
  },
  {
    titulo: "Metas del próximo año",
    descripcion:
      "Escribimos qué queremos que sea distinto en doce meses, en lo espiritual y en lo práctico.",
    categoria: "metas",
  },
];

export const TOTAL_SEMANAS_PLAN = TEMAS_PLAN.length;
