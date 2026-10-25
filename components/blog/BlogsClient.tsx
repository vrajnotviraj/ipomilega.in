"use client";

import { ProgressLink } from "@/components/progress/ProgressLink";
import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { BLOG_PAGE_SIZE, blogPagePath, categoryLabel, type PostSummary } from "@/lib/blog/format";
import { PAGER } from "@/components/ui/pager";
import { useT } from "@/lib/i18n/client";
import { Byline, MetaLine, PostCard } from "@/components/blog/PostCard";

/** The newest matching post, wide, with its cover image when there is one. */
function FeaturedPost({ post }: { post: PostSummary }) {
  return (
    <ProgressLink
      href={`/blogs/${post.slug}`}
      className="card-lift mb-6 grid grid-cols-1 items-center gap-6 overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_320px]"
    >
      <div>
        <MetaLine post={post} />
        <h2 className="mb-3 font-display text-2xl font-bold leading-[1.15] tracking-[-0.03em] text-balance sm:text-3xl">{post.title}</h2>
        <p className="mb-4 max-w-[65ch] text-muted-foreground text-pretty">{post.excerpt}</p>
        <Byline post={post} />
      </div>
      {post.image_url && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
          <Image src={post.image_url} alt="" fill priority sizes="(min-width: 1024px) 320px, calc(100vw - 72px)" className="object-cover" />
        </div>
      )}
    </ProgressLink>
  );
}

/** Previous and next links between pages of /blogs. Plain links, so crawlers walk every page. */
function BlogPager({ page, pages }: { page: number; pages: number }) {
  const w = useT().ipos.pager;
  const link = (to: number, rel: "prev" | "next", children: React.ReactNode) =>
    to < 1 || to > pages ? (
      <span aria-disabled="true" className={cn(PAGER, "pointer-events-none opacity-40")}>{children}</span>
    ) : (
      <ProgressLink href={blogPagePath(to)} rel={rel} className={PAGER}>{children}</ProgressLink>
    );

  return (
    <nav aria-label={w.label} className="mt-10 flex items-center justify-center gap-3">
      {link(page - 1, "prev", <><ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> {w.previous}</>)}
      <span className="font-mono text-sm tabular-nums text-muted-foreground">{page} / {pages}</span>
      {link(page + 1, "next", <>{w.next} <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" /></>)}
    </nav>
  );
}

/** One page of posts, or every match while a search or category filter is on. The server renders only the page's cards. */
export default function BlogsClient({ posts, page, pages }: { posts: PostSummary[]; page: number; pages: number }) {
  const { blog: d, common } = useT();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => ["All", ...new Set(posts.map((p) => p.category).filter(Boolean))], [posts]);

  const matchingPosts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return posts.filter((post) => {
      const inCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesSearch = !search || `${post.title} ${post.excerpt}`.toLowerCase().includes(search);
      return inCategory && matchesSearch;
    });
  }, [posts, activeCategory, query]);

  const filtering = Boolean(query.trim()) || activeCategory !== "All";
  const shown = filtering ? matchingPosts : posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
  // Only the first page and search results lead with the wide card.
  const lead = filtering || page === 1;
  const featured = lead ? shown[0] : undefined;
  const rest = lead ? shown.slice(1) : shown;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <Input
            type="search"
            aria-label={d.list.search}
            placeholder={d.list.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-full bg-card pl-10 text-sm"
          />
        </div>
        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={d.list.filterByCategory}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-secondary"
                )}
              >
                {category === "All" ? common.all : categoryLabel(d.categories, category)}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={BookOpen} title={d.list.emptyTitle} hint={d.list.emptyHint} />
      ) : (
        <>
          {featured && <FeaturedPost post={featured} />}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
          {!filtering && pages > 1 && <BlogPager page={page} pages={pages} />}
        </>
      )}
    </>
  );
}
