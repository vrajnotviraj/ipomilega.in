import type { QuotaIpo, QuotaStage } from "@/lib/queries/shareholder-quota";

export const RULES = [
  { label: "Parent shares you need", value: "1" },
  { label: "Shareholder bid at cut-off", value: "₹2 lakh" },
  { label: "Quota, at most", value: "10% of issue" },
  { label: "Eligibility date", value: "RHP date" },
];

export const STEPS = [
  {
    title: "Hold one share of the parent",
    body: "A single share of the listed parent is usually enough. The RHP sets the exact rule, so check it for each IPO.",
  },
  {
    title: "Have it in demat by the RHP date",
    body: "Eligibility is fixed on the date of the red herring prospectus, often about a week before the IPO opens. Buy at least a day before so the trade settles.",
  },
  {
    title: "Apply in the shareholder category",
    body: "Bid up to ₹2 lakh as a shareholder. You can still apply as retail or HNI too, and the two are not counted as multiple bids.",
  },
  {
    title: "A separate pool to be allotted from",
    body: "The quota, up to 10% of the issue, is allotted only among eligible shareholders. That pool is apart from retail, not instead of it.",
  },
];

export const FAQS = [
  {
    q: "What is a shareholder quota in an IPO?",
    a: "When a listed company takes a subsidiary or group company public, the IPO can set aside up to 10% of the issue for the listed parent's shareholders. Only people who hold the parent's shares on the eligibility date can bid in that portion.",
  },
  {
    q: "When do I need to own the parent's shares?",
    a: "On the date of the red herring prospectus (RHP), or the record date the RHP names. The shares must be in your demat account by then, so a purchase on that day may be too late.",
  },
  {
    q: "Can the shareholder quota be dropped?",
    a: "Yes. A draft offer document (DRHP) can change before the final RHP, and a company that only announced an IPO has not committed to anything yet. That is why each IPO here shows its stage and a link to its offer document.",
  },
  {
    q: "How is this list made?",
    a: "We check offer documents filed with SEBI, NSE and BSE every day for a shareholder reservation and the parent it names. IPOs drop off once they list, or when a SEBI approval lapses without dates.",
  },
];

// Weakest stage first, the order the stage track runs in.
export const STAGE_TRACK: { stage: QuotaStage; name: string }[] = [
  { stage: "announced", name: "Announced" },
  { stage: "filed", name: "DRHP filed" },
  { stage: "approved", name: "SEBI approved" },
  { stage: "dates", name: "Dates set" },
];

export const STAGE_NOTE: Record<QuotaStage, string> = {
  dates: "The RHP is out, so the eligibility date may already have passed. Check the RHP before you buy the parent.",
  approved: "SEBI has cleared the draft. Dates usually follow within months. Hold the parent before the RHP date.",
  filed: "The draft offer document has a shareholder quota. It is waiting for SEBI's approval.",
  announced: "The quota comes from the company's announcement. There is no offer document yet, so it could still change.",
};

const shortName = (name: string) => name.replace(/\s+(?:Ltd|Limited)\.?$/i, "").replace(/\.$/, "");

const joinNames = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/** One sentence naming every IPO on the list and its parent, e.g. "Jio Platforms (Reliance Industries) and ...". */
export function listSummary(ipos: QuotaIpo[]) {
  if (ipos.length === 0) return "No upcoming IPO has a shareholder quota right now.";
  const names = ipos.map((ipo) => `${shortName(ipo.name)} (hold ${ipo.parents.map(shortName).join(" or ")})`);
  const count = ipos.length === 1 ? "1 upcoming IPO has" : `${ipos.length} upcoming IPOs have`;
  return `${count} a shareholder quota: ${joinNames(names)}.`;
}
