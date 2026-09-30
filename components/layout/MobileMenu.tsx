import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Logo } from "@/components/layout/Logo";
import { NAV_LINKS } from "@/components/layout/nav-links";

const MENU_LINKS = [{ href: "/", label: "Home" }, ...NAV_LINKS];

/** Slide-in nav panel for phones, over an ink-tinted overlay. */
export function MobileMenu({ isOpen, onClose, pathname }: { isOpen: boolean; onClose: () => void; pathname: string }) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-200 sm:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        inert={!isOpen}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-r border-border bg-card shadow-(--shadow-lift) transition-transform duration-300 ease-(--ease-out) sm:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {MENU_LINKS.map((link) => (
            <ProgressLink
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-current={pathname === link.href ? "page" : undefined}
              className="rounded-lg px-4 py-3 font-display text-lg font-bold tracking-tight text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.98] aria-[current=page]:bg-secondary aria-[current=page]:text-foreground"
            >
              {link.label}
            </ProgressLink>
          ))}
        </nav>

        <p className="mt-auto border-t border-border p-4 text-sm text-muted-foreground">Milega? Check first.</p>
      </div>
    </>
  );
}
