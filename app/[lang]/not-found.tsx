import type { Metadata, ResolvingMetadata } from "next";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { ArrowLink } from "@/components/ui/ArrowLink";
import ListingDayGame from "@/components/not-found/ListingDayGame";
import { t } from "@/lib/i18n/server";

// The 404 gets no params, so it waits for the layout's metadata, which sets the request's language.
export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  await parent;
  return { title: t().errors.notFound.title, robots: { index: false } };
}

export default function NotFound() {
  const { common, errors } = t();
  const d = errors.notFound;
  const secondaryLinks = [
    { href: "/", label: common.nav.home },
    { href: "/blogs", label: common.nav.blogs },
  ];
  return (
    <div className="app-container flex min-h-screen flex-col justify-center gap-6 pt-24 pb-10 sm:gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
            {d.error} <span className="tabular-nums">404</span> · {d.rejected}
          </p>
          <h1 className="type-hero text-[44px] sm:text-[60px]">{d.heading}</h1>
          <p className="max-w-2xl text-muted-foreground">{d.body}</p>
        </div>
        <nav aria-label={d.pages} className="flex flex-wrap items-center gap-2">
          <ArrowLink href="/ipos">{d.seeIpos}</ArrowLink>
          {secondaryLinks.map((link) => (
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
