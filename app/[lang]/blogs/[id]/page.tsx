import { Metadata } from "next";
import { openGraphBase, titleFor } from "@/lib/seo/share";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/locales";
import { setLocale, t } from "@/lib/i18n/server";
import { getTranslatedLocales, indexingFor } from "@/lib/queries/translations";
import { notFound } from "next/navigation";
import BlogDisplay from "@/components/blog/BlogDisplay";
import { getBlogBySlug, getIpoArticles } from "@/lib/queries/blogs";
import { getIpoLink } from "@/lib/queries/ipos";
import { articleJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { modifiedAtOf, publishedAtOf } from "@/lib/seo/news-sitemap";

export const revalidate = 1800;

// Nothing is built ahead; each page renders on its first visit and is cached from then on.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang: langParam, id } = await params;
  const lang = setLocale(langParam);
  const blog = await getBlogBySlug(id, lang);
  if (!blog) {
    return { title: t().blog.post.notFoundTitle, description: t().blog.post.notFoundDescription };
  }

  return {
    title: titleFor(blog.title),
    description: blog.meta_description,
    authors: [{ name: blog.author }],
    ...(await indexingFor("blog", blog._id, lang, `/blogs/${id}`)),
    openGraph: {
      ...openGraphBase(lang),
      // Names the per-article card explicitly, since openGraphBase's site card would otherwise win.
      images: [{ url: `/blogs/${id}/opengraph-image`, width: 1200, height: 630, alt: blog.title }],
      url: localePath(lang, `/blogs/${id}`),
      title: blog.title,
      description: blog.meta_description,
      type: "article",
      publishedTime: publishedAtOf(blog),
      modifiedTime: modifiedAtOf(blog),
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
  const { lang: langParam, id } = await params;
  const lang = setLocale(langParam);
  const blog = await getBlogBySlug(id, lang);
  if (!blog) notFound();
  const [ipo, articles, locales] = await Promise.all([
    blog.ipo_id ? getIpoLink(blog.ipo_id) : null,
    blog.ipo_id ? getIpoArticles(blog.ipo_id, lang) : [],
    getTranslatedLocales("blog", blog._id),
  ]);
  const translated = lang !== DEFAULT_LOCALE && locales.includes(lang);
  return (
    <>
      <JsonLd data={articleJsonLd(blog, translated ? lang : DEFAULT_LOCALE)} />
      <BlogDisplay blog={blog} ipo={ipo} articles={articles.filter((article) => article.slug !== blog.slug)} translated={translated} />
    </>
  );
}
