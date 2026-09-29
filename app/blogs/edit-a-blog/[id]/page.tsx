import { Metadata } from "next";
import EditBlog from "./EditBlog";
import { Blog } from "@/types/ipo";

async function getBlogPost(id: string): Promise<Blog | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/blogs/edit-a-blog/${id}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()).blog;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const blog = await getBlogPost((await params).id);
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
      images: blog.image_url ? [{ url: blog.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.meta_description,
      images: blog.image_url ? [blog.image_url] : undefined,
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const blog = await getBlogPost((await params).id);
  return <EditBlog blog={blog || ({} as Blog)} />;
}
