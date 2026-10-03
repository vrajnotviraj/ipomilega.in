import { ArrowUpRight } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { cn } from "@/lib/utils";

/** Primary call to action: ink pill with the arrow in a marigold circle. */
export function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <ProgressLink
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full bg-primary py-1.5 pl-5 pr-1.5 text-sm font-medium text-primary-foreground press",
        className
      )}
    >
      {children}
      <span className="grid size-8 place-items-center rounded-full bg-brand-accent text-primary transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:rotate-45">
        <ArrowUpRight className="size-4" strokeWidth={2} />
      </span>
    </ProgressLink>
  );
}
