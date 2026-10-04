import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

const shortName = (name: string) => name.replace(/\s+(?:Ltd|Limited)\.?$/i, "").replace(/\.$/, "");
const andList = new Intl.ListFormat("en-GB", { type: "conjunction" });

/** One sentence naming every IPO on the list and the parent to hold, for the hero and the meta description. */
export function listSummary(ipos: QuotaIpo[]) {
  if (ipos.length === 0) return "No upcoming IPO has a shareholder quota right now.";
  const names = ipos.map((ipo) => `${shortName(ipo.name)} (hold ${ipo.parents.map(shortName).join(" or ")})`);
  const count = ipos.length === 1 ? "1 upcoming IPO has" : `${ipos.length} upcoming IPOs have`;
  return `${count} a shareholder quota: ${andList.format(names)}.`;
}
