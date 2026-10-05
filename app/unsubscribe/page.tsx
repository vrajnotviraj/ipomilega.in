import { Metadata } from "next";
import { UnsubscribeStatus } from "@/components/subscribe/UnsubscribeStatus";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/** Where the mail's unsubscribe link lands: it turns the channel off on load and says so. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; c?: string }> }) {
  const { t = "", c = "email" } = await searchParams;
  return (
    <div className="app-container pt-24 sm:pt-28">
      <section className="mx-auto max-w-md py-12 sm:py-16">
        <UnsubscribeStatus token={t} channel={c === "wa" ? "wa" : "email"} />
      </section>
    </div>
  );
}
