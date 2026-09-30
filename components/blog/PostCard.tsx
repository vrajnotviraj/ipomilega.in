import { ProgressLink } from "@/components/progress/ProgressLink";
import { formatBlogDate, type PostSummary } from "@/components/blog/blog-format";

/** "IPO Analysis · 4 min read" */
export function MetaLine({ post }: { post: PostSummary }) {
  return (
    <p className="mb-2 text-xs text-muted-foreground">
      {post.category || "IPO Analysis"} · <span className="font-mono tabular-nums">{post.readTime}</span> min read
    </p>
  );
}

/** "Author, 18 Aug 2026" */
export function Byline({ post }: { post: PostSummary }) {
  return (
    <p className="text-xs text-muted-foreground">
      {post.author},{" "}
      <time dateTime={post.publishedAt} className="font-mono tabular-nums">
        {formatBlogDate(post.publishedAt)}
      </time>
    </p>
  );
}

/** Card for one blog post: category and read time, title, excerpt and byline. */
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <ProgressLink
      href={`/blogs/${post.slug}`}
      className="card-lift group flex flex-col rounded-xl border border-border bg-card p-5 active:scale-[0.98]"
    >
      <MetaLine post={post} />
      <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold leading-[1.2] tracking-[-0.015em] text-balance group-hover:underline group-hover:underline-offset-4">
        {post.title}
      </h3>
      <p className="mb-4 line-clamp-3 text-sm text-muted-foreground text-pretty">{post.excerpt}</p>
      <div className="mt-auto">
        <Byline post={post} />
      </div>
    </ProgressLink>
  );
}
