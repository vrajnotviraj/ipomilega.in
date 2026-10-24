import "server-only";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";
import { DICTIONARIES, type Dictionary } from "@/messages";

// One box per request, so two requests in different languages never see each other's choice.
const requestLocale = cache(() => ({ current: DEFAULT_LOCALE as Locale }));

/** Called first in every layout, page and generateMetadata under app/[lang]. Returns the language the route param names. */
export const setLocale = (param: string): Locale => {
  const locale = isLocale(param) ? param : DEFAULT_LOCALE;
  requestLocale().current = locale;
  return locale;
};

export const locale = () => requestLocale().current;

/** This request's dictionary, for server components. Client components use useT(). */
export const t = (): Dictionary => DICTIONARIES[locale()];
