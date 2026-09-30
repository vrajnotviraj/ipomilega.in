import { ImageResponse } from "next/og";
import { BrandMark, CHALK, INK, MARIGOLD, MUTED, OG_SIZE } from "@/lib/seo/og";

// Drawn rather than a static PNG so it stays under WhatsApp's ~600KB image limit.
export const alt = "IPO Milega - Prospectus analysis for every Indian IPO";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Link-preview card for every page: mark, wordmark and tagline on chalk. */
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
          background: CHALK,
          color: INK,
        }}
      >
        <BrandMark size={200} />
        <div style={{ display: "flex", marginTop: 48, fontSize: 96, letterSpacing: -3 }}>
          <span style={{ fontWeight: 900 }}>IPO</span>
          <span style={{ fontWeight: 500, marginLeft: 22 }}>Milega</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
          <div style={{ fontSize: 40, color: MUTED }}>Milega? Check first.</div>
          <div style={{ width: 150, height: 8, marginTop: 6, borderRadius: 4, background: MARIGOLD }} />
        </div>
      </div>
    ),
    size
  );
}
