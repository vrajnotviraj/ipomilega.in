import { Metadata } from "next";
import { openGraphBase } from "@/lib/share";
import { getPublishedBlogs } from "@/lib/queries/blogs";
import BlogsClient from "./BlogsClient";

export const revalidate = 600;

const title = "Blog - IPO Analysis, Company Reviews & Market News";
const description = "Read our latest IPO analysis, company reviews, market news and investment guides.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blogs" },
  openGraph: { ...openGraphBase(), title, description, url: "/blogs" },
};

/**
 * Server component. Previously the whole page was `"use client"` and fetched
 * /api/blogs/published on mount -- a route that issued five sequential Mongo round-trips
 * (all blogs, then four near-identical category reads) before returning anything.
 */
export default async function BlogsPage() {
  const blogs = await getPublishedBlogs();
  return <BlogsClient blogs={JSON.parse(JSON.stringify(blogs))} />;
}
