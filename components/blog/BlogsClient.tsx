"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { PostSummary } from "@/components/blog/blog-format";
import { Byline, MetaLine, PostCard } from "@/components/blog/PostCard";

/** The newest matching post, wide, with its cover image when there is one. */
function FeaturedPost({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="card-lift mb-6 grid active:scale-[0.98] grid-cols-1 items-center gap-6 overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_320px]"
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
    </Link>
  );
}

/** Search and category filters over every published post. The server renders the full list, so crawlers see every link. */
export default function BlogsClient({ posts }: { posts: PostSummary[] }) {
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

  const [featured, ...rest] = matchingPosts;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search articles"
            placeholder="Search articles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-full bg-card pl-10 text-sm"
          />
        </div>
        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
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
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {!featured ? (
        <EmptyState icon={BookOpen} title="No articles found" hint="Try a different search or category." />
      ) : (
        <>
          <FeaturedPost post={featured} />
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
