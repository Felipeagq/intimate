import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type {
  BucketRacha,
  FilaCohorte,
  FilaModulo,
  PasoEmbudo,
} from "@/server/modules/admin";

/**
 * Visualizaciones del dashboard. Son componentes de servidor: no hay estado
 * ni interacción, solo datos ya calculados que se dibujan.
 *
 * Cada gráfico lleva sus cifras escritas en el propio marcado, no solo en la
 * barra: así se leen con lector de pantalla y no dependen de distinguir
 * colores.
 */

// ------------------------------------------------------------------ Embudo

export function Embudo({ pasos }: { pasos: PasoEmbudo[] }) {
  const base = Math.max(pasos[0]?.valor ?? 0, 1);

  return (
    <Card flat className="p-6">
      <h2 className="text-xl">Embudo de activación</h2>
      <p className="text-muted mt-1 text-sm leading-relaxed">
        Dónde se pierde la gente entre registrarse y volver a diario. Cada
        paso cuenta personas o parejas distintas, no acciones sueltas.
      </p>

      <ol className="mt-5 space-y-3">
        {pasos.map((p, i) => {
          const anterior = i === 0 ? null : pasos[i - 1].valor;
          const ancho = Math.max((p.valor / base) * 100, p.valor > 0 ? 3 : 0);
          const delTotal = Math.round((p.valor / base) * 100);
          const delPaso =
            anterior && anterior > 0 ? Math.round((p.valor / anterior) * 100) : null;

          return (
            <li key={p.paso}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
                <span className="font-medium">{p.paso}</span>
                <span className="text-muted tabular-nums">
                  <strong className="text-foreground">{p.valor}</strong>
                  {i > 0 && delPaso !== null && (
                    <> · {delPaso}% del paso anterior</>
                  )}
                  {i > 0 && <> · {delTotal}% del total</>}
                </span>
              </div>
              <div
                className="bg-ink-700/8 mt-1.5 h-3 overflow-hidden rounded-full dark:bg-white/10"
                aria-hidden
              >
                <div
                  className="bg-honey-500 h-full rounded-full"
                  style={{ width: `${ancho}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ------------------------------------------------- Distribución de rachas

export function DistribucionRachas({ buckets }: { buckets: BucketRacha[] }) {
  const total = buckets.reduce((s, b) => s + b.parejas, 0);
  const max = Math.max(...buckets.map((b) => b.parejas), 1);

  return (
    <Card flat className="p-6">
      <h2 className="text-xl">Distribución de rachas</h2>
      <p className="text-muted mt-1 text-sm leading-relaxed">
        Cuántas parejas hay en cada tramo de racha. Si casi todas se quedan
        entre 0 y 3 días, el hábito no está arraigando, aunque el promedio
        parezca bien.
      </p>

      {total === 0 ? (
        <p className="text-muted mt-5 text-sm">Todavía no hay parejas vinculadas.</p>
      ) : (
        <div
          className="mt-6 flex h-44 items-end gap-3"
          role="img"
          aria-label={`Parejas por tramo de racha: ${buckets
            .map((b) => `${b.bucket} días, ${b.parejas}`)
            .join("; ")}.`}
        >
          {buckets.map((b) => (
            <div key={b.bucket} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted text-xs tabular-nums">{b.parejas}</span>
              <div
                className={cn(
                  "w-full rounded-t-lg",
                  b.parejas === 0 ? "bg-ink-700/8 dark:bg-white/10" : "bg-honey-300",
                )}
                style={{
                  height: `${Math.max((b.parejas / max) * 100, b.parejas === 0 ? 3 : 6)}%`,
                }}
              />
              <span className="text-muted text-xs">{b.bucket}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ----------------------------------------------------- Retención por cohorte

export function RetencionCohortes({ filas }: { filas: FilaCohorte[] }) {
  const hayDatos = filas.some((f) => f.tamano > 0);

  return (
    <Card flat className="p-6">
      <h2 className="text-xl">Retención por cohorte</h2>
      <p className="text-muted mt-1 text-sm leading-relaxed">
        Parejas agrupadas por la semana en que se vincularon. Cada celda es el
        porcentaje de ese grupo en que <em>los dos</em> oraron durante esa
        semana. La semana 4 es la retención D30 del documento de producto.
      </p>

      {!hayDatos ? (
        <p className="text-muted mt-5 text-sm leading-relaxed">
          Todavía ninguna pareja cumple las ocho semanas de ventana. Esta tabla
          se llena sola conforme pasa el tiempo.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <caption className="sr-only">
              Retención semanal por cohorte de vinculación
            </caption>
            <thead>
              <tr className="text-muted text-left">
                <th scope="col" className="py-2 pr-4 font-medium">Vinculadas</th>
                <th scope="col" className="py-2 pr-4 font-medium">Parejas</th>
                {[1, 2, 3, 4].map((s) => (
                  <th key={s} scope="col" className="py-2 pr-4 font-medium">
                    Semana {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr
                  key={f.semanaInicio}
                  className="border-ink-700/8 border-t dark:border-white/8"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">
                    Semana del {formatDate(f.semanaInicio)}
                  </td>
                  <td className="text-muted py-3 pr-4 tabular-nums">{f.tamano}</td>
                  {f.semanas.map((v, i) => (
                    <td key={i} className="py-3 pr-4 align-top">
                      {v === null ? (
                        <span className="text-muted" title="Todavía no hay dato">
                          —
                        </span>
                      ) : (
                        <div className="w-16">
                          <span className="font-medium tabular-nums">{v}%</span>
                          <div
                            className="bg-ink-700/8 mt-1 h-1.5 overflow-hidden rounded-full dark:bg-white/10"
                            aria-hidden
                          >
                            <div
                              className="bg-honey-500 h-full rounded-full"
                              style={{ width: `${v}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------ Desglose por módulo

export function DesgloseModulos({ filas }: { filas: FilaModulo[] }) {
  const max = Math.max(...filas.map((f) => f.estaSemana), 1);
  const sinActividad = filas.every((f) => f.estaSemana === 0 && f.semanaPrevia === 0);

  return (
    <Card flat className="p-6">
      <h2 className="text-xl">Uso por módulo</h2>
      <p className="text-muted mt-1 text-sm leading-relaxed">
        Qué partes del producto se usan de verdad, esta semana contra la
        anterior.
      </p>

      {sinActividad ? (
        <p className="text-muted mt-5 text-sm">Todavía no hay actividad que mostrar.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {filas.map((f) => {
            const diferencia = f.estaSemana - f.semanaPrevia;
            return (
              <li key={f.modulo}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                  <span className="font-medium">{f.modulo}</span>
                  <span className="text-muted tabular-nums">
                    <strong className="text-foreground">{f.estaSemana}</strong>
                    {" · "}
                    {f.semanaPrevia === 0 && f.estaSemana === 0 ? (
                      "sin actividad"
                    ) : diferencia === 0 ? (
                      "igual que la semana pasada"
                    ) : (
                      <span
                        className={
                          diferencia > 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-800 dark:text-amber-300"
                        }
                      >
                        {diferencia > 0 ? "+" : ""}
                        {diferencia} vs. semana pasada
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className="bg-ink-700/8 mt-1.5 h-2 overflow-hidden rounded-full dark:bg-white/10"
                  aria-hidden
                >
                  <div
                    className="bg-honey-300 h-full rounded-full"
                    style={{ width: `${(f.estaSemana / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
