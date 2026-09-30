import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { notFound } from "next/navigation";
import BlogDisplay from "@/components/blog/BlogDisplay";
import { getBlogBySlug, getIpoArticles } from "@/lib/queries/blogs";
import { getIpoLink } from "@/lib/queries/ipos";
import { articleJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { publishedAtOf } from "@/lib/seo/news-sitemap";

export const revalidate = 600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlogBySlug(id);
  if (!blog) {
    return { title: "Post not found", description: "We couldn't find this blog post." };
  }

  return {
    title: blog.title,
    description: blog.meta_description,
    authors: [{ name: blog.author }],
    alternates: { canonical: `/blogs/${id}` },
    openGraph: {
      ...openGraphBase(),
      // Names the per-article card explicitly, since openGraphBase's site card would otherwise win.
      images: [{ url: `/blogs/${id}/opengraph-image`, width: 1200, height: 630, alt: blog.title }],
      url: `/blogs/${id}`,
      title: blog.title,
      description: blog.meta_description,
      type: "article",
      publishedTime: publishedAtOf(blog),
      modifiedTime: blog.updated_at,
      authors: [blog.author],
      tags: blog.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.meta_description,
    },
  };
}

export default async function BlogPage({ params }: Params) {
  const blog = await getBlogBySlug((await params).id);
  if (!blog) notFound();
  const [ipo, articles] = blog.ipo_id ? await Promise.all([getIpoLink(blog.ipo_id), getIpoArticles(blog.ipo_id)]) : [null, []];
  return (
    <>
      <JsonLd data={articleJsonLd(blog)} />
      <BlogDisplay blog={blog} ipo={ipo} articles={articles.filter((article) => article.slug !== blog.slug)} />
    </>
  );
}
