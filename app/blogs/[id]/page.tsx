import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDisplay from "./BlogDisplay";
import { getBlogBySlug } from "@/lib/queries/blogs";

interface BlogPost {
  title: string;
  slug: string;
  ipo_id: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  status: "draft" | "published";
  featured_image?: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  author: string;
}

export const revalidate = 600;

// Reads Mongo directly instead of fetching this app's own /api/blogs/slug/[slug] route.
// NEXTAUTH_URL is not set anywhere in this project, so that URL interpolated to
// "undefined/api/blogs/slug/..." -- `new URL()` threw, the catch swallowed it, and every blog
// page fell through to notFound(). Going straight to the query layer fixes the 404 and drops
// the extra HTTP hop; React `cache` shares one read between generateMetadata and the page.
async function getBlogPost(id: string): Promise<BlogPost | null> {
  const blog = await getBlogBySlug(id);
  return (blog as unknown as BlogPost) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params; // Await the params Promise
  const blog = await getBlogPost(id);

  if (!blog) {
    return {
      title: "Blog Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: blog.title,
    description: blog.meta_description,
    keywords: blog.tags.join(", "),
    authors: [{ name: blog.author }],
    openGraph: {
      title: blog.title,
      description: blog.meta_description,
      type: "article",
      publishedTime: blog.created_at,
      modifiedTime: blog.updated_at,
      authors: [blog.author],
      tags: blog.tags,
      images: blog.featured_image ? [{ url: blog.featured_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.meta_description,
      images: blog.featured_image ? [blog.featured_image] : undefined,
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await the params Promise
  const blog = await getBlogPost(id);

  if (!blog) {
    notFound();
  }

  return <BlogDisplay blog={blog} />;
}