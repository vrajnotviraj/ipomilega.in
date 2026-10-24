import { PenBox } from 'lucide-react';
import { Blog } from '@/types/ipo';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCard } from '@/components/blog/PostCard';
import { toSummary } from '@/lib/blog/format';
import { NewsletterSignup } from '@/components/home/NewsletterSignup';
import { SectionHeading } from '@/components/home/SectionHeading';
import { t } from '@/lib/i18n/server';

/** Latest three blog posts and the newsletter signup. */
export function BlogSection({ blogs }: { blogs: Blog[] }) {
  const d = t().home.blog;
  return (
    <section className="py-8 sm:py-12">
      <SectionHeading title={d.title} href="/blogs" linkText={d.allPosts} />

      {blogs.length === 0 ? (
        <EmptyState icon={PenBox} title={d.emptyTitle} hint={d.emptyHint} />
      ) : (
        <div className="reveal-stagger mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {blogs.slice(0, 3).map((blog) => (
            <PostCard key={blog._id} post={toSummary(blog)} />
          ))}
        </div>
      )}

      <NewsletterSignup />
    </section>
  );
}
