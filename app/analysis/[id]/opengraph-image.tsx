import { ImageResponse } from "next/og";
import { getAnalysisBySlug } from "@/lib/queries/ipos";
import { closingLine, gmpFigure, overallScoreOf } from "@/lib/seo/share";
import { formatIpoDate, getPriceBand, scoreBand, type ScoreBand } from "@/lib/ipo-format";
import { BrandMark, CHALK, INK, MUTED, OG_SIZE } from "@/lib/seo/og";
import RootImage from "@/app/opengraph-image";

// Per-IPO preview card: company, score, GMP and dates. Our brand only, never the issuer's logo,
// so it does not read as if the company published it.
export const alt = "IPO analysis on IPO Milega";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

// The default OG font has no ₹ glyph (it renders as a box), so money reads "Rs" on the card.
const rupees = (value: string) => value.replace(/₹\s*/g, "").replace(/^(?=\d)/, "Rs ");

// Satori cannot read CSS variables, so the C1 surface and score colours are spelled out here.
const SURFACE = "#EEF1EA";
const SCORE_HEX: Record<ScoreBand, string> = { bad: "#B8452F", mid: "#94620C", good: "#1C7A4E" };

export default async function AnalysisOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnalysisBySlug(id);
  if (!data) return RootImage();

  const { ipos_analysis: analysis, ipo } = data;
  const score = overallScoreOf(analysis);
  const gmp = gmpFigure(analysis.gmp_price_gain ?? ipo?.gmp_price_gain);
  const status = closingLine(analysis.time?.issue_dates?.closing, analysis.time?.issue_dates?.opening)?.replace(/\.$/, "");
  const listing = formatIpoDate(ipo?.ipo_dates?.ipo_listing_date);

  const facts: [string, string][] = [
    ["GMP", gmp],
    ["Price band", getPriceBand(analysis.ipo_details) ?? "TBA"],
    ["Lists", listing ?? "TBA"],
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: CHALK, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BrandMark size={56} />
          <div style={{ display: "flex", gap: 8, fontSize: 34, letterSpacing: -1 }}>
            <span style={{ fontWeight: 700 }}>IPO</span>
            <span>Milega</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 64, gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{`${analysis.company_name} IPO`}</div>
            {status && <div style={{ marginTop: 20, fontSize: 32, color: MUTED }}>{status}</div>}
          </div>
          {score > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 132, fontWeight: 700, color: SCORE_HEX[scoreBand(score)], lineHeight: 1 }}>{score.toFixed(1)}</span>
                <span style={{ fontSize: 44, color: MUTED }}>/10</span>
              </div>
              <div style={{ fontSize: 24, color: MUTED, letterSpacing: 2 }}>OUR SCORE</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", marginTop: "auto", gap: 24 }}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 28px", borderRadius: 18, background: SURFACE }}>
              <div style={{ fontSize: 22, color: MUTED, letterSpacing: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 6 }}>{label === "Lists" ? value : rupees(value)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
