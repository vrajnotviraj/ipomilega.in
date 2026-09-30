import type { Metadata } from "next";
import { ProgressLink } from "@/components/progress/ProgressLink";
import ListingDayGame from "@/components/ListingDayGame";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/ipos", label: "IPO list" },
  { href: "/analysis", label: "Analysis" },
  { href: "/blogs", label: "Blogs" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden paper-texture">
      <div className="relative z-10 app-container flex min-h-screen flex-col justify-center gap-6 pt-20 pb-10 sm:gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs sm:text-sm text-muted-foreground">Error 404 · Application rejected</p>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-foreground">This page wasn&apos;t allotted</h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              It was oversubscribed, withdrawn, or never filed a DRHP. While you&apos;re here, try trading its listing day.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
              <ProgressLink
                key={link.href}
                href={link.href}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </ProgressLink>
            ))}
          </nav>
        </div>

        <ListingDayGame />
      </div>
    </div>
  );
}
