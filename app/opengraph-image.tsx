import { ImageResponse } from "next/og";
import { BrandMark, CREAM, INK, OG_SIZE, TEAL } from "@/lib/og";

// Link-preview card for every page (WhatsApp, X, LinkedIn, iMessage). Drawn from the approved
// ring mark in public/logo/ rather than the old public/og-image.png, which still carried the
// retired bar-chart logo and weighed 1.5MB -- over WhatsApp's ~600KB cut-off, so shared links
// often arrived with no image at all. This renders to a PNG of a few tens of KB.
export const alt = "IPO Milega - Prospectus analysis for every Indian IPO";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
        }}
      >
        <BrandMark size={220} />
        <div style={{ marginTop: 48, fontSize: 84, fontWeight: 700, letterSpacing: 6, color: INK }}>
          IPO MILEGA
        </div>
        <div style={{ marginTop: 12, fontSize: 34, color: TEAL }}>Prospectus analysis for every Indian IPO</div>
      </div>
    ),
    size
  );
}
