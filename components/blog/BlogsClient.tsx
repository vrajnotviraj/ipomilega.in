"use client";

import { ProgressLink } from "@/components/progress/ProgressLink";
import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { BLOG_PAGE_SIZE, blogPagePath, categoryLabel, postsOnPage, type PostSummary } from "@/lib/blog/format";
import { PAGER } from "@/components/ui/pager";
import { useT } from "@/lib/i18n/client";
import { Byline, CardFooter, KindLabel, PostCard } from "@/components/blog/PostCard";

/** The newest post on an ink panel, with its cover image when there is one. */
function LeadPost({ post }: { post: PostSummary }) {
  return (
    <ProgressLink
      href={`/blogs/${post.slug}`}
      className={cn("card-lift group grid gap-6 rounded-[18px] bg-primary p-6 text-primary-foreground sm:p-8 lg:col-span-2", post.image_url && "sm:grid-cols-[1fr_220px]")}
    >
      <div className="flex flex-col gap-4">
        <KindLabel post={post} onInk />
        <h2 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-balance group-hover:underline group-hover:underline-offset-4 sm:text-4xl">
          {post.title}
        </h2>
        <p className="mb-2 max-w-[60ch] text-primary-foreground/75 text-pretty">{post.excerpt}</p>
        <CardFooter post={post} onInk />
      </div>
      {post.image_url && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          <Image src={post.image_url} alt="" fill priority sizes="(min-width: 640px) 220px, calc(100vw - 80px)" className="object-cover" />
        </div>
      )}
    </ProgressLink>
  );
}

/** The next newest posts, as a short list beside the lead. */
function AlsoNew({ posts }: { posts: PostSummary[] }) {
  const d = useT().blog.list;
  return (
    <section aria-labelledby="also-new" className="flex flex-col rounded-[18px] bg-secondary p-5 sm:p-6">
      <h2 id="also-new" className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{d.alsoNew}</h2>
      <ul className="flex flex-1 flex-col divide-y divide-primary/15">
        {posts.map((post) => (
          <li key={post._id} className="flex-1">
            <ProgressLink href={`/blogs/${post.slug}`} className="group flex h-full flex-col gap-2 py-4">
              <KindLabel post={post} />
              <h3 className="font-display text-base font-bold leading-[1.25] tracking-[-0.015em] text-balance group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
              <p className="text-xs text-muted-foreground"><Byline post={post} /></p>
            </ProgressLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Previous and next between pages: links to /blogs/page/N, or buttons over search results. */
function BlogPager({ page, pages, onPage }: { page: number; pages: number; onPage?: (page: number) => void }) {
  const w = useT().ipos.pager;
  const link = (to: number, rel: "prev" | "next", children: React.ReactNode) => {
    if (to < 1 || to > pages) return <span aria-disabled="true" className={cn(PAGER, "pointer-events-none opacity-40")}>{children}</span>;
    if (onPage) return <button type="button" onClick={() => onPage(to)} className={PAGER}>{children}</button>;
    return <ProgressLink href={blogPagePath(to)} rel={rel} className={PAGER}>{children}</ProgressLink>;
  };

  return (
    <nav aria-label={w.label} className="mt-10 flex items-center justify-center gap-3">
      {link(page - 1, "prev", <><ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> {w.previous}</>)}
      <span className="font-mono text-sm tabular-nums text-muted-foreground">{page} / {pages}</span>
      {link(page + 1, "next", <>{w.next} <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" /></>)}
    </nav>
  );
}

/**
 * One page of posts with search and category filters over all of them.
 * Page 1 leads with the newest post and two more beside it. Filtered results page in place.
 */
export default function BlogsClient({ posts, page, pages }: { posts: PostSummary[]; page: number; pages: number }) {
  const { blog: d, common } = useT();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [resultsPage, setResultsPage] = useState(1);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>([["All", posts.length]]);
    for (const post of posts) if (post.category) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    return counts;
  }, [posts]);

  const matchingPosts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return posts.filter((post) => {
      const inCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesSearch = !search || `${post.title} ${post.excerpt}`.toLowerCase().includes(search);
      return inCategory && matchesSearch;
    });
  }, [posts, activeCategory, query]);

  const filtering = Boolean(query.trim()) || activeCategory !== "All";
  const listPage = filtering ? resultsPage : page;
  const listPages = filtering ? Math.max(1, Math.ceil(matchingPosts.length / BLOG_PAGE_SIZE)) : pages;
  const shown = postsOnPage(filtering ? matchingPosts : posts, listPage);
  const hasLead = !filtering && page === 1 && shown.length > 3;
  const grid = hasLead ? shown.slice(3) : shown;

  const search = (text: string) => { setQuery(text); setResultsPage(1); };
  const pickCategory = (category: string) => { setActiveCategory(category); setResultsPage(1); };
  const showResultsPage = (to: number) => {
    setResultsPage(to);
    document.getElementById("posts")?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <div id="posts" className="mb-8 flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <Input
            type="search"
            aria-label={d.list.search}
            placeholder={d.list.search}
            value={query}
            onChange={(e) => search(e.target.value)}
            className="h-10 rounded-full bg-card pl-10 text-sm"
          />
        </div>
        {categoryCounts.size > 2 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={d.list.filterByCategory}>
            {[...categoryCounts].map(([category, count]) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => pickCategory(category)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors press",
                  activeCategory === category ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-secondary"
                )}
              >
                {category === "All" ? common.all : categoryLabel(d.categories, category)}
                <span className="font-mono text-xs tabular-nums opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={BookOpen} title={d.list.emptyTitle} hint={d.list.emptyHint} />
      ) : (
        <>
          {hasLead && (
            <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-3">
              <LeadPost post={shown[0]} />
              <AlsoNew posts={shown.slice(1, 3)} />
            </div>
          )}
          <div className="reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {grid.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
          {listPages > 1 && <BlogPager page={listPage} pages={listPages} onPage={filtering ? showResultsPage : undefined} />}
        </>
      )}
    </>
  );
}
