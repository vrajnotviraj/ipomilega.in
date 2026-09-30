import { Blog } from "@/types/ipo";
import { publishedAtOf } from "@/lib/seo/news-sitemap";

/** Minutes to read at 200 words a minute, at least 1. */
export function readTimeOf(blog: Pick<Blog, "content">): number {
  const words = blog.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
}

/** The post's excerpt, or its first `words` words. */
export function excerptOf(blog: Pick<Blog, "excerpt" | "content">, words: number): string {
  return blog.excerpt || blog.content.trim().split(" ").slice(0, words).join(" ") + "...";
}

/** "18 Aug 2026". */
export function formatBlogDate(date: string): string {
  // Pinned to IST so the server render and the browser print the same day.
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** What a post card needs. Built on the server so the /blogs page never ships post bodies to the browser. */
export type PostSummary = Pick<Blog, "_id" | "slug" | "title" | "category" | "author" | "image_url"> & {
  excerpt: string;
  publishedAt: string;
  readTime: number;
};

export const toSummary = (blog: Blog): PostSummary => ({
  _id: blog._id,
  slug: blog.slug,
  title: blog.title,
  category: blog.category,
  author: blog.author,
  image_url: blog.image_url,
  excerpt: excerptOf(blog, 40),
  publishedAt: publishedAtOf(blog),
  readTime: readTimeOf(blog),
});
