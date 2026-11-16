import { locale } from "@/lib/i18n/server";

/** Mono for an English figure such as "1" or "₹2 lakh", the display face for words and for Hindi and Gujarati (DM Mono has no glyphs for them). */
export const figureFont = (text: string) =>
  locale() === "en" && /^[\d₹]/.test(text) ? "font-mono font-medium tracking-[-0.03em]" : "font-display font-bold tracking-[-0.015em]";
