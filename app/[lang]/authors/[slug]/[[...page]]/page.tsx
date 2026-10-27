import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { fill, localePath, plural } from "@/lib/i18n/locales";
import { AUTHOR_PAGE_SIZE, getAuthor, getAuthorPosts } from "@/lib/queries/authors";
import { authorJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard } from "@/components/blog/PostCard";
import { PAGER, pageFromSegments } from "@/components/ui/pager";

// Pages are /authors/<slug> and /authors/<slug>/<n>. A path segment keeps each page in the ISR cache, where ?page= would not.
export const revalidate = 1800;

// Nothing is built ahead; each page renders on its first visit and is cached from then on.
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ lang: string; slug: string; page?: string[] }> };

const pathOf = (slug: string, page: number) => (page === 1 ? `/authors/${slug}` : `/authors/${slug}/${page}`);

/** The writer, this page's posts and the page count, or null for an unknown writer or page. */
async function load({ params }: Params) {
  const { lang: langParam, slug, page: segments } = await params;
  const lang = setLocale(langParam);
  const page = pageFromSegments(segments);
  if (!page) return null;
  const author = await getAuthor(slug);
  if (!author) return null;
  const { posts, total } = await getAuthorPosts(slug, page, lang);
  const pages = Math.max(1, Math.ceil(total / AUTHOR_PAGE_SIZE));
  return page > pages ? null : { lang, author, page, pages, posts, total };
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const data = await load(props);
  const d = t().blog.author;
  if (!data) return { title: d.notFound };
  const { lang, author, page, total } = data;
  const title = fill(d.metaTitle, { name: author.name }) + (page > 1 ? fill(d.metaPage, { page }) : "");
  const description = author.bio || fill(d.metaDescription, { name: author.name });
  const url = pathOf(author.slug, page);
  return {
    title,
    description,
    alternates: alternatesFor(lang, url),
    // A writer with no live articles yet stays out of the index.
    ...(total === 0 && { robots: { index: false, follow: true } }),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, url), type: "profile" },
  };
}

/** A writer's profile: name, bio when set, and their live articles, newest first. */
export default async function AuthorPage(props: Params) {
  const data = await load(props);
  if (!data) notFound();
  const { common, blog } = t();
  const d = blog.author;
  const { lang, author, page, pages, posts, total } = data;
  const first = (page - 1) * AUTHOR_PAGE_SIZE + 1;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <JsonLd data={authorJsonLd(author, lang)} />
      <Breadcrumbs crumbs={[{ name: common.nav.home, href: "/" }, { name: blog.crumb, href: "/blogs" }, { name: author.name, href: pathOf(author.slug, 1) }]} />

      <header className="mt-6 mb-8 max-w-[65ch]">
        <h1 className="type-hero text-[44px] text-balance sm:text-[60px]">{author.name}</h1>
        {author.bio && <p className="mt-4 text-lg text-pretty text-muted-foreground">{author.bio}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{total}</span> {plural(d.count, total)}
        </p>
      </header>

      <h2 className="sr-only">{fill(d.articlesBy, { name: author.name })}</h2>
      {posts.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title={d.emptyTitle} hint={d.emptyHint} />
      )}

      {pages > 1 && (
        <nav aria-label={d.pagination} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {d.showing} <span className="font-mono tabular-nums">{first}</span> {d.to}{" "}
            <span className="font-mono tabular-nums">{first + posts.length - 1}</span> {d.of} <span className="font-mono tabular-nums">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <ProgressLink href={pathOf(author.slug, page - 1)} rel="prev" className={PAGER}>
                <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> {d.previous}
              </ProgressLink>
            )}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {page} / {pages}
            </span>
            {page < pages && (
              <ProgressLink href={pathOf(author.slug, page + 1)} rel="next" className={PAGER}>
                {d.next} <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
              </ProgressLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
