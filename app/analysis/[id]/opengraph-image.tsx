import { ImageResponse } from "next/og";
import { getAnalysisBySlug } from "@/lib/queries/ipos";
import { closingLine, formatDay, gmpLine, overallScoreOf } from "@/lib/share";
import { BrandMark, CREAM, INK, OG_SIZE, TEAL } from "@/lib/og";
import RootImage from "@/app/opengraph-image";

// Per-IPO preview card: the company, our score, GMP and where it stands in the calendar -- the
// facts someone deciding whether to tap a shared link wants. Still our brand, never the issuer's
// logo, so it doesn't read as if the company published it.
export const alt = "IPO analysis on IPO Milega";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

// "385 to 405 Per Share" -> "385–405", so it fits one line of the fact tile.
const shortPriceBand = (band: string | undefined) =>
  band?.trim() ? band.replace(/\s*per\s+share/i, "").replace(/(\d)\s*(?:to|-)\s*(\d)/i, "$1–$2") : null;

// The default OG font has no ₹ glyph (it renders as a box), so money reads "Rs" on the card.
const rupees = (value: string) => value.replace(/₹\s*/g, "").replace(/^(?=\d)/, "Rs ");

const scoreColor = (score: number) => (score <= 3 ? "#A83B32" : score <= 6 ? "#B8863A" : "#3D6B4F");

export default async function AnalysisOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnalysisBySlug(id);
  if (!data) return RootImage();

  const { ipos_analysis: analysis, ipo } = data;
  const score = overallScoreOf(analysis);
  const gmp = gmpLine(analysis.gmp_price_gain ?? ipo?.gmp_price_gain)?.replace(/^GMP /, "");
  const status =
    closingLine(analysis.time?.issue_dates?.closing, analysis.time?.issue_dates?.opening)?.replace(/\.$/, "") ?? null;
  const listing = formatDay(ipo?.ipo_dates?.ipo_listing_date);

  const facts: [string, string][] = [
    ["GMP", gmp ?? "N/A"],
    ["Price band", shortPriceBand(analysis.ipo_details?.price_band) ?? "TBA"],
    ["Lists", listing ?? "TBA"],
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: CREAM, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BrandMark size={56} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>IPO MILEGA</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 64, gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{`${analysis.company_name} IPO`}</div>
            {status && <div style={{ marginTop: 20, fontSize: 32, color: TEAL }}>{status}</div>}
          </div>
          {score > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 132, fontWeight: 700, color: scoreColor(score), lineHeight: 1 }}>{score.toFixed(1)}</span>
                <span style={{ fontSize: 44, color: TEAL }}>/10</span>
              </div>
              <div style={{ fontSize: 24, color: TEAL, letterSpacing: 2 }}>OUR SCORE</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", marginTop: "auto", gap: 24 }}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 28px", borderRadius: 16, background: "#EAE6DC" }}>
              <div style={{ fontSize: 22, color: TEAL, letterSpacing: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 6 }}>{label === "Lists" ? value : rupees(value)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
