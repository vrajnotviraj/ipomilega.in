import { Metadata } from "next";
import { setLocale } from "@/lib/i18n/server";
import { BlogsIndex, blogsMetadata } from "@/components/blog/BlogsIndex";

export const revalidate = 600;

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return blogsMetadata(setLocale((await params).lang), 1);
}

export default async function BlogsPage({ params }: Params) {
  return <BlogsIndex lang={setLocale((await params).lang)} page={1} />;
}
