import type { Category } from "@/lib/ipo-planner/ipo";

export const CATEGORY_LABEL: Record<Category, string> = { retail: "Retail", shni: "S-HNI" };

/** "26%", "<1%" or "100%". */
export function percent(chance: number): string {
  if (chance >= 0.995) return "100%";
  if (chance > 0 && chance < 0.01) return "<1%";
  return `${Math.round(chance * 100)}%`;
}

/** "1 in 38". */
export const oneIn = (odds: number) => `1 in ${Math.max(1, Math.round(1 / odds)).toLocaleString("en-IN")}`;

/** "Account 2" or "Accounts 1–3". */
export const accountRange = (accounts: number[]) =>
  accounts.length === 1 ? `Account ${accounts[0]}` : `Accounts ${accounts[0]}–${accounts[accounts.length - 1]}`;

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">{children}</h3>;
}
