import type { Metadata } from "next";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { ArrowLink } from "@/components/ui/ArrowLink";
import ListingDayGame from "@/components/not-found/ListingDayGame";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const SECONDARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
];

export default function NotFound() {
  return (
    <div className="app-container flex min-h-screen flex-col justify-center gap-6 pt-24 pb-10 sm:gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Error <span className="tabular-nums">404</span> · Application rejected
          </p>
          <h1 className="type-hero text-[44px] sm:text-[60px]">This page wasn&apos;t allotted</h1>
          <p className="max-w-2xl text-muted-foreground">
            It was oversubscribed, withdrawn, or never filed a DRHP. While you&apos;re here, try trading its listing day.
          </p>
        </div>
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-2">
          <ArrowLink href="/ipos">See IPOs</ArrowLink>
          {SECONDARY_LINKS.map((link) => (
            <ProgressLink
              key={link.href}
              href={link.href}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary active:scale-[0.98]"
            >
              {link.label}
            </ProgressLink>
          ))}
        </nav>
      </div>

      <ListingDayGame />
    </div>
  );
}
