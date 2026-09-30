import { Blog } from "@/types/ipo";

/** Minutes to read at 200 words a minute, at least 1. */
export function readTimeOf(blog: Blog): number {
  const words = blog.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
}

/** The post's excerpt, or its first `words` words. */
export function excerptOf(blog: Blog, words: number): string {
  return blog.excerpt || blog.content.trim().split(" ").slice(0, words).join(" ") + "...";
}

/** "18 Aug 2026". */
export function formatBlogDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
