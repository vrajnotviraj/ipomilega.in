"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

/** Copies `url` and confirms in a toast. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: "Paste it into any chat to share." });
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <Link2 className="size-4" strokeWidth={2} aria-hidden="true" />
      Copy link
    </button>
  );
}
