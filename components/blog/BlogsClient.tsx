"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { Blog } from "@/types/ipo";
import { excerptOf } from "@/components/blog/blog-format";
import { Byline, MetaLine, PostCard } from "@/components/blog/PostCard";

/** The newest matching post, wide, with its cover image when there is one. */
function FeaturedPost({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="card-lift mb-6 grid active:scale-[0.98] grid-cols-1 items-center gap-6 overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_320px]"
    >
      <div>
        <MetaLine blog={blog} />
        <h2 className="mb-3 text-2xl font-bold leading-[1.15] tracking-[-0.03em] sm:text-3xl">{blog.title}</h2>
        <p className="mb-4 max-w-[65ch] text-muted-foreground">{excerptOf(blog, 40)}</p>
        <Byline blog={blog} />
      </div>
      {blog.image_url && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
          <Image src={blog.image_url} alt={blog.title} fill priority sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
        </div>
      )}
    </Link>
  );
}

/** The /blogs page: search and category filters over every published post. */
export default function BlogsClient({ blogs }: { blogs: Blog[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => ["All", ...new Set(blogs.map((b) => b.category).filter(Boolean))], [blogs]);

  const matchingBlogs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return blogs.filter((blog) => {
      const inCategory = activeCategory === "All" || blog.category === activeCategory;
      const matchesSearch = !search || blog.title.toLowerCase().includes(search);
      return inCategory && matchesSearch;
    });
  }, [blogs, activeCategory, query]);

  const [featured, ...rest] = matchingBlogs;

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <header className="mb-8">
        <h1 className="type-hero text-[44px] sm:text-[60px]">Blog</h1>
        <p className="mt-3 text-muted-foreground">IPO reviews, market notes and guides.</p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <Input
            aria-label="Search posts"
            placeholder="Search posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-full bg-card pl-10 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {!featured ? (
        <EmptyState icon={BookOpen} title="No posts found" hint="Try a different search or category." />
      ) : (
        <>
          <FeaturedPost blog={featured} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {rest.map((blog) => (
              <PostCard key={blog._id} blog={blog} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
