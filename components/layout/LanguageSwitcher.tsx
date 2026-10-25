"use client";

import { usePathname } from "next/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { bareSitePath, LANG_TAG, LANGUAGE_NAMES, LOCALES, localePath } from "@/lib/i18n/locales";

/** The same page in each language, as a pill strip with the current one raised. Plain links, so crawlers follow them. */
export function LanguageSwitcher() {
  const current = useLocale();
  const path = bareSitePath(usePathname());
  const label = useT().common.languages;

  return (
    <nav aria-label={label} className="flex rounded-full bg-secondary p-0.5">
      {LOCALES.map((locale) => (
        <a
          key={locale}
          href={localePath(locale, path)}
          hrefLang={LANG_TAG[locale]}
          lang={LANG_TAG[locale]}
          title={LANGUAGE_NAMES[locale].full}
          aria-label={LANGUAGE_NAMES[locale].full}
          aria-current={locale === current ? "true" : undefined}
          onClick={(e) => {
            if (location.search) {
              e.preventDefault();
              location.assign(e.currentTarget.href + location.search);
            }
          }}
          className={cn(
            "grid min-h-8 min-w-9 place-items-center rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground press aria-[current]:bg-card aria-[current]:text-foreground aria-[current]:shadow-(--shadow-card)",
            // A label in another page's script uses the system font, so this page skips that script's web font.
            locale !== current && locale !== "en" && "font-[family-name:system-ui,sans-serif]"
          )}
        >
          {LANGUAGE_NAMES[locale].short}
        </a>
      ))}
    </nav>
  );
}
