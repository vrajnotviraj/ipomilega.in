import { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/seo/share";
import { EmailIpo, renderWelcomeEmail } from "@/lib/email/welcome-email";

export const dynamic = "force-dynamic";

// Sample rows covering each state the mail draws: gain and loss GMP, closing today, no score, SME.
const SAMPLE_LIVE: EmailIpo[] = [
  { name: "Lenskart Solutions", url: `${SITE_URL}/ipos`, board: "Mainboard", priceBand: "₹382-402", gmp: 12.4, subscribed: 28.3, dateLabel: "Closes Today", closingToday: true, score: 7.2 },
  { name: "Orkla India", url: `${SITE_URL}/ipos`, board: "Mainboard", priceBand: "₹695-730", gmp: -2.1, subscribed: 1.4, dateLabel: "Closes 8 Oct", closingToday: false, score: 4.6 },
  { name: "Shreeji Shipping Global", url: `${SITE_URL}/ipos`, board: "SME", priceBand: "₹240-252", gmp: null, subscribed: null, dateLabel: "Closes 9 Oct", closingToday: false, score: null },
];
const SAMPLE_UPCOMING: EmailIpo[] = [
  { name: "Pine Labs", url: `${SITE_URL}/ipos`, board: "Mainboard", priceBand: "₹210-221", gmp: 6.8, subscribed: null, dateLabel: "Opens 12 Oct", closingToday: false, score: 6.4 },
];

/**
 * The welcome mail in the browser, for design work. Not served in production.
 * `?live=0` previews the "Opening soon" version, `?name=Ravi` the greeting with a name, `?format=text` the plain-text part.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const params = req.nextUrl.searchParams;
  const mail = renderWelcomeEmail({
    name: params.get("name"),
    siteUrl: SITE_URL,
    unsubscribeUrl: `${SITE_URL}/unsubscribe?t=preview&c=email`,
    live: params.get("live") === "0" ? [] : SAMPLE_LIVE,
    upcoming: SAMPLE_UPCOMING,
  });

  if (params.get("format") === "text") {
    return new Response(`Subject: ${mail.subject}\n\n${mail.text}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
