"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Opens the system share sheet with the text, plus the page link when `url` is set.
 * Without a share sheet it copies the link (or the text) and says so in a toast.
 */
export function ShareButton({ title, text, url = false, label = "Share" }: { title: string; text: string; url?: boolean; label?: string }) {
  async function share() {
    const link = url ? window.location.href : undefined;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: link });
        return;
      }
      await navigator.clipboard.writeText(link ?? text);
      if (link) toast.success("Link copied", { description: "Paste it into any chat to share." });
      else toast.success("IPO details copied", { description: "Paste them into any chat to share." });
    } catch (error) {
      // Closing the share sheet rejects with AbortError, which is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Error sharing:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
    >
      <Share2 className="size-4" strokeWidth={2} />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  );
}
