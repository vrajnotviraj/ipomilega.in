// Shared pieces of the link-preview cards (app/opengraph-image.tsx and the per-IPO one under
// app/analysis/[id]). Satori renders these, so styles are inline and every div sets display.
export const OG_SIZE = { width: 1200, height: 630 };
export const INK = "#201C16";
export const TEAL = "#1F4E5C";
export const CREAM = "#F5F2EA";

/** The approved ring mark from public/logo/, drawn inline. */
export function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
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
  );
}
