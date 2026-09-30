"use client";

import { useState } from "react";
import { Blog } from "@/types/ipo";
import { MailOpen, PenBox, ArrowRight } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmptyState } from "@/components/home/EmptyState";

// Minutes to read at 200 words a minute.
const estimateReadTime = (content: string): number => {
  const words = content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
};

export function BlogSection({ blogs }: { blogs: Blog[] }) {
  const [email, setEmail] = useState('');

  const subscribeToNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Subscribed. The next analysis lands in your inbox.");
        setEmail('');
      } else {
        toast.error(data.message || "We couldn't subscribe you. Please try again.");
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Connection failed. Please try again.');
    }
  };

  return (
    <div className="py-15">
      <section>
        <div>
          <div className="flex justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground">From the blog</h2>
            <ProgressLink
              href="/blogs"
              className="text-primary hover:text-primary/80 font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
            >
              <span>All posts</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </ProgressLink>
          </div>

          {blogs.length === 0 ? (
            <EmptyState icon={PenBox} title="No posts yet" hint="Explainers on GMP, allotment and reading a prospectus are on the way." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              {blogs.slice(0, 3).map((blog) => (
                <ProgressLink key={blog._id} href={`/blogs/${blog.slug}`} className="group block rounded-lg transition-transform duration-300 hover:-translate-y-0.5">
                  <div className="text-xs text-muted-foreground font-sans mb-1.5">
                    {blog.category || 'IPO Analysis'} · {estimateReadTime(blog.content)} min read
                  </div>
                  <h3 className="font-serif font-semibold text-foreground text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {blog.excerpt || blog.content.trim().split(' ').slice(0, 25).join(' ') + '...'}
                  </p>
                </ProgressLink>
              ))}
            </div>
          )}

          <hr className="border-border mt-8 mb-4" />
          <p className="text-xs text-muted-foreground/80 font-sans">
            IPO Milega generates this analysis automatically from each company&apos;s public RHP/DRHP filing using AI. It is not investment advice, and IPO Milega accepts no responsibility for losses arising from any investment decision. Always read the full prospectus before applying.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-2 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <MailOpen className="w-7 h-7 text-muted-foreground" />
                <div>
                  <div>Get IPO updates by email</div>
                  <div className="text-muted-foreground mt-2 font-sans text-sm sm:text-base font-normal">New analyses and GMP moves, sent straight to your inbox.</div>
                </div>
              </h2>
            </div>
          </div>
          <form onSubmit={subscribeToNewsletter} className="flex flex-col sm:flex-row mt-4 gap-2 items-center w-full max-w-lg mx-auto sm:mx-0">
            <Input
              type="email"
              required
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-card text-foreground font-sans font-normal border-border"
            />
            <Button type="submit" variant="default" className="font-sans font-medium w-full sm:w-auto">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}