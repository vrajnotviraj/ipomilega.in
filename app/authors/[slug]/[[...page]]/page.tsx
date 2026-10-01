import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { openGraphBase } from "@/lib/seo/share";
import { AUTHOR_PAGE_SIZE, getAuthor, getAuthorPosts } from "@/lib/queries/authors";
import { authorJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard } from "@/components/blog/PostCard";

// Pages are /authors/<slug> and /authors/<slug>/<n>. A path segment keeps each page in the ISR cache, where ?page= would not.
export const revalidate = 600;

// Nothing is built ahead; each page renders on its first visit and is cached from then on.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string; page?: string[] }> };

const PAGER =
  "inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

const pathOf = (slug: string, page: number) => (page === 1 ? `/authors/${slug}` : `/authors/${slug}/${page}`);

/** The page number in the path: 1 when absent, null for "1", junk or extra segments. */
function pageOf(segments?: string[]): number | null {
  if (!segments) return 1;
  if (segments.length !== 1 || !/^[1-9]\d*$/.test(segments[0])) return null;
  const page = Number(segments[0]);
  return page > 1 ? page : null;
}

/** The writer, this page's posts and the page count, or null for an unknown writer or page. */
async function load({ params }: Params) {
  const { slug, page: segments } = await params;
  const page = pageOf(segments);
  if (!page) return null;
  const author = await getAuthor(slug);
  if (!author) return null;
  const { posts, total } = await getAuthorPosts(slug, page);
  const pages = Math.max(1, Math.ceil(total / AUTHOR_PAGE_SIZE));
  return page > pages ? null : { author, page, pages, posts, total };
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const data = await load(props);
  if (!data) return { title: "Author not found" };
  const { author, page, total } = data;
  const title = `${author.name}, IPO articles${page > 1 ? `, page ${page}` : ""}`;
  const description = author.bio || `IPO analysis, subscription, allotment and listing articles by ${author.name} on IPO Milega.`;
  const url = pathOf(author.slug, page);
  return {
    title,
    description,
    alternates: { canonical: url },
    // A writer with no live articles yet stays out of the index.
    ...(total === 0 && { robots: { index: false, follow: true } }),
    openGraph: { ...openGraphBase(), title, description, url, type: "profile" },
  };
}

/** A writer's profile: name, bio when set, and their live articles, newest first. */
export default async function AuthorPage(props: Params) {
  const data = await load(props);
  if (!data) notFound();
  const { author, page, pages, posts, total } = data;
  const first = (page - 1) * AUTHOR_PAGE_SIZE + 1;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <JsonLd data={authorJsonLd(author)} />
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blogs" }, { name: author.name, href: pathOf(author.slug, 1) }]} />

      <header className="mt-6 mb-8 max-w-[65ch]">
        <h1 className="type-hero text-[44px] text-balance sm:text-[60px]">{author.name}</h1>
        {author.bio && <p className="mt-4 text-lg text-pretty text-muted-foreground">{author.bio}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{total}</span> {total === 1 ? "article" : "articles"} on IPO Milega
        </p>
      </header>

      <h2 className="sr-only">Articles by {author.name}</h2>
      {posts.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="No articles yet" hint="Articles by this writer show up here once they go live." />
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-mono tabular-nums">{first}</span> to{" "}
            <span className="font-mono tabular-nums">{first + posts.length - 1}</span> of <span className="font-mono tabular-nums">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <ProgressLink href={pathOf(author.slug, page - 1)} rel="prev" className={PAGER}>
                <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> Previous
              </ProgressLink>
            )}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {page} / {pages}
            </span>
            {page < pages && (
              <ProgressLink href={pathOf(author.slug, page + 1)} rel="next" className={PAGER}>
                Next <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
              </ProgressLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
