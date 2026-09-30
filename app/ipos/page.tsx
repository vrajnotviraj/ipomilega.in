import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { getIpoBuckets } from "@/lib/queries/ipos";
import IposClient from "@/components/ipos/IposClient";
import { toRows } from "@/components/ipos/rows";

export const revalidate = 60;

const title = "All IPOs: live, upcoming and listed";
const description = "Browse every mainboard and SME IPO: price bands, issue sizes, key dates and analysis scores. Filter by status and type.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ipos" },
  openGraph: { ...openGraphBase(), title, description, url: "/ipos" },
};

export default async function IposPage() {
  // Rows carry "days from today" figures, so they are built here rather than in the client.
  const rows = toRows(await getIpoBuckets());
  return <IposClient rows={rows} />;
}
