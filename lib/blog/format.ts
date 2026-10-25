import { Blog } from "@/types/ipo";
import { publishedAtOf } from "@/lib/seo/news-sitemap";

/** Minutes to read at 200 words a minute, at least 1. */
export function readTimeOf(blog: Pick<Blog, "content">): number {
  const words = blog.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
}

/** The post's excerpt, or its first `words` words. */
function excerptOf(blog: Pick<Blog, "excerpt" | "content">, words: number): string {
  return blog.excerpt || blog.content.trim().split(" ").slice(0, words).join(" ") + "...";
}

/** The category in the reader's language, or the raw English value when the dictionary has no word for it. */
export const categoryLabel = (words: Record<string, string>, category: string) => words[category] ?? category;

/** "18 Aug 2026". */
export function formatBlogDate(date: string): string {
  // Pinned to IST so the server render and the browser print the same day.
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export const BLOG_PAGE_SIZE = 12;

/** /blogs for page 1, /blogs/page/<n> after; /blogs/<n> would clash with post slugs. */
export const blogPagePath = (page: number) => (page === 1 ? "/blogs" : `/blogs/page/${page}`);

/** The posts on one page of /blogs. */
export const postsOnPage = <T>(posts: T[], page: number) => posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);

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
