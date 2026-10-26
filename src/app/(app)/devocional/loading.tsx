/** Esqueleto mientras carga cualquier pantalla de devocional. */
export default function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-4">
      <div className="bg-ink-700/10 h-4 w-24 rounded-full dark:bg-white/10" />
      <div className="bg-ink-700/10 h-9 w-2/3 rounded-2xl dark:bg-white/10" />
      <div className="glass h-14 max-w-xl" />
      <div className="glass h-56 max-w-xl" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
