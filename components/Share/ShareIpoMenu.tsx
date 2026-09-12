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
import { parseCardDate } from "@/components/Home/ipoFormat";

// The IPO facts a share message is built from. Everything is optional except
// the company name -- rows with no value are dropped instead of printing "N/A",
// so a half-filled analysis still produces a clean message.
export interface ShareIpoDetails {
  companyName: string;
  status?: string;
  ipoType?: string;
  priceBand?: string;
  lotSize?: number | null;
  lotShares?: number | null;
  minInvestment?: number | null;
  issueSize?: string;
  openDate?: string;
  closeDate?: string;
  allotmentDate?: string;
  listingDate?: string;
  gmp?: string;
  score?: number;
  url: string;
}

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

// Dates reach us in whatever shape the scraper stored ("2026-09-10", "10 Sept
// 2026", ...). Normalise so a shared message never leaks a raw ISO string.
const fmtDate = (value?: string) => {
  const date = parseCardDate(value);
  if (!date) return clean(value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Both price band and GMP arrive with or without the rupee sign.
const rupee = (value: string) => (/^\d/.test(value) ? `₹${value}` : value);

const clean = (value?: string | null) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (["n/a", "na", "tbd", "tba", "-"].includes(trimmed.toLowerCase())) return "";
  return trimmed;
};

/**
 * The one and only share message. It is composed here and sent as-is to every
 * channel -- there is deliberately no editable draft anywhere in the UI, so a
 * shared analysis always carries the same IPO details we show on the page.
 */
export const buildShareMessage = (d: ShareIpoDetails): string => {
  const lines: string[] = [];

  const heading = [clean(d.status), clean(d.ipoType)].filter(Boolean).join(" · ");
  lines.push(`*${d.companyName} IPO*${heading ? ` — ${heading}` : ""}`);
  lines.push("");

  const priceBand = clean(d.priceBand);
  if (priceBand) lines.push(`Price band: ${rupee(priceBand)}`);

  // lotShares is shares per lot, which is what an applicant actually bids for;
  // lotSize alone is just the lot count and reads as "1" for most issues.
  if (d.lotShares) lines.push(`Lot size: ${d.lotShares} shares`);
  else if (d.lotSize) lines.push(`Lot size: ${d.lotSize}`);

  if (d.minInvestment) lines.push(`Min investment: ${inr(d.minInvestment)}`);

  const issueSize = clean(d.issueSize);
  if (issueSize) lines.push(`Issue size: ${issueSize}`);

  const open = fmtDate(d.openDate);
  const close = fmtDate(d.closeDate);
  if (open || close) lines.push(`Dates: ${[open, close].filter(Boolean).join(" — ")}`);

  const allotment = fmtDate(d.allotmentDate);
  if (allotment) lines.push(`Allotment: ${allotment}`);

  const listing = fmtDate(d.listingDate);
  if (listing) lines.push(`Listing: ${listing}`);

  const gmp = clean(d.gmp);
  if (gmp) lines.push(`GMP: ${rupee(gmp)}`);

  if (typeof d.score === "number" && !Number.isNaN(d.score)) {
    lines.push(`IPO Milega score: ${d.score.toFixed(1)}/10`);
  }

  lines.push("");
  lines.push(`Full analysis: ${d.url}`);

  return lines.join("\n");
};

// WhatsApp is the only channel that renders *bold*; strip the markers elsewhere.
const plain = (message: string) => message.replace(/\*/g, "");

interface ShareIpoMenuProps {
  details: ShareIpoDetails;
  className?: string;
  align?: "start" | "center" | "end";
}

export function ShareIpoMenu({ details, className, align = "end" }: ShareIpoMenuProps) {
  const message = buildShareMessage(details);
  const plainMessage = plain(message);

  const openChannel = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
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
      onSelect: () =>
        openChannel(
          `https://t.me/share/url?url=${encodeURIComponent(details.url)}&text=${encodeURIComponent(
            plain(message.replace(`\nFull analysis: ${details.url}`, "")).trim()
          )}`
        ),
    },
    {
      key: "x",
      label: "X (Twitter)",
      icon: Share2,
      onSelect: () =>
        openChannel(`https://twitter.com/intent/tweet?text=${encodeURIComponent(plainMessage)}`),
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      onSelect: () =>
        openChannel(
          `mailto:?subject=${encodeURIComponent(
            `${details.companyName} IPO — details & analysis`
          )}&body=${encodeURIComponent(plainMessage)}`
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
            Sends the full {details.companyName} details as shown here.
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
          onSelect={() => copy(plainMessage, "IPO details copied")}
          className="cursor-pointer gap-2"
        >
          <Copy className="h-4 w-4 text-muted-foreground" />
          Copy details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => copy(details.url, "Link copied")}
          className="cursor-pointer gap-2"
        >
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Copy link only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
