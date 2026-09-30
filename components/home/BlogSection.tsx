import { PenBox } from 'lucide-react';
import { Blog } from '@/types/ipo';
import { EmptyState } from '@/components/ui/EmptyState';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { PostCard } from '@/components/blog/PostCard';
import { toSummary } from '@/components/blog/blog-format';
import { NewsletterSignup } from '@/components/home/NewsletterSignup';
import { SectionHeading } from '@/components/home/SectionHeading';

/** Latest three blog posts, the analysis disclaimer and the newsletter signup. */
export function BlogSection({ blogs }: { blogs: Blog[] }) {
  return (
    <section className="py-8 sm:py-12">
      <SectionHeading title="From the blog" href="/blogs" linkText="All posts" />

      {blogs.length === 0 ? (
        <EmptyState icon={PenBox} title="No posts yet" hint="Explainers on GMP, allotment and reading a prospectus are on the way." />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {blogs.slice(0, 3).map((blog) => (
            <PostCard key={blog._id} post={toSummary(blog)} />
          ))}
        </div>
      )}

      <AiDisclaimer className="mt-8 border-t border-border pt-4" />

      <NewsletterSignup />
    </section>
  );
}
