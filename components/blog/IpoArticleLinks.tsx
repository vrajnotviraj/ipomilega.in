import { ArrowUpRight } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import type { Blog } from "@/types/ipo";

type Link = { href: string; label: string };

/** A titled list of links about one IPO: an optional leading link, then each article by its title. Renders nothing without links. */
export function IpoArticleLinks({ title, blogs, lead }: { title: string; blogs: Blog[]; lead?: Link }) {
  const links = [...(lead ? [lead] : []), ...blogs.map((blog) => ({ href: `/blogs/${blog.slug}`, label: blog.title }))];
  if (!links.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">{title}</h2>
      <ul className="divide-y divide-border">
        {links.map((link) => (
          <li key={link.href}>
            <ProgressLink href={link.href} className="group flex items-center justify-between gap-4 py-3 text-sm font-medium">
              <span className="group-hover:underline group-hover:underline-offset-4">{link.label}</span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            </ProgressLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
