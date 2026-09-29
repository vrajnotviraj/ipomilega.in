"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";
import { Blog } from "@/types/ipo";

const estimateReadTime = (content: string): number => {
  const words = content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

const excerptOf = (blog: Blog, words: number) =>
  blog.excerpt || blog.content.trim().split(" ").slice(0, words).join(" ") + "...";

const metaLine = (blog: Blog) => `${blog.category || "IPO Analysis"} · ${estimateReadTime(blog.content)} min read`;

export default function BlogsClient({ blogs }: { blogs: Blog[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => ["All", ...new Set(blogs.map((b) => b.category).filter(Boolean))], [blogs]);

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return blogs.filter((b) =>
      (activeCategory === "All" || b.category === activeCategory) && (!query || b.title.toLowerCase().includes(query))
    );
  }, [blogs, activeCategory, searchQuery]);

  const [featured, ...rest] = filteredBlogs;

  return (
    <div className="min-h-screen app-container pt-24 pb-16 font-sans">
      <div>
        <div className="mb-6">
          <div className="text-xs italic text-muted-foreground mb-1">Notes</div>
          <h1 className="text-3xl md:text-4xl font-semibold font-serif text-foreground">Blog</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-card border-border text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground/80 hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="text-center py-24 border border-border rounded-lg bg-card">
            <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-foreground font-medium">No posts found</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                href={`/blogs/${featured.slug}`}
                className="group grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-center pb-8 mb-10 border-b border-border"
              >
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {metaLine(featured)}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {excerptOf(featured, 40)}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {featured.author} · {formatDate(featured.created_at)}
                  </div>
                </div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-secondary flex items-center justify-center flex-shrink-0">
                  {featured.image_url ? (
                    <Image src={featured.image_url} alt={featured.title} fill sizes="320px" className="object-cover" />
                  ) : (
                    <span className="text-sm italic text-muted-foreground">Featured</span>
                  )}
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
                {rest.map((blog) => (
                  <Link
                    key={blog._id}
                    href={`/blogs/${blog.slug}`}
                    className="group block pt-6 border-t-2 border-foreground"
                  >
                    <div className="text-xs text-muted-foreground mb-2">
                      {metaLine(blog)}
                    </div>
                    <h3 className="font-serif font-semibold text-foreground text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                      {excerptOf(blog, 25)}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {blog.author} · {formatDate(blog.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
