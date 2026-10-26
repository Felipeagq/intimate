import Link from "next/link";
import {
  BookOpen,
  HandHeart,
  ScrollText,
  Sparkles,
  Lock,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pilares = [
  {
    icon: BookOpen,
    title: "Juntos",
    body: "Un devocional para los dos. Cada uno escribe lo que Dios le dijo, y las respuestas se revelan cuando ambos terminan.",
  },
  {
    icon: HandHeart,
    title: "El uno por el otro",
    body: "Peticiones compartidas, palabras de afirmación y un aviso tan simple como “estoy orando por ti”.",
  },
  {
    icon: ScrollText,
    title: "Acuerdos y memoria",
    body: "Límites, tiempo juntos y metas, escritos y confirmados por los dos. Lo que hablaron deja de quedar en el aire.",
  },
  {
    icon: Sparkles,
    title: "Tiempo personal",
    body: "Tu devocional, tus promesas y tu oración siguen siendo tuyos. Compartes solo lo que decides compartir.",
  },
];

const pasos = [
  {
    n: "01",
    title: "Crea tu cuenta",
    body: "En menos de un minuto. La app funciona completa desde el primer día, aunque tu pareja todavía no llegue.",
  },
  {
    n: "02",
    title: "Invita a tu pareja",
    body: "Le mandas un código de seis caracteres. Cuando lo acepta, se abre el espacio compartido de los dos.",
  },
  {
    n: "03",
    title: "Construyan el hábito",
    body: "Un devocional, una oración, un acuerdo. La racha de pareja cuenta los días en que los dos estuvieron.",
  },
];

const principios = [
  {
    icon: Lock,
    title: "Privado por defecto, incluso entre ustedes",
    body: "Cada uno decide qué comparte. No hay forma de ver lo privado del otro, y nadie del equipo puede leer lo que escriben.",
  },
  {
    icon: HeartHandshake,
    title: "Gracia, no culpa",
    body: "Nunca comparamos quién oró más. Hay un día de gracia por semana y la racha se ve, pero no es la protagonista.",
  },
  {
    icon: ShieldCheck,
    title: "Salir es inmediato y discreto",
    body: "Un noviazgo puede terminar, y está bien. Cada quien conserva lo suyo y el espacio compartido se archiva.",
  },
];

const faqs = [
  {
    q: "¿Necesitamos los dos una cuenta?",
    a: "Sí, cada uno tiene la suya. Se vinculan con una invitación que caduca a las 48 horas. Mientras tu pareja acepta, tú ya puedes usar todo lo personal.",
  },
  {
    q: "¿Pueden ver lo que escribo?",
    a: "Solo lo que decidas compartir. Tu devocional personal, tus promesas y tus peticiones privadas no son visibles para nadie más, ni para tu pareja ni para nosotros.",
  },
  {
    q: "¿De qué iglesia es?",
    a: "Intimate es interdenominacional. El contenido se apoya en lo que compartimos: la Escritura, la oración y el propósito de un noviazgo sano. No reemplaza a tu iglesia ni a la consejería pastoral.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Hoy es gratis mientras construimos el producto con las primeras parejas. Si más adelante hay un plan de pago, una sola suscripción cubrirá a los dos.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Navegación flotante: separada del borde, no pegada a top-0. */}
      <header className="fixed inset-x-4 top-4 z-30 mx-auto max-w-6xl">
        <nav className="glass flex items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="cursor-pointer" aria-label="Intimate, inicio">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/entrar"
              className="hover:text-accent hidden cursor-pointer px-3 py-2 text-sm font-medium transition-colors duration-200 sm:block"
            >
              Entrar
            </Link>
            <Link href="/entrar" className={buttonStyles({ size: "sm" })}>
              Empezar gratis
            </Link>
          </div>
        </nav>
      </header>

      <main id="contenido">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-6xl px-4 pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-rise">
              <p className="text-accent mb-5 inline-flex items-center gap-2 text-sm font-medium">
                <LogoMark className="size-4" />
                Para novios cristianos
              </p>
              <h1 className="text-[2.6rem] leading-[1.08] sm:text-6xl">
                Un noviazgo con Dios en el centro, desde el primer día.
              </h1>
              <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
                Muchos novios quieren una relación con propósito, pero cada uno
                ora por su lado y los temas grandes se van postergando. Intimate
                es el ritual compartido de los dos: devocional en pareja,
                oración del uno por el otro y acuerdos que ambos confirman.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/entrar" className={buttonStyles({ size: "lg" })}>
                  Empezar gratis
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="#como-funciona"
                  className={buttonStyles({ size: "lg", variant: "secondary" })}
                >
                  Ver cómo funciona
                </Link>
              </div>
              <p className="text-muted mt-5 text-sm">
                Gratis mientras estamos en fase inicial · Solo mayores de 18
                años
              </p>
            </div>

            {/* Vista previa del producto, no un mockup genérico de teléfono. */}
            <div className="animate-rise [animation-delay:120ms]">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted text-xs tracking-wide uppercase">
                      Devocional de hoy
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
                      Eclesiastés 4:9-12
                    </p>
                  </div>
                  <span className="bg-honey-300 text-ink-700 rounded-full px-3 py-1.5 text-xs font-semibold">
                    Día 24
                  </span>
                </div>

                <div className="border-ink-700/10 mt-5 space-y-3 border-t pt-5 dark:border-white/10">
                  {[
                    { name: "Sofía", done: true },
                    { name: "Mateo", done: false },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span
                        className={
                          p.done
                            ? "bg-honey-300 text-ink-700 flex size-9 items-center justify-center rounded-full"
                            : "border-ink-700/20 text-muted flex size-9 items-center justify-center rounded-full border border-dashed dark:border-white/20"
                        }
                        aria-hidden
                      >
                        {p.done ? (
                          <Check className="size-4" />
                        ) : (
                          <span className="text-xs">···</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-muted text-xs">
                          {p.done ? "Ya escribió" : "Aún no responde"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-muted border-ink-700/10 mt-5 border-t pt-4 text-sm leading-relaxed dark:border-white/10">
                  Las respuestas se revelan cuando los dos escriben, para que
                  ninguno influya en el otro.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------- Pilares ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="max-w-2xl text-3xl sm:text-4xl">
            Cuatro cosas que sostienen una relación
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {pilares.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6">
                <span className="bg-honey-300 text-ink-700 mb-4 flex size-11 items-center justify-center rounded-2xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-xl">{title}</h3>
                <p className="text-muted mt-2 leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section
          id="como-funciona"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:py-24"
        >
          <h2 className="max-w-2xl text-3xl sm:text-4xl">Cómo funciona</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {pasos.map(({ n, title, body }) => (
              <li key={n}>
                <Card className="h-full p-6">
                  <span className="text-accent font-[family-name:var(--font-display)] text-3xl">
                    {n}
                  </span>
                  <h3 className="mt-3 text-xl">{title}</h3>
                  <p className="text-muted mt-2 leading-relaxed">{body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Principios ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Card className="overflow-hidden p-0">
            <div className="bg-ink-700 text-cream-100 p-8 sm:p-12">
              <h2 className="max-w-2xl text-3xl sm:text-4xl">
                Lo que escriben aquí es de lo más íntimo que una persona
                escribe.
              </h2>
              <p className="text-ink-200 mt-4 max-w-2xl leading-relaxed">
                Por eso lo tratamos como dato sensible desde el primer día, y
                no como una función más.
              </p>
              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {principios.map(({ icon: Icon, title, body }) => (
                  <div key={title}>
                    <Icon className="text-honey-300 size-6" aria-hidden />
                    <h3 className="text-cream-100 mt-3 text-lg">{title}</h3>
                    <p className="text-ink-200 mt-2 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl">Preguntas</h2>
          <div className="mt-8 space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="glass group p-5 [&_summary]:list-none">
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-medium">
                  {q}
                  <span
                    className="text-accent mt-0.5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="text-muted mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Card className="p-10 text-center sm:p-16">
            <LogoMark className="text-accent mx-auto size-12" />
            <h2 className="mx-auto mt-6 max-w-xl text-3xl sm:text-4xl">
              Empiecen hoy el hábito que quieren tener en diez años.
            </h2>
            <div className="mt-8 flex justify-center">
              <Link href="/entrar" className={buttonStyles({ size: "lg" })}>
                Crear mi cuenta
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-12">
        <div className="border-ink-700/10 flex flex-col gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <Logo />
          <nav className="text-muted flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/privacidad" className="hover:text-accent cursor-pointer">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-accent cursor-pointer">
              Términos
            </Link>
            <Link
              href="/eliminar-cuenta"
              className="hover:text-accent cursor-pointer"
            >
              Eliminar cuenta
            </Link>
          </nav>
        </div>
        <p className="text-muted mt-6 text-xs">
          Intimate acompaña, no reemplaza la Biblia, la iglesia ni la consejería
          pastoral.
        </p>
      </footer>
    </div>
  );
}
