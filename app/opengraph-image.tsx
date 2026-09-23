import { ImageResponse } from "next/og";

// Link-preview card for every page (WhatsApp, X, LinkedIn, iMessage). Drawn from the approved
// ring mark in public/logo/ rather than the old public/og-image.png, which still carried the
// retired bar-chart logo and weighed 1.5MB -- over WhatsApp's ~600KB cut-off, so shared links
// often arrived with no image at all. This renders to a PNG of a few tens of KB.
export const alt = "IPO Milega - Prospectus analysis for every Indian IPO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#201C16";
const TEAL = "#1F4E5C";
const CREAM = "#F5F2EA";

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
        <svg width="220" height="220" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill={TEAL} />
          <g
            transform="translate(7.31 7.31) scale(1.0286)"
            fill="none"
            stroke={CREAM}
            strokeWidth="2.43"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="24" cy="24" r="17.5" />
            <polyline points="10.5,30.75 19.3,22 26,28.7 37.5,17.25" />
            <polyline points="29.4,17.25 37.5,17.25 37.5,25.35" />
          </g>
        </svg>
        <div style={{ marginTop: 48, fontSize: 84, fontWeight: 700, letterSpacing: 6, color: INK }}>
          IPO MILEGA
        </div>
        <div style={{ marginTop: 12, fontSize: 34, color: TEAL }}>Prospectus analysis for every Indian IPO</div>
      </div>
    ),
    size
  );
}
