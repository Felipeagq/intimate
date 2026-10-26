"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, HandHeart, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/devocional", label: "Devocional", icon: BookOpen },
  { href: "/oracion", label: "Oración", icon: HandHeart },
  { href: "/promesas", label: "Promesas", icon: Sparkles },
  { href: "/pareja", label: "Pareja", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="glass-strong fixed inset-x-3 bottom-3 z-30 flex justify-around p-1.5 lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-colors duration-200",
              active
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="text-[0.65rem] leading-none font-medium">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-white/8",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
