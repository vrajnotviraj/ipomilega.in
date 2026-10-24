// Languages and paths. No runtime imports, so plain Node scripts can use it.

export const LOCALES = ["en", "hi", "gu"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** The language tag for <html lang>, hreflang and JSON-LD. */
export const LANG_TAG: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", gu: "gu-IN" };

export const OG_LOCALE: Record<Locale, string> = { en: "en_IN", hi: "hi_IN", gu: "gu_IN" };

/** Each language named in its own script: the short form for the header, the full one for labels. */
export const LANGUAGE_NAMES: Record<Locale, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  hi: { short: "हिं", full: "हिंदी" },
  gu: { short: "ગુ", full: "ગુજરાતી" },
};

/** "/ipos" in Hindi is "/hi/ipos"; English keeps the bare path. External links and anchors pass through. */
export const localePath = (locale: Locale, path: string) => {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/")) return path;
  return `/${locale}${path === "/" ? "" : path}`;
};

/** The path without its language prefix: "/hi/ipos" -> "/ipos". */
export const bareSitePath = (pathname: string) => pathname.replace(new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`), "") || "/";

/** Absolute hreflang URLs for one page in each language it exists in, plus x-default for the English one. */
export const languageAlternates = (path: string, siteUrl: string, locales: readonly Locale[] = LOCALES): Record<string, string> => ({
  ...Object.fromEntries(locales.map((locale) => [LANG_TAG[locale], `${siteUrl}${localePath(locale, path)}`])),
  "x-default": `${siteUrl}${path}`,
});

/** "Next opens {date}" with {date} filled in. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));

/** The one or other form of a counted phrase, with {count} filled in. */
export const plural = (forms: { one: string; other: string }, count: number) => fill(count === 1 ? forms.one : forms.other, { count });

/** Translated text by dotted path into the English document, e.g. { "title": "...", "risk_meter.key_risks.0": "..." }. */
export type TranslatedFields = Record<string, string>;

/** A copy of the English document with each translated field written over it. */
export function localize<T extends object>(doc: T, fields: TranslatedFields | null | undefined): T {
  const copy = structuredClone(doc);
  for (const [path, text] of Object.entries(fields ?? {})) setPath(copy, path, text);
  return copy;
}

function setPath(target: object, path: string, value: string) {
  const keys = path.split(".");
  const last = keys.pop()!;
  let node: Record<string, unknown> = target as Record<string, unknown>;
  for (const key of keys) {
    const next = node[key];
    if (!next || typeof next !== "object") return;
    node = next as Record<string, unknown>;
  }
  node[last] = value;
}
