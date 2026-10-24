import { Metadata } from "next";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { localePath, plural } from "@/lib/i18n/locales";
import { getPublishedBlogs } from "@/lib/queries/blogs";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import BlogsClient from "@/components/blog/BlogsClient";
import { formatBlogDate, toSummary } from "@/lib/blog/format";

export const revalidate = 600;

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const { title, description } = t().blog.index.meta;
  return {
    title,
    description,
    alternates: alternatesFor(lang, "/blogs"),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, "/blogs") },
  };
}

/** The /blogs page: an answer-first intro, then every published post with search and category filters. */
export default async function BlogsPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const { common, blog: d } = t();
  // Newest first by first publication, the date every card and the ItemList show; older posts without published_at fall back to created_at.
  const posts = (await getPublishedBlogs(lang)).map(toSummary).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const latest = posts[0]?.publishedAt;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <JsonLd data={collectionJsonLd({ lang, path: "/blogs", name: d.index.meta.title, description: d.index.meta.description, items: posts.map((post) => ({ name: post.title, href: `/blogs/${post.slug}` })), newestFirst: true })} />
      <Breadcrumbs crumbs={[{ name: common.nav.home, href: "/" }, { name: d.crumb, href: "/blogs" }]} />

      <header className="mt-6 mb-8 max-w-[65ch]">
        <h1 className="type-hero text-[44px] text-balance sm:text-[60px]">{d.index.heading}</h1>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{d.index.intro}</p>
        {latest && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{posts.length}</span> {plural(d.index.count, posts.length)}, {d.index.latestOn}{" "}
            <time dateTime={latest} className="font-mono tabular-nums">{formatBlogDate(latest)}</time>
          </p>
        )}
      </header>

      <BlogsClient posts={posts} />
    </div>
  );
}
