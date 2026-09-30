"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Ipo } from "@/types/ipo";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { IpoLogo } from "@/components/ipo/IpoLogo";
import { formatIssueSize, getIpoType } from "@/lib/ipo-format";

/** Loads the IPO a post is about from /api/ipo/:id. Null until it arrives or if the request fails. */
function useIpo(ipoId: string) {
  const [ipo, setIpo] = useState<Ipo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/ipo/${ipoId}`);
        if (response.ok) setIpo((await response.json()).ipos);
      } catch (error) {
        console.error("Error fetching IPO data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [ipoId]);

  return { ipo, isLoading };
}

function LoadingState() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-11" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
    </div>
  );
}

function UnavailableState() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Building2 className="size-4" strokeWidth={2} />
      We couldn&apos;t load this IPO&apos;s details. Refresh to try again.
    </p>
  );
}

function IpoSummary({ ipo }: { ipo: Ipo }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <IpoLogo src={ipo.image_url} name={ipo.upcoming_ipo_2025} size="lg" />
        <div>
          <h3 className="mb-1 text-lg font-bold tracking-[-0.015em]">{ipo.upcoming_ipo_2025}</h3>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase tracking-[0.04em]">{getIpoType(ipo)}</span>
            <span className="font-mono tabular-nums">{formatIssueSize(ipo.ipo_details?.issue_size) || "Size TBA"}</span>
          </p>
        </div>
      </div>
      <ArrowLink href={`/analysis/${ipo.slug}`} className="self-start sm:self-auto">View analysis</ArrowLink>
    </div>
  );
}

/** The IPO a post is about, with a link to its analysis. */
export function RelatedIpoCard({ ipoId }: { ipoId: string }) {
  const { ipo, isLoading } = useIpo(ipoId);

  return (
    <aside className="mb-12 rounded-xl border border-border bg-card p-5">
      {isLoading && <LoadingState />}
      {!isLoading && !ipo && <UnavailableState />}
      {ipo && <IpoSummary ipo={ipo} />}
    </aside>
  );
}
