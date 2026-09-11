"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildShareMessage, type ShareFacts } from "@/lib/share";

/**
 * Opened at the moment someone is deciding whether to apply, which is exactly when they are most
 * likely to forward the issue to a friend.
 *
 * The draft opens in the sharer's voice -- a message that sounds like the person sending it gets
 * read, a templated one gets scrolled past -- and every line of it stays editable, so there is no
 * questionnaire to get through first. Nothing is posted anywhere until they pick a destination
 * and confirm in that app.
 */
export function ShareIpoModal({
  open,
  onClose,
  facts,
}: {
  open: boolean;
  onClose: () => void;
  facts: Omit<ShareFacts, "url">;
}) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  // Share the URL actually in the address bar (staging, a preview deploy) rather than a
  // hardcoded production link, but fall back to the canonical one during SSR.
  const [href, setHref] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const url = window.location.href;
    setHref(url);
    setMessage(buildShareMessage({ ...facts, url }));
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
    setCopied(false);
    // Re-seeding on every `facts` identity change would wipe the draft mid-edit; the dialog
    // opening is the only moment the draft should be reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openTarget = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const targets = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      onClick: () => openTarget(`https://wa.me/?text=${encodeURIComponent(message)}`),
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: Send,
      onClick: () =>
        openTarget(
          `https://t.me/share/url?url=${encodeURIComponent(href || "")}&text=${encodeURIComponent(message)}`
        ),
    },
    {
      key: "x",
      label: "X",
      icon: Share2,
      onClick: () => openTarget(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`),
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the text above instead");
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: `${facts.companyName} IPO`, text: message, url: href });
    } catch {
      // The person dismissed the sheet; nothing to report.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-semibold">Are you applying?</DialogTitle>
          <DialogDescription className="text-sm font-mono uppercase tracking-wide text-muted-foreground">
            Share it with your friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="share-message" className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Your message — edit it however you like
          </label>
          <Textarea
            id="share-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={9}
            className="text-sm leading-relaxed resize-none bg-muted/40"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {targets.map((t) => (
            <button
              key={t.key}
              onClick={t.onClick}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <t.icon className="h-4 w-4 text-muted-foreground" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2">
            {copied ? <Check className="h-4 w-4 text-score-good" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy message"}
          </Button>
          {canNativeShare && (
            <Button onClick={handleNativeShare} className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              More apps
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
