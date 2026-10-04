import { Logo } from "@/components/layout/Logo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Disclaimer } from "@/components/ui/Disclaimer";

// The site index: every IPO list view, then the reading pages.
const FOOTER_GROUPS = [
  {
    title: "IPOs",
    links: [
      { href: "/ipos?filter=live", label: "Live IPOs" },
      { href: "/ipos?filter=upcoming", label: "Upcoming IPOs" },
      { href: "/ipos?filter=closed", label: "Closed IPOs" },
      { href: "/ipos?filter=past", label: "Listed IPOs" },
      { href: "/ipos/shareholder-quota", label: "Shareholder quota IPOs" },
      { href: "/ipos", label: "All IPOs" },
    ],
  },
  {
    title: "Read",
    links: [
      { href: "/blogs", label: "Blogs" },
      { href: "/about", label: "About" },
    ],
  },
];

/** Site footer on every page: logo, tagline, the site index, the disclaimer and the copyright line. */
export function Footer() {
  return (
    <footer className="app-container mt-16">
      <div className="grid gap-8 border-t border-border py-12 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">Milega? Check first.</p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <ProgressLink
                    href={link.href}
                    className="underline-grow text-sm font-medium text-foreground/80 transition-colors hover:text-foreground active:text-foreground"
                  >
                    {link.label}
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
          © <span className="font-mono tabular-nums">{new Date().getFullYear()}</span> IPO Milega. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
