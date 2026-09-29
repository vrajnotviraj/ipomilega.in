import { Metadata } from "next";
import { openGraphBase } from "@/lib/share";
import { getIpoBuckets } from "@/lib/queries/ipos";
import IposClient from "./IposClient";

export const revalidate = 60;

const title = "All IPOs - Live, Upcoming & Listed";
const description = "Browse every mainboard and SME IPO: price bands, issue sizes, key dates and analysis scores. Filter by status and type.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ipos" },
  openGraph: { ...openGraphBase(), title, description, url: "/ipos" },
};

export default async function IposPage() {
  const { upcoming, live, past } = await getIpoBuckets();
  return <IposClient upcoming={upcoming} live={live} past={past} />;
}
