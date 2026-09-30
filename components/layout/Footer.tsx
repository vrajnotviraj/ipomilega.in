import { Logo } from "@/components/layout/Logo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { NAV_LINKS } from "@/components/layout/nav-links";

const FOOTER_LINKS = [...NAV_LINKS, { href: "/about", label: "About" }];

/** Site footer: logo, tagline, links and the not-investment-advice note. */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">Milega? Check first.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <ProgressLink
              key={link.href}
              href={link.href}
              className="underline-grow text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
            >
              {link.label}
            </ProgressLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          © <span className="font-mono tabular-nums">{new Date().getFullYear()}</span> IPO Milega. All rights reserved.
        </p>
        <p>For information only, not investment advice. Read the offer document before you bid.</p>
      </div>
    </footer>
  );
}
