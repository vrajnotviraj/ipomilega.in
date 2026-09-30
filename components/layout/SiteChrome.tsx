"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NAV_LINKS } from "@/components/layout/nav-links";

// Toasts on the card surface in the design tokens, with the icon in the data colour.
const TOAST_COLORS = { "--normal-bg": "var(--card)", "--normal-border": "var(--border)", "--normal-text": "var(--foreground)" } as React.CSSProperties;
const TOAST_CLASSES = {
  toast: "shadow-(--shadow-lift)!",
  success: "[&_[data-icon]]:text-score-good",
  error: "[&_[data-icon]]:text-score-bad",
};

/** Fixed header with the logo and desktop nav. */
function Header({ pathname, onOpenMenu }: { pathname: string; onOpenMenu: () => void }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background">
      <div className="app-container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="-ml-2 grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary active:scale-[0.98] sm:hidden"
          >
            <Menu className="size-5" strokeWidth={2} />
          </button>
          <ProgressLink href="/" aria-label="IPO Milega home" className="rounded-full">
            <Logo size="sm" />
          </ProgressLink>
        </div>

        <nav className="hidden items-center gap-7 sm:flex">
          {NAV_LINKS.map((link) => (
            <ProgressLink
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="underline-grow whitespace-nowrap py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground aria-[current=page]:text-foreground"
            >
              {link.label}
            </ProgressLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** Page shell: skip link, header, mobile menu, main content and toasts. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ProgressProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header pathname={pathname} onOpenMenu={() => setIsMenuOpen(true)} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} pathname={pathname} />
      <main id="main">
        {children}
        <Toaster position="top-right" style={TOAST_COLORS} toastOptions={{ classNames: TOAST_CLASSES }} />
      </main>
    </ProgressProvider>
  );
}
