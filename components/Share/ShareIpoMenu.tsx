"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Link2, Mail, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  analysisUrl,
  buildShareMessage,
  plainShareMessage,
  type ShareFacts,
} from "@/lib/share";

interface ShareIpoMenuProps {
  facts: ShareFacts;
  className?: string;
  align?: "start" | "center" | "end";
}

/**
 * Pick who to send an IPO to; the message itself is fixed.
 *
 * Every channel gets the same copy out of `buildShareMessage` -- the details on
 * the analysis page, in the site's voice. Nothing here composes or edits text,
 * so a forwarded IPO always carries the same facts we published.
 */
export function ShareIpoMenu({ facts, className, align = "end" }: ShareIpoMenuProps) {
  const url = facts.url || analysisUrl(facts.slug);
  const message = buildShareMessage(facts);
  const plain = plainShareMessage(message);

  const openChannel = (target: string) => {
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Could not copy — please try again");
    }
  };

  const channels = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      onSelect: () => openChannel(`https://wa.me/?text=${encodeURIComponent(message)}`),
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: Send,
      // Telegram appends its own link preview, so the trailing link is dropped
      // from the text to avoid showing the URL twice.
      onSelect: () =>
        openChannel(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
            plain.replace(`Full analysis → ${url}`, "").trim()
          )}`
        ),
    },
    {
      key: "x",
      label: "X (Twitter)",
      icon: Share2,
      onSelect: () =>
        openChannel(`https://twitter.com/intent/tweet?text=${encodeURIComponent(plain)}`),
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      onSelect: () =>
        openChannel(
          `mailto:?subject=${encodeURIComponent(
            `${facts.companyName} IPO — details & analysis`
          )}&body=${encodeURIComponent(plain)}`
        ),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5", className)}>
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">Share IPO details</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Sends the {facts.companyName} details exactly as shown here.
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {channels.map(({ key, label, icon: Icon, onSelect }) => (
          <DropdownMenuItem key={key} onSelect={onSelect} className="cursor-pointer gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => copy(plain, "IPO details copied")}
          className="cursor-pointer gap-2"
        >
          <Copy className="h-4 w-4 text-muted-foreground" />
          Copy details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => copy(url, "Link copied")}
          className="cursor-pointer gap-2"
        >
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Copy link only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
