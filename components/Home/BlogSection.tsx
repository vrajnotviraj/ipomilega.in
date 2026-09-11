// components/sections/BlogSection.tsx (example path)
"use client";

import { useState } from "react";
import { Blog } from "@/app/models/ipo";
import { MailOpen, PenBox, ArrowRight } from "lucide-react";
import { ProgressLink } from "@/components/Progressbar/ProgressLink";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";

// Rough reading time estimate from word count (200 wpm)
const estimateReadTime = (content: string): number => {
  const words = content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.round(words / 200));
};

export function BlogSection({ blogs }: { blogs: Blog[] }) {
  const [email, setEmail] = useState('');

  const subscribeToNewsletter = async (email: string) => {
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
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
        toast.success(data.message || "Successfully subscribed!");
        setEmail('');
      } else {
        toast.error(data.message || "Subscription failed.");
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="py-15">
      {/* Section for displaying blog posts */}
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
            <div className="flex items-center justify-center py-8">
              <div className="text-center py-6 bg-card rounded-xl shadow-sm border border-border max-w-sm w-full mx-4">
                <PenBox className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-base font-medium">No blogs available at the moment</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Check back soon for new insights!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              {blogs.slice(0, 3).map((blog: Blog) => (
                <ProgressLink key={blog._id} href={`/blogs/${blog.slug}`} className="group block">
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

      {/* Section for Newsletter Subscription */}
      <section className="py-10">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-2 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <MailOpen className="w-7 h-7 text-muted-foreground" />
                <div>
                  <div>Stay Updated with IPOs</div>
                  <div className="text-muted-foreground mt-2 font-sans text-sm sm:text-base font-normal">Get exclusive IPO insights, market analysis, and GMP updates delivered to your inbox.</div>
                </div>
              </h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row mt-4 gap-2 items-center w-full max-w-lg mx-auto sm:mx-0">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-card text-foreground font-sans font-normal border-border"
            />
            <Button onClick={() => subscribeToNewsletter(email)} variant="default" className="font-sans font-medium w-full sm:w-auto">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}