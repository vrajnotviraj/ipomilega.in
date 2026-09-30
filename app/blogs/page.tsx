import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { getPublishedBlogs } from "@/lib/queries/blogs";
import BlogsClient from "@/components/blog/BlogsClient";

export const revalidate = 600;

const title = "Blog: IPO analysis, company reviews and market news";
const description = "Read our latest IPO analysis, company reviews, market news and investment guides.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blogs" },
  openGraph: { ...openGraphBase(), title, description, url: "/blogs" },
};

export default async function BlogsPage() {
  return <BlogsClient blogs={await getPublishedBlogs()} />;
}
