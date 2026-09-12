import { Blog } from "@/app/models/ipo";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import { LogoMark } from "@/components/Brand/Logo";

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link href={`/blogs/${blog.slug}`} className="group block">
      <Card className="h-[424px] p-3 bg-card rounded-lg group-hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden" style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '10px solid var(--primary)', boxShadow: 'none' }}>
        <div className="relative rounded-t-lg h-[calc(250px-5px)] bg-gradient-to-br from-foreground/90 to-foreground flex items-center justify-center p-2">
          {blog.image_url ? (
            <Image
              src={blog.image_url || ""}
              alt={blog.title}
              fill
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="text-center">
              <LogoMark className="h-12 w-12 mx-auto mb-2" />
              <p className="text-background/70 text-xs font-medium tracking-wide">
                {blog.author}
              </p>
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <Badge
              variant="outline"
              className="text-xs font-medium px-2 py-1 border-border text-foreground bg-secondary"
              style={{ fontWeight: '400', border: 'none' }}
            >
              {blog.category || "IPO Analysis"}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(blog.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <CardTitle className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-serif">
            {blog.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-3 mt-2 font-sans font-normal">
            {blog.excerpt || blog.content.trim().split(" ").slice(0, 25).join(" ") + "..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-end mb-3">
            <div className="flex items-center text-sm font-medium font-sans text-primary group-hover:text-primary/80 transition-colors">
              Read More
              <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
