import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Blog } from "@/types/ipo";
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
        <time dateTime={blog.created_at} className="font-mono tabular-nums">{formatBlogDate(blog.created_at)}</time>
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

/** A single blog post: header, related IPO, the article body and a path back to the IPO list. */
export default function BlogDisplay({ blog }: { blog: Blog }) {
  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to blog
        </Link>
        <ShareButton title={blog.title} text={blog.excerpt} url />
      </div>

      <PostHeader blog={blog} />
      {blog.ipo_id && <RelatedIpoCard ipoId={blog.ipo_id} />}

      <article className="mb-12">
        <MarkdownRenderer content={blog.content} />
      </article>

      <PostFooter blog={blog} />

      <section className="flex flex-col items-start gap-4 rounded-[18px] bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="text-lg font-medium text-foreground">See every live, upcoming and listed IPO in one list.</p>
        <ArrowLink href="/ipos">See all IPOs</ArrowLink>
      </section>
    </div>
  );
}
