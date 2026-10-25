"use client";

import { ChartCandlestick, FileSearch, Newspaper, Ticket, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { categoryLabel, formatBlogDate, type PostSummary } from "@/lib/blog/format";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<NonNullable<PostSummary["article_type"]>, LucideIcon> = {
  analysis: FileSearch,
  gmp: TrendingUp,
  subscription: Users,
  allotment: Ticket,
  listing: ChartCandlestick,
};

/** What the post is about, as an icon and a label: "Subscription", or the category for older posts. */
export function KindLabel({ post, onInk = false }: { post: PostSummary; onInk?: boolean }) {
  const d = useT().blog;
  const Icon = post.article_type ? KIND_ICONS[post.article_type] : Newspaper;
  const label = post.article_type ? d.kinds[post.article_type] : categoryLabel(d.categories, post.category || "IPO Analysis");
  return (
    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.04em]">
      <span className={cn("grid size-7 place-items-center rounded-lg", onInk ? "bg-brand-accent text-primary" : "bg-primary/[0.07] text-primary")}>
        <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={onInk ? "text-primary-foreground" : "text-muted-foreground"}>{label}</span>
    </p>
  );
}

/** "Author, 18 Aug 2026" */
export function Byline({ post }: { post: PostSummary }) {
  return (
    <span>
      {post.author},{" "}
      <time dateTime={post.publishedAt} className="font-mono tabular-nums">
        {formatBlogDate(post.publishedAt)}
      </time>
    </span>
  );
}

/** Byline on the left, read time on the right, over a hairline. */
export function CardFooter({ post, onInk = false }: { post: PostSummary; onInk?: boolean }) {
  const d = useT().blog;
  return (
    <div className={cn("mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs", onInk ? "border-primary-foreground/20 text-primary-foreground/75" : "border-border text-muted-foreground")}>
      <Byline post={post} />
      <span className="shrink-0">
        <span className="font-mono tabular-nums">{post.readTime}</span> {d.minRead}
      </span>
    </div>
  );
}

/** Card for one blog post: kind, title, excerpt, then byline and read time. */
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <ProgressLink href={`/blogs/${post.slug}`} className="card-lift group flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <KindLabel post={post} />
      <h3 className="line-clamp-3 font-display text-lg font-bold leading-[1.2] tracking-[-0.015em] text-balance group-hover:underline group-hover:underline-offset-4">
        {post.title}
      </h3>
      <p className="mb-1 line-clamp-3 text-sm text-muted-foreground text-pretty">{post.excerpt}</p>
      <CardFooter post={post} />
    </ProgressLink>
  );
}
