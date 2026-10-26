/**
 * Fechas en la zona horaria del usuario.
 *
 * Todo el cálculo de rachas depende de esto: orar a las 23:50 tiene que
 * contar para ese día aunque el servidor ya esté en el siguiente. Por eso
 * nunca se usa `new Date()` del servidor para decidir qué día es "hoy".
 */

/** "2026-10-25" en la zona indicada. */
export function fechaLocal(zona: string, momento = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(momento);
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(a, m - 1, d));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

export function diferenciaEnDias(desde: string, hasta: string): number {
  const ms =
    Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioDeSemana(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(a, m - 1, d));
  const diaSemana = base.getUTCDay(); // 0 = domingo
  const retroceso = diaSemana === 0 ? 6 : diaSemana - 1;
  return sumarDias(fecha, -retroceso);
}

/**
 * Racha con un día de gracia por semana.
 *
 * Recorre los días hacia atrás desde hoy. Un hueco no rompe la racha si en
 * los siete días anteriores a ese hueco no se usó ya la gracia. Se calcula
 * siempre en el servidor a partir de los registros: nunca se confía en un
 * contador que mande el cliente.
 */
export function calcularRacha(
  fechas: string[],
  hoy: string,
): { actual: number; graciaUsada: boolean; diasDeGracia: string[] } {
  const dias = new Set(fechas);
  if (dias.size === 0) return { actual: 0, graciaUsada: false, diasDeGracia: [] };

  // Si hoy aún no hay registro, la racha puede seguir viva desde ayer.
  let cursor = dias.has(hoy) ? hoy : sumarDias(hoy, -1);
  if (!dias.has(cursor)) return { actual: 0, graciaUsada: false, diasDeGracia: [] };

  let total = 0;
  const diasDeGracia: string[] = [];

  while (true) {
    if (dias.has(cursor)) {
      total += 1;
      cursor = sumarDias(cursor, -1);
      continue;
    }

    // Hueco: se perdona si no hubo otra gracia en los 7 días anteriores.
    const graciaReciente = diasDeGracia.some(
      (g) => diferenciaEnDias(cursor, g) < 7,
    );
    if (graciaReciente) break;

    // Solo se perdona si la racha continúa el día anterior.
    const anterior = sumarDias(cursor, -1);
    if (!dias.has(anterior)) break;

    diasDeGracia.push(cursor);
    cursor = anterior;
  }

  return { actual: total, graciaUsada: diasDeGracia.length > 0, diasDeGracia };
}

export function rachaMasLarga(fechas: string[]): number {
  if (fechas.length === 0) return 0;
  const ordenadas = [...new Set(fechas)].sort();
  let mejor = 1;
  let actual = 1;

  for (let i = 1; i < ordenadas.length; i++) {
    if (diferenciaEnDias(ordenadas[i - 1], ordenadas[i]) === 1) {
      actual += 1;
      mejor = Math.max(mejor, actual);
    } else {
      actual = 1;
    }
  }
  return mejor;
}

/**
 * El próximo "mesiversario" de la pareja: el mismo día del mes en que se
 * vincularon, un mes más cerca de hoy. Si ese día no existe en el mes (el 31
 * en febrero) cae en el último día. Cuando el mes cumplido es múltiplo de 12
 * se nombra en años.
 *
 * `hoy` cuenta: si el hito es hoy, `dias` es 0.
 */
export function proximoHito(
  desde: string,
  hoy: string,
): { fecha: string; dias: number; meses: number; etiqueta: string } {
  const [a, m, d] = desde.split("-").map(Number);
  const [ha, hm] = hoy.split("-").map(Number);

  const fechaDe = (n: number) => {
    const total = m - 1 + n;
    const anio = a + Math.floor(total / 12);
    const mes = total % 12;
    const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const dia = Math.min(d, ultimo);
    return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };

  let n = Math.max(1, (ha - a) * 12 + (hm - m));
  while (fechaDe(n) < hoy) n += 1;

  const anios = n / 12;
  return {
    fecha: fechaDe(n),
    dias: diferenciaEnDias(hoy, fechaDe(n)),
    meses: n,
    etiqueta:
      n % 12 === 0
        ? `${anios} ${anios === 1 ? "año" : "años"} juntos`
        : `${n} ${n === 1 ? "mes" : "meses"} juntos`,
  };
}
