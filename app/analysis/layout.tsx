import type { Metadata } from "next";
import { openGraphBase } from "@/lib/share";

// Metadata for the /analysis index, which is a client page and cannot export it itself.
const title = "IPO Analysis - Every Prospectus, Scored";
const description =
  "Scored analysis of every Indian mainboard and SME IPO: fundamentals, risks, financials, GMP and key dates, read from the RHP/DRHP.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/analysis" },
  openGraph: { ...openGraphBase(), title, description, url: "/analysis" },
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
