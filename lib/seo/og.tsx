// Shared pieces of the link-preview cards. Satori renders them, so styles are inline and every div sets display.
export const OG_SIZE = { width: 1200, height: 630 };
export const INK = "#0F3B2E";
export const CHALK = "#FAFAF6";
export const MARIGOLD = "#F0A92E";
export const MUTED = "#5E6B63";

/** The app icon from public/logo/app-icon.svg: ink tile, chalk candles, marigold breakout candle. */
export function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill={INK} />
      <rect x="12" y="20" width="10" height="26" rx="2.5" fill={CHALK} />
      <rect x="27" y="31" width="10" height="11" rx="2.5" fill={CHALK} />
      <rect x="42" y="15" width="10" height="31" rx="2.5" fill={MARIGOLD} />
    </svg>
  );
}
