"use client";

import { Logo } from "@/components/layout/Logo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { useT } from "@/lib/i18n/client";

// The site index: every IPO list view, then the reading pages. Keys name labels in common.footer and common.nav.
const FOOTER_GROUPS = [
  {
    title: "ipos",
    links: [
      { href: "/ipos?filter=live", key: "live" },
      { href: "/ipos?filter=upcoming", key: "upcoming" },
      { href: "/ipos?filter=closed", key: "closed" },
      { href: "/ipos?filter=past", key: "listed" },
      { href: "/ipos/shareholder-quota", key: "quotaIpos" },
      { href: "/ipos", key: "all" },
    ],
  },
  {
    title: "read",
    links: [
      { href: "/blogs", key: "blogs" },
      { href: "/about", key: "about" },
    ],
  },
] as const;

/** Site footer on every page: logo, tagline, the site index, the disclaimer and the copyright line. */
export function Footer() {
  const d = useT().common;
  const label = { ...d.footer, ipos: d.nav.ipos, blogs: d.nav.blogs };
  return (
    <footer className="app-container mt-16">
      <div className="grid gap-8 border-t border-border py-12 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">{d.tagline}</p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={label[group.title]}>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{label[group.title]}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <ProgressLink
                    href={link.href}
                    className="underline-grow text-sm font-medium text-foreground/80 transition-colors hover:text-foreground active:text-foreground"
                  >
                    {label[link.key]}
                  </ProgressLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="space-y-3 border-t border-border py-6 text-xs text-muted-foreground">
        <Disclaimer className="text-pretty" />
        <p>
          © <span className="font-mono tabular-nums">{new Date().getFullYear()}</span> {d.footer.rights}
        </p>
      </div>
    </footer>
  );
}
