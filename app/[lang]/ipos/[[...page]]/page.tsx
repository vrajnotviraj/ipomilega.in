import { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { fill, localePath } from "@/lib/i18n/locales";
import { getIpoBuckets } from "@/lib/queries/ipos";
import { getShareholderQuotaIpos } from "@/lib/queries/shareholder-quota";
import IposClient from "@/components/ipos/IposClient";
import { PAGE_SIZE, ipoPagePath, toRows } from "@/components/ipos/model/query";
import { pageFromSegments } from "@/components/ui/pager";

export const revalidate = 60;

// Builds no pages ahead; each renders on its first visit and is then cached.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ lang: string; page?: string[] }> };

const pageOf = async ({ params }: Params) => pageFromSegments((await params).page);

export async function generateMetadata(props: Params): Promise<Metadata> {
  const lang = setLocale((await props.params).lang);
  const page = (await pageOf(props)) ?? 1;
  const meta = t().ipos.meta;
  const title = page > 1 ? fill(meta.pagedTitle, { title: meta.title, page }) : meta.title;
  const url = ipoPagePath(page);
  return {
    title,
    description: meta.description,
    alternates: alternatesFor(lang, url),
    openGraph: { ...openGraphBase(lang), title, description: meta.description, url: localePath(lang, url) },
  };
}

export default async function IposPage(props: Params) {
  setLocale((await props.params).lang);
  const page = await pageOf(props);
  if (!page) notFound();
  // Rows hold "days from today", so they are built on the server.
  const [buckets, quota] = await Promise.all([getIpoBuckets(), getShareholderQuotaIpos()]);
  const rows = toRows(buckets);
  if (page > Math.max(1, Math.ceil(rows.length / PAGE_SIZE))) notFound();
  return <IposClient key={page} rows={rows} initialPage={page} quotaCount={quota.ipos.length} />;
}
