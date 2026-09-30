import { Blog } from "@/types/ipo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { excerptOf, formatBlogDate, readTimeOf } from "@/components/blog/blog-format";

/** "IPO Analysis · 4 min read" */
export function MetaLine({ blog }: { blog: Blog }) {
  return (
    <p className="mb-2 text-xs text-muted-foreground">
      {blog.category || "IPO Analysis"} · <span className="font-mono tabular-nums">{readTimeOf(blog)}</span> min read
    </p>
  );
}

/** "Author · 18 Aug 2026" */
export function Byline({ blog }: { blog: Blog }) {
  return (
    <p className="text-xs text-muted-foreground">
      {blog.author} · <span className="font-mono tabular-nums">{formatBlogDate(blog.created_at)}</span>
    </p>
  );
}

/** Card for one blog post: category and read time, title, excerpt and byline. */
export function PostCard({ blog }: { blog: Blog }) {
  return (
    <ProgressLink
      href={`/blogs/${blog.slug}`}
      className="card-lift group flex flex-col rounded-xl border border-border bg-card p-5 active:scale-[0.98]"
    >
      <MetaLine blog={blog} />
      <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold leading-[1.2] tracking-[-0.015em] group-hover:underline group-hover:underline-offset-4">
        {blog.title}
      </h3>
      <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{excerptOf(blog, 25)}</p>
      <div className="mt-auto">
        <Byline blog={blog} />
      </div>
    </ProgressLink>
  );
}
