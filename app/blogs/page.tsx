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

export default async function BlogsPage() {
  return <BlogsClient blogs={await getPublishedBlogs()} />;
}
