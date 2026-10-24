"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";

/**
 * Opens the system share sheet with the text, plus the title and the page link when given (apps like WhatsApp paste the title above the text).
 * Without a share sheet it copies the link (or the text) and says so in a toast.
 */
export function ShareButton({ title, text, url = false }: { title?: string; text: string; url?: boolean }) {
  const d = useT().common.share;
  async function share() {
    const link = url ? window.location.href : undefined;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: link });
        return;
      }
      await navigator.clipboard.writeText(link ?? text);
      if (link) toast.success(d.linkCopied, { description: d.pasteLink });
      else toast.success(d.detailsCopied, { description: d.pasteDetails });
    } catch (error) {
      // Closing the share sheet rejects with AbortError, which is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Error sharing:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary press"
    >
      <Share2 className="size-4" strokeWidth={2} />
      <span className="max-sm:sr-only">{d.button}</span>
    </button>
  );
}
