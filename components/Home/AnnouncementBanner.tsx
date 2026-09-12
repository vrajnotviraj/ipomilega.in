// AnnouncementBanner.tsx
// Compact teal banner carrying the site's pitch, in place of a full hero section.

import { ProgressLink } from '@/components/Progressbar/ProgressLink';

export function AnnouncementBanner() {
  return (
    <div className="mb-4 sm:mb-10">
      <div className="bg-primary rounded-lg px-4 py-3 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="text-primary-foreground text-sm sm:text-base font-sans max-w-2xl">
          A 600-page prospectus fits on one screen — five independent scores, evidence one scroll away, no sales pitch.
        </p>
        <ProgressLink
          href="/analysis"
          className="text-primary-foreground text-sm sm:text-base font-medium underline underline-offset-4 hover:no-underline flex-shrink-0 whitespace-nowrap"
        >
          See a full analysis →
        </ProgressLink>
      </div>
    </div>
  );
}
