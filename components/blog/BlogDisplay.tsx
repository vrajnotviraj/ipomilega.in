import Image from "next/image";
import { Blog } from "@/types/ipo";
import type { IpoLink } from "@/lib/queries/ipos";
import { publishedAtOf } from "@/lib/seo/news-sitemap";
import { RESEARCH_AUTHOR } from "@/lib/seo/json-ld";
import { SITE_URL } from "@/lib/seo/share";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { IpoArticleLinks } from "@/components/blog/IpoArticleLinks";
import { ArrowLink } from "@/components/ui/ArrowLink";
import MarkdownRenderer from "@/components/blog/MarkDown";
import { RelatedIpoCard } from "@/components/blog/RelatedIpoCard";
import { ShareLinks } from "@/components/blog/ShareLinks";
import { ShareButton } from "@/components/ui/ShareButton";
import { formatBlogDate, readTimeOf } from "@/components/blog/blog-format";
import { headingsOf } from "@/components/blog/headings";

type Heading = { id: string; text: string };

const LABEL = "mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground";

/** Author, publish and update dates and read time. The research desk links to /about, which explains the method. */
function Byline({ blog }: { blog: Blog }) {
  const published = publishedAtOf(blog);
  const updated = blog.updated_at && formatBlogDate(blog.updated_at) !== formatBlogDate(published) ? blog.updated_at : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          By{" "}
          {blog.author === RESEARCH_AUTHOR ? (
            <ProgressLink href="/about" className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
              {blog.author}
            </ProgressLink>
          ) : (
            blog.author
          )}
        </p>
        <p className="mt-1">
          <time dateTime={published} className="font-mono tabular-nums">{formatBlogDate(published)}</time>
          {updated && (
            <>
              , updated <time dateTime={updated} className="font-mono tabular-nums">{formatBlogDate(updated)}</time>
            </>
          )}
          {" · "}
          <span className="font-mono tabular-nums">{readTimeOf(blog)}</span> min read
        </p>
      </div>
      {/* The phone share sheet; from lg the sidebar carries the share links. */}
      <div className="lg:hidden">
        <ShareButton title={blog.title} text={blog.excerpt} url />
      </div>
    </div>
  );
}

function HeadingLinks({ headings }: { headings: Heading[] }) {
  return (
    <ol className="space-y-2 text-sm">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`} className="text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-4">
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** The article column on phones: IPO card and a collapsed "On this page". From lg these move to the sidebar. */
function InlineAside({ ipo, headings }: { ipo: IpoLink | null; headings: Heading[] }) {
  if (!ipo && !headings.length) return null;
  return (
    <div className="mt-8 space-y-4 lg:hidden">
      {ipo && <RelatedIpoCard ipo={ipo} />}
      {headings.length > 0 && (
        <nav aria-label="On this page">
          <details className="rounded-xl bg-secondary px-5 py-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              On this page <span className="font-mono tabular-nums text-muted-foreground">({headings.length})</span>
            </summary>
            <div className="mt-4">
              <HeadingLinks headings={headings} />
            </div>
          </details>
        </nav>
      )}
    </div>
  );
}

/** The lg sidebar, sticky beside the article from its first line: the IPO, the section links and the share links. */
function Sidebar({ ipo, headings, url, title }: { ipo: IpoLink | null; headings: Heading[]; url: string; title: string }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pb-4">
        {ipo && <RelatedIpoCard ipo={ipo} />}
        {headings.length > 0 && (
          <nav aria-label="On this page">
            <p className={LABEL}>On this page</p>
            <HeadingLinks headings={headings} />
          </nav>
        )}
        <section aria-label="Share this article">
          <p className={LABEL}>Share this article</p>
          <ShareLinks url={url} title={title} />
        </section>
      </div>
    </aside>
  );
}

/** The IPO's entity page, or the IPO list until it has one. */
const entityLink = (ipo: IpoLink) =>
  ipo.slug
    ? { href: `/analysis/${ipo.slug}`, label: `${ipo.name} IPO: GMP, price, dates, lot size and allotment` }
    : { href: "/ipos", label: "All IPOs: live, upcoming and listed" };

/** A single blog post: the article with its byline, cover and body, a sidebar from lg, then more on the same IPO. */
export default function BlogDisplay({ blog, ipo, articles }: { blog: Blog; ipo: IpoLink | null; articles: Blog[] }) {
  const all = headingsOf(blog.content);
  const headings = all.length >= 3 ? all : [];
  const url = `${SITE_URL}/blogs/${blog.slug}`;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blogs" }, { name: blog.title, href: `/blogs/${blog.slug}` }]} />

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16 xl:gap-20">
        <div className="min-w-0">
          <article>
            <header>
              {blog.category && (
                <p className="mb-4">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{blog.category}</span>
                </p>
              )}
              <h1 className="mb-4 max-w-[24ch] font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-balance sm:text-5xl">{blog.title}</h1>
              {blog.excerpt && <p className="mb-6 max-w-[70ch] text-lg text-pretty text-muted-foreground">{blog.excerpt}</p>}
              <Byline blog={blog} />
            </header>

            {blog.image_url && (
              <div className="mt-8 overflow-hidden rounded-[18px] border border-border bg-secondary">
                <Image
                  src={blog.image_url}
                  alt={blog.title}
                  width={1200}
                  height={630}
                  priority
                  sizes="(min-width: 1280px) 836px, (min-width: 1024px) calc(100vw - 428px), calc(100vw - 32px)"
                  className="h-auto w-full"
                />
              </div>
            )}

            <InlineAside ipo={ipo} headings={headings} />

            <div className="mt-10">
              <MarkdownRenderer content={blog.content} />
            </div>

            <footer className="mt-12 space-y-6 border-t border-border pt-6">
              {blog.tags.length > 0 && (
                <ul aria-label="Tags" className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</li>
                  ))}
                </ul>
              )}
              <section aria-label="Share this article" className="lg:hidden">
                <p className={LABEL}>Share this article</p>
                <ShareLinks url={url} title={blog.title} />
              </section>
            </footer>
          </article>

          <div className="mt-12 space-y-6">
            {ipo && <IpoArticleLinks title={`More on ${ipo.name} IPO`} lead={entityLink(ipo)} blogs={articles} />}

            <section className="flex flex-col items-start gap-4 rounded-[18px] bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <p className="text-lg font-medium text-pretty text-foreground">See every live, upcoming and listed IPO in one list.</p>
              <ArrowLink href="/ipos" className="shrink-0">See all IPOs</ArrowLink>
            </section>
          </div>
        </div>

        <Sidebar ipo={ipo} headings={headings} url={url} title={blog.title} />
      </div>
    </div>
  );
}
