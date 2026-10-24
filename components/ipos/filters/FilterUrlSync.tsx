"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ipoPagePath } from "@/components/ipos/model/query";
import { filtersFromQuery, queryFromFilters } from "@/components/ipos/model/url";
import type { Filters } from "@/components/ipos/model/types";
import { useLocale } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/locales";

/** Keeps the filters and the address bar the same: a link sets the filters, a filter change rewrites the link. Renders nothing. */
export function FilterUrlSync({ filters, page, onFilters }: { filters: Filters; page: number; onFilters: (filters: Filters) => void }) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const lastQuery = useRef("");
  const isFirstRun = useRef(true);

  useEffect(() => {
    const query = searchParams.toString();
    if (query === lastQuery.current) return;
    lastQuery.current = query;
    onFilters(filtersFromQuery(searchParams));
  }, [searchParams, onFilters]);

  const query = queryFromFilters(filters);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    lastQuery.current = query;
    window.history.replaceState(null, "", localePath(locale, query ? `/ipos?${query}` : ipoPagePath(page)));
  }, [query, page, locale]);

  return null;
}
