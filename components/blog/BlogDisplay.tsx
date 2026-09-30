import Image from "next/image";
import { Blog } from "@/types/ipo";
import type { IpoLink } from "@/lib/queries/ipos";
import { publishedAtOf } from "@/lib/seo/news-sitemap";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { IpoArticleLinks } from "@/components/blog/IpoArticleLinks";
import { ArrowLink } from "@/components/ui/ArrowLink";
import MarkdownRenderer from "@/components/blog/MarkDown";
import { RelatedIpoCard } from "@/components/blog/RelatedIpoCard";
import { ShareButton } from "@/components/ui/ShareButton";
import { formatBlogDate, readTimeOf } from "@/components/blog/blog-format";

function TagChip({ tag }: { tag: string }) {
  return <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</span>;
}

function PostHeader({ blog }: { blog: Blog }) {
  return (
    <header className="mb-10 border-b border-border pb-8">
      {blog.image_url && (
        <div className="mb-8 overflow-hidden rounded-[18px] bg-secondary">
          <Image src={blog.image_url} alt={blog.title} height={300} width={1000} className="w-full object-cover" />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{blog.category}</span>
        {blog.tags.slice(0, 3).map((tag) => (
          <TagChip key={tag} tag={tag} />
        ))}
      </div>

      <h1 className="mb-5 max-w-[20ch] font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{blog.title}</h1>
      <p className="mb-6 max-w-[65ch] text-lg text-muted-foreground">{blog.excerpt}</p>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{blog.author}</span>
        <span aria-hidden>·</span>
        <time dateTime={publishedAtOf(blog)} className="font-mono tabular-nums">{formatBlogDate(publishedAtOf(blog))}</time>
        {blog.updated_at && blog.updated_at !== blog.created_at && (
          <>
            <span aria-hidden>·</span>
            <span>
              Updated <time dateTime={blog.updated_at} className="font-mono tabular-nums">{formatBlogDate(blog.updated_at)}</time>
            </span>
          </>
        )}
        <span aria-hidden>·</span>
        <span><span className="font-mono tabular-nums">{readTimeOf(blog)}</span> min read</span>
      </p>
    </header>
  );
}

function PostFooter({ blog }: { blog: Blog }) {
  return (
    <footer className="mb-12 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tags:</span>
        {blog.tags.map((tag) => (
          <TagChip key={tag} tag={tag} />
        ))}
      </div>
      <ShareButton title={blog.title} text={blog.excerpt} url label="Share article" />
    </footer>
  );
}

/** The IPO's entity page, or the IPO list until it has one. */
const entityLink = (ipo: IpoLink) =>
  ipo.slug
    ? { href: `/analysis/${ipo.slug}`, label: `${ipo.name} IPO: GMP, price, dates, lot size and allotment` }
    : { href: "/ipos", label: "All IPOs: live, upcoming and listed" };

/** A single blog post: breadcrumb, header, related IPO, the article body and links to more on the same IPO. */
export default function BlogDisplay({ blog, ipo, articles }: { blog: Blog; ipo: IpoLink | null; articles: Blog[] }) {
  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blogs" }, { name: blog.title, href: `/blogs/${blog.slug}` }]} />
        </div>
        <ShareButton title={blog.title} text={blog.excerpt} url />
      </div>

      <PostHeader blog={blog} />
      {blog.ipo_id && <RelatedIpoCard ipoId={blog.ipo_id} />}

      <article className="mb-12">
        <MarkdownRenderer content={blog.content} />
      </article>

      <PostFooter blog={blog} />

      {ipo && (
        <div className="mb-12">
          <IpoArticleLinks title={`More on ${ipo.name} IPO`} lead={entityLink(ipo)} blogs={articles} />
        </div>
      )}

      <section className="flex flex-col items-start gap-4 rounded-[18px] bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="text-lg font-medium text-foreground">See every live, upcoming and listed IPO in one list.</p>
        <ArrowLink href="/ipos">See all IPOs</ArrowLink>
      </section>
    </div>
  );
}
