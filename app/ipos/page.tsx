import { Metadata } from "next";
import { openGraphBase } from "@/lib/share";
import { getIpoBuckets } from "@/lib/queries/ipos";
import IposClient from "./IposClient";

// ISR: rendered once and served as static HTML, refreshed in the background at most once a minute.
export const revalidate = 60;

const title = "All IPOs - Live, Upcoming & Listed";
const description = "Browse every mainboard and SME IPO: price bands, issue sizes, key dates and analysis scores. Filter by status and type.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ipos" },
  openGraph: { ...openGraphBase(), title, description, url: "/ipos" },
};

/**
 * Server component.
 *
 * This page used to be `"use client"` end to end: the browser downloaded the bundle, mounted,
 * then fetched /api/ipo/upcoming -- a request that returned every bucket *plus* a flat `all`
 * list duplicating all of them *plus* the entire blogs collection. Until that resolved the
 * user saw a spinner, and search engines saw an empty table.
 *
 * The rows are now resolved on the server and embedded in the HTML. Only the filter/sort/
 * paginate interactions stay on the client.
 */
export default async function IposPage() {
  const buckets = await getIpoBuckets();

  return (
    <IposClient
      upcoming={buckets.upcoming}
      live={buckets.live}
      past={buckets.past}
    />
  );
}
