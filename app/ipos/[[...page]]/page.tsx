import { Metadata } from "next";
import { notFound } from "next/navigation";
import { openGraphBase } from "@/lib/seo/share";
import { getIpoBuckets } from "@/lib/queries/ipos";
import IposClient from "@/components/ipos/IposClient";
import { PAGE_SIZE, ipoPagePath, toRows } from "@/components/ipos/rows";
import { pageFromSegments } from "@/components/ui/pager";

// Pages are /ipos and /ipos/<n>, so every IPO is a crawlable link on some page.
export const revalidate = 60;

// Nothing is built ahead; each page renders on its first visit and is cached from then on.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ page?: string[] }> };

const description = "Browse every mainboard and SME IPO: price bands, issue sizes, key dates and analysis scores. Filter by status and type.";

const pageOf = async ({ params }: Params) => pageFromSegments((await params).page);

export async function generateMetadata(props: Params): Promise<Metadata> {
  const page = (await pageOf(props)) ?? 1;
  const title = `All IPOs: live, upcoming and listed${page > 1 ? `, page ${page}` : ""}`;
  const url = ipoPagePath(page);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...openGraphBase(), title, description, url },
  };
}

export default async function IposPage(props: Params) {
  const page = await pageOf(props);
  if (!page) notFound();
  // Rows carry "days from today" figures, so they are built here rather than in the client.
  const rows = toRows(await getIpoBuckets());
  if (page > Math.max(1, Math.ceil(rows.length / PAGE_SIZE))) notFound();
  return <IposClient key={page} rows={rows} initialPage={page} />;
}
