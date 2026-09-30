import { CopyLinkButton } from "@/components/ui/CopyLinkButton";

const PILL =
  "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]";

/** Share targets for one article. Plain links, so they work before any JavaScript loads; only "Copy link" needs the client. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const targets = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: "X", href: `https://x.com/intent/post?text=${t}&url=${u}&via=ipomilega` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];

  return (
    <ul className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <li key={target.name}>
          <a href={target.href} target="_blank" rel="noopener noreferrer" className={PILL} aria-label={`Share on ${target.name} (opens in a new tab)`}>
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
