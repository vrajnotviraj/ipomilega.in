import { fill } from "@/lib/i18n/locales";

/** "26%", "<1%" or "100%". */
export function percent(chance: number): string {
  if (chance >= 0.995) return "100%";
  if (chance > 0 && chance < 0.01) return "<1%";
  return `${Math.round(chance * 100)}%`;
}

/** "1 in 38", from the "1 in {n}" template. */
export const oneIn = (odds: number, template: string) => fill(template, { n: Math.max(1, Math.round(1 / odds)).toLocaleString("en-IN") });

/** "38,512", "4.2 lakh", "1,300 crore" or "4 lakh crore": Indian words once the digits get long. */
export function countInWords(count: number, units: { lakh: string; crore: string; lakhCrore: string }): string {
  const grouped = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: n < 10 ? 1 : 0 });
  if (count >= 1e12) return `${grouped(count / 1e12)} ${units.lakhCrore}`;
  if (count >= 1e7) return `${grouped(count / 1e7)} ${units.crore}`;
  if (count >= 1e5) return `${grouped(count / 1e5)} ${units.lakh}`;
  return grouped(Math.round(count));
}

/** "Account 2" or "Accounts 1–3", from the "Account {n}" and "Accounts {from}–{to}" templates. */
export const accountRange = (accounts: number[], words: { account: string; accounts: string }) =>
  accounts.length === 1 ? fill(words.account, { n: accounts[0] }) : fill(words.accounts, { from: accounts[0], to: accounts[accounts.length - 1] });

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">{children}</h3>;
}
