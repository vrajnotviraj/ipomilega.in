import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setLocale } from "@/lib/i18n/server";
import { pageFromSegments } from "@/components/ui/pager";
import { BlogsIndex, blogsMetadata } from "@/components/blog/BlogsIndex";

export const revalidate = 600;

// Builds no pages ahead; each renders on its first visit and is then cached.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ lang: string; n: string }> };

/** Page 2 and on; page 1 lives at /blogs, so /blogs/page/1 is a 404. */
const pageOf = async (params: Params["params"]) => pageFromSegments([(await params).n]);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return blogsMetadata(setLocale((await params).lang), (await pageOf(params)) ?? 1);
}

export default async function BlogsPagedPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const page = await pageOf(params);
  if (!page) notFound();
  return <BlogsIndex lang={lang} page={page} />;
}
