import { fill, LANG_TAG, plural, type Locale } from "@/lib/i18n/locales";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";
import type { Dictionary } from "@/messages";

const shortName = (name: string) => name.replace(/\s+(?:Ltd|Limited)\.?$/i, "").replace(/\.$/, "");

/** One sentence naming every IPO on the list and the parent to hold, for the hero and the meta description. */
export function listSummary(ipos: QuotaIpo[], { quota: d, common }: Dictionary, lang: Locale) {
  if (ipos.length === 0) return d.summary.none;
  const names = ipos.map((ipo) => fill(d.summary.item, { name: shortName(ipo.name), parents: ipo.parents.map(shortName).join(` ${common.or} `) }));
  const list = new Intl.ListFormat(LANG_TAG[lang], { type: "conjunction" }).format(names);
  return fill(plural(d.summary.sentence, ipos.length), { list });
}
