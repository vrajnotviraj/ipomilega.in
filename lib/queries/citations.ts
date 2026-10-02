// Gemini source markers like "[cite_start]" and "[cite: 2, 5]", with the whitespace before them,
// so "growth [cite: 1]." reads "growth.".
const CITATION_MARKER = /\s*\[cite(?:_start|_end|\s*:\s*[\d,\s-]*)\]/gi;

/** Returns a copy of plain-JSON `value` with citation markers removed from every string inside it. */
export const stripCitations = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value), (_key, v) => (typeof v === "string" ? v.replace(CITATION_MARKER, "") : v));
