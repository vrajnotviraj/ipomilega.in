import type { Locale } from "@/lib/i18n/locales";
import en from "./en";
import hi from "./hi";
import gu from "./gu";

/** Every key the site shows, typed from the English files. Hindi and Gujarati must match this shape. */
export type Dictionary = typeof en;

export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, gu };
