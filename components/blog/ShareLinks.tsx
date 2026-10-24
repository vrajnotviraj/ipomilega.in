import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { fill } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/server";

const PILL =
  "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]";

/** Share targets for one article. Plain links, so they work before any JavaScript loads; only "Copy link" needs the client. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const d = t().blog.post;
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const targets = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: "X", href: `https://x.com/intent/post?text=${text}&url=${u}&via=ipomilega` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${text}` },
  ];

  return (
    <ul className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <li key={target.name}>
          <a href={target.href} target="_blank" rel="noopener noreferrer" className={PILL} aria-label={fill(d.shareOn, { name: target.name })}>
            {target.name}
          </a>
        </li>
      ))}
      <li>
        <CopyLinkButton url={url} className={PILL} />
      </li>
    </ul>
  );
}
