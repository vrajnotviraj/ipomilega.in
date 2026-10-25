import { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { t } from "@/lib/i18n/server";
import { fill, localePath, plural, type Locale } from "@/lib/i18n/locales";
import { getPublishedBlogs } from "@/lib/queries/blogs";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import BlogsClient from "@/components/blog/BlogsClient";
import { BLOG_PAGE_SIZE, blogPagePath, formatBlogDate, toSummary } from "@/lib/blog/format";

/** Title and canonical for one page of /blogs. Each page is its own canonical, as Google asks for paged lists. */
export function blogsMetadata(lang: Locale, page: number): Metadata {
  const { meta } = t().blog.index;
  const title = page > 1 ? fill(t().ipos.meta.pagedTitle, { title: meta.title, page }) : meta.title;
  const url = blogPagePath(page);
  return {
    title,
    description: meta.description,
    alternates: alternatesFor(lang, url),
    openGraph: { ...openGraphBase(lang), title, description: meta.description, url: localePath(lang, url) },
  };
}

/** The /blogs page: an answer-first intro, then one page of posts. Search and category filters still cover every post. */
export async function BlogsIndex({ lang, page }: { lang: Locale; page: number }) {
  const { common, blog: d } = t();
  // Newest first by first publication, the date every card and the ItemList show; older posts without published_at fall back to created_at.
  const posts = (await getPublishedBlogs(lang)).map(toSummary).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const pages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (page > pages) notFound();
  const onPage = posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
  const latest = posts[0]?.publishedAt;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <JsonLd data={collectionJsonLd({ lang, path: blogPagePath(page), name: d.index.meta.title, description: d.index.meta.description, items: onPage.map((post) => ({ name: post.title, href: `/blogs/${post.slug}` })), newestFirst: true })} />
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

      <BlogsClient posts={posts} page={page} pages={pages} />
    </div>
  );
}
