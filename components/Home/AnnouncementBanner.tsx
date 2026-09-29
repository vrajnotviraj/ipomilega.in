// AnnouncementBanner.tsx
// Compact teal banner carrying the site's pitch, in place of a full hero section.

import { ProgressLink } from '@/components/Progressbar/ProgressLink';

export function AnnouncementBanner() {
  return (
    <div className="mb-4 sm:mb-10">
      <div className="bg-primary rounded-lg px-4 py-3 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="text-primary-foreground text-sm sm:text-base font-sans max-w-2xl">
          We boil a 600-page prospectus down to one screen: 5 separate scores, with the evidence for each a scroll away.
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
