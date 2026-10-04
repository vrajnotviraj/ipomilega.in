import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { getPublishedBlogs } from "@/lib/queries/blogs";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import BlogsClient from "@/components/blog/BlogsClient";
import { formatBlogDate, toSummary } from "@/lib/blog-format";

export const revalidate = 600;

const title = "IPO analysis, GMP, subscription and allotment news";
const description =
  "Articles on Indian IPOs, mainboard and SME: a prospectus-based analysis before you bid, then subscription, allotment and listing updates.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blogs" },
  openGraph: { ...openGraphBase(), title, description, url: "/blogs" },
};

/** The /blogs page: an answer-first intro, then every published post with search and category filters. */
export default async function BlogsPage() {
  // Newest first by first publication, the date every card and the ItemList show; older posts without published_at fall back to created_at.
  const posts = (await getPublishedBlogs()).map(toSummary).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const latest = posts[0]?.publishedAt;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <JsonLd data={collectionJsonLd({ path: "/blogs", name: title, description, items: posts.map((post) => ({ name: post.title, href: `/blogs/${post.slug}` })), newestFirst: true })} />
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blogs" }]} />

      <header className="mt-6 mb-8 max-w-[65ch]">
        <h1 className="type-hero text-[44px] text-balance sm:text-[60px]">IPO analysis and news</h1>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          Plain-English articles on Indian IPOs, mainboard and SME. Each IPO can get up to five articles: an analysis of the business, financials,
          valuation and GMP before you bid, a GMP page updated daily in the last 3 days of bidding, then its subscription, allotment and listing updates.
        </p>
        {latest && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{posts.length}</span> {posts.length === 1 ? "article" : "articles"}, latest on{" "}
            <time dateTime={latest} className="font-mono tabular-nums">{formatBlogDate(latest)}</time>
          </p>
        )}
      </header>

      <BlogsClient posts={posts} />
    </div>
  );
}
