// Analyses pasted from Gemini carry its source markers -- "[cite_start]" and
// "[cite: 1]" / "[cite: 2, 5]" -- which mean nothing on our page. The leading
// whitespace goes with the marker so "growth [cite: 1]." reads "growth.".
const CITATION_MARKER = /\s*\[cite(?:_start|_end|\s*:\s*[\d,\s-]*)\]/gi;

export const stripCitationText = (text: string): string =>
  text.replace(CITATION_MARKER, "");

/** Returns a copy of `value` with citation markers removed from every string inside it. */
export function stripCitations<T>(value: T): T {
  if (typeof value === "string") return stripCitationText(value) as T;
  if (Array.isArray(value)) return value.map(stripCitations) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripCitations(v)])
    ) as T;
  }
  return value;
}
