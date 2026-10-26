import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="inline-block cursor-pointer" aria-label="Intimate, inicio">
        <Logo />
      </Link>
      <article className="glass mt-8 p-7 sm:p-10 [&_h2]:mt-8 [&_h2]:text-2xl [&_li]:leading-relaxed [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </article>
      <p className="text-muted mt-6 text-xs">
        Borrador pendiente de revisión legal antes de publicar.
      </p>
    </div>
  );
}
