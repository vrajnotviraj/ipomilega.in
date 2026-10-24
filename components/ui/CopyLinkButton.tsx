"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";

/** Copies `url` and confirms in a toast. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const d = useT().common.share;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(d.linkCopied, { description: d.pasteLink });
    } catch {
      toast.error(d.copyFailed);
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <Link2 className="size-4" strokeWidth={2} aria-hidden="true" />
      {d.copyLink}
    </button>
  );
}
