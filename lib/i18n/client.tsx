"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/messages";

const LocaleContext = createContext<{ locale: Locale; dictionary: Dictionary } | null>(null);

/** Gives client components the page's language and dictionary. Rendered once by app/[lang]/layout.tsx. */
export function LocaleProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, dictionary }}>{children}</LocaleContext.Provider>;
}

function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is missing above this component");
  return context;
}

export const useLocale = () => useLocaleContext().locale;

/** This page's dictionary, for client components. Server components use t(). */
export const useT = () => useLocaleContext().dictionary;
