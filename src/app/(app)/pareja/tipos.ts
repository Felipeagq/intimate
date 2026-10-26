export type Checkin = {
  semanaInicio: string;
  preguntas: string[];
  misRespuestas: string[] | null;
  respuestasPareja: string[] | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  revelado: boolean;
};

export type Plan = {
  semana: number;
  totalSemanas: number;
  temaActual: { slug: string; titulo: string; descripcion: string; preguntas: string[] };
  completados: string[];
  siguientes: string[];
};

export type Acuerdo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  proximaRevision: string | null;
  confirmadoPorMi: boolean;
  confirmadoPorAmbos: boolean;
};

export type Plantilla = { titulo: string; descripcion: string; categoria: string };

export type Afirmacion = {
  id: string;
  mensaje: string;
  favorita: boolean;
  mia: boolean;
  createdAt: string;
};

export type Correr = (
  fn: () => Promise<{ ok: boolean; error?: string }>,
) => void;

export type Seccion = "resumen" | "checkin" | "plan" | "acuerdos" | "palabras";
