import type { Category } from "@/lib/ipo/planner/ipo";

export const CATEGORY_LABEL: Record<Category, string> = { retail: "Retail", shni: "S-HNI", bhni: "B-HNI", shareholder: "Shareholder" };

/** "26%", "<1%" or "100%". */
export function percent(chance: number): string {
  if (chance >= 0.995) return "100%";
  if (chance > 0 && chance < 0.01) return "<1%";
  return `${Math.round(chance * 100)}%`;
}

/** "1 in 38". */
export const oneIn = (odds: number) => `1 in ${Math.max(1, Math.round(1 / odds)).toLocaleString("en-IN")}`;

/** "38,512", "4.2 lakh", "1,300 crore" or "4 lakh crore": Indian words once the digits get long. */
export function countInWords(count: number): string {
  const grouped = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: n < 10 ? 1 : 0 });
  if (count >= 1e12) return `${grouped(count / 1e12)} lakh crore`;
  if (count >= 1e7) return `${grouped(count / 1e7)} crore`;
  if (count >= 1e5) return `${grouped(count / 1e5)} lakh`;
  return grouped(Math.round(count));
}

/** "Account 2" or "Accounts 1–3". */
export const accountRange = (accounts: number[]) =>
  accounts.length === 1 ? `Account ${accounts[0]}` : `Accounts ${accounts[0]}–${accounts[accounts.length - 1]}`;

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">{children}</h3>;
}
