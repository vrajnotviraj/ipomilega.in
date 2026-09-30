import { Fragment } from "react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { breadcrumbJsonLd, JsonLd, type Crumb } from "@/lib/seo/json-ld";

/** The visible breadcrumb trail plus its BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const last = crumbs.length - 1;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            <li className={index === last ? "min-w-0 truncate font-medium text-foreground" : undefined}>
              {index === last ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <ProgressLink href={crumb.href} className="underline-grow transition-colors hover:text-foreground">
                  {crumb.name}
                </ProgressLink>
              )}
            </li>
            {index < last && <li aria-hidden>/</li>}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
