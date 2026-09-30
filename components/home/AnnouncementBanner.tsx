import { ProgressLink } from '@/components/progress/ProgressLink';

export function AnnouncementBanner() {
  return (
    <div className="mb-4 sm:mb-10">
      <div className="group sheen bg-primary bg-[radial-gradient(ellipse_60%_120%_at_100%_0%,rgb(255_255_255/0.12),transparent_70%)] rounded-xl px-4 py-3 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="text-primary-foreground text-sm sm:text-base font-sans max-w-2xl">
          We boil a 600-page prospectus down to one screen: 5 separate scores, with the evidence for each a scroll away.
        </p>
        <ProgressLink
          href="/analysis"
          className="relative text-primary-foreground text-sm sm:text-base font-medium underline underline-offset-4 hover:no-underline flex-shrink-0 whitespace-nowrap"
        >
          See a full analysis <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </ProgressLink>
      </div>
    </div>
  );
}
