import { Metadata } from "next";
import { openGraphBase } from "@/lib/share";
import { notFound } from "next/navigation";
import BlogDisplay from "./BlogDisplay";
import { getBlogBySlug } from "@/lib/queries/blogs";
import { Blog } from "@/types/ipo";

export const revalidate = 600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlogBySlug(id);
  if (!blog) {
    return { title: "Blog Not Found", description: "The requested blog post could not be found." };
  }

  const image = (blog as Blog & { featured_image?: string }).featured_image;
  return {
    title: blog.title,
    description: blog.meta_description,
    keywords: blog.tags.join(", "),
    authors: [{ name: blog.author }],
    alternates: { canonical: `/blogs/${id}` },
    openGraph: {
      ...openGraphBase(),
      url: `/blogs/${id}`,
      title: blog.title,
      description: blog.meta_description,
      type: "article",
      publishedTime: blog.created_at,
      modifiedTime: blog.updated_at,
      authors: [blog.author],
      tags: blog.tags,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.meta_description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPage({ params }: Params) {
  const blog = await getBlogBySlug((await params).id);
  if (!blog) notFound();
  return <BlogDisplay blog={blog} />;
}
