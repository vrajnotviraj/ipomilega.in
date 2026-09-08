"use client";

// app/blogs/[id]/BlogDisplay.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Building2,
  TrendingUp,
  Clock,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkDown";
import { Ipo } from "@/app/models/ipo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProgressRouter } from "@/components/Progressbar/useProgressRouter";
import { getIpoType } from "@/components/Home/ipoFormat";
import Image from "next/image";

interface BlogPost {
  title: string;
  slug: string;
  ipo_id: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  status: "draft" | "published";
  image_url?: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  author: string;
}


export default function BlogDisplay({ blog }: { blog: BlogPost }) {
  const [ipoData, setIpoData] = useState<Ipo | null>(null);
  const [isLoadingIpo, setIsLoadingIpo] = useState(false);
  // const [isBookmarked, setIsBookmarked] = useState(false);
  // const [isLiked, setIsLiked] = useState(false);
  const router = useProgressRouter();

  useEffect(() => {
    if (blog.ipo_id) {
      const fetchIpoData = async () => {
        setIsLoadingIpo(true);
        try {
          const response = await fetch(`/api/ipo/${blog.ipo_id}`);
          if (response.ok) {
            const data = await response.json();
            setIpoData(data.ipos);
          }
        } catch (error) {
          console.error("Error fetching IPO data:", error);
        } finally {
          setIsLoadingIpo(false);
        }
      };
      fetchIpoData();
    }
  }, [blog.ipo_id]);

  const formattedDate = new Date(blog.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const readingTime = Math.ceil(blog.content.split(" ").length / 200);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background mt-20">
      {/* Navigation Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blogs" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Link>
            </Button>

            <div className="flex items-center space-x-2">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={isLiked ? "text-red-500" : "text-muted-foreground"}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={isBookmarked ? "text-primary" : "text-muted-foreground"}
              >
                <BookmarkPlus className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              </Button> */}
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            {/* Featured Image */}
            {blog.image_url && (
              <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={blog.image_url}
                  alt={blog.title}
                  height={300}
                  width={1000}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            )}

            {/* Category and Tags */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Badge variant="default" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground">
                {blog.category}
              </Badge>
              {blog.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1 text-xs border text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-6 text-foreground leading-tight">
              {blog.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-8">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">{blog.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{readingTime} min read</span>
                </div>
                {/* <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>1.2k views</span>
                </div> */}
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {/* <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment
                </Button> */}
              </div>
            </div>

            <Separator className="border-t" />
          </header>

          {/* IPO Reference Card */}
          {blog.ipo_id && (
            <Card className="mb-12 bg-card border-border">
              <CardContent className="pt-6">
                {isLoadingIpo ? (
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[300px]" />
                    </div>
                  </div>
                ) : ipoData ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      {ipoData.image_url ? (
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={ipoData.image_url} alt={ipoData.upcoming_ipo_2025} />
                            <AvatarFallback>IP</AvatarFallback>
                          </Avatar>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-primary/10 border">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold font-serif text-lg text-foreground mb-1">
                          {ipoData.upcoming_ipo_2025}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="bg-muted px-2 py-1 rounded font-mono text-xs uppercase tracking-wide">
                            {getIpoType(ipoData)}
                          </span>
                          <span>•</span>
                          <span>{ipoData.ipo_details?.issue_size || "Size TBA"}</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/analysis/${ipoData.slug}`}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analysis
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>IPO information not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Article Content */}
          <article className="mb-12">
            <MarkdownRenderer
              content={blog.content}
              className="prose-headings:scroll-mt-20"
            />
          </article>

          <Separator className="my-12" />

          {/* Article Footer */}
          <footer className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground font-medium">Tags:</span>
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-xs bg-muted text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </Button>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={isBookmarked ? "bg-muted" : ""}
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {isBookmarked ? "Saved" : "Save"}
                </Button> */}
              </div>
            </div>
          </footer>

          {/* Related Articles Section */}
          <section>
            <div className="text-center">

              <Card className="bg-card border-border group hover:bg-accent/40 transition-all duration-300">
                <CardContent className="pt-6 text-center" onClick={() => router.push("/ipos")}>
                  <div className="text-muted-foreground mb-4">
                    <Building2 className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-muted-foreground">
                    Discover more IPO insights and market analysis here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}