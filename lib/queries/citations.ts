// Gemini source markers like "[cite_start]" and "[cite: 2, 5]", with the whitespace before them,
// so "growth [cite: 1]." reads "growth.".
const CITATION_MARKER = /\s*\[cite(?:_start|_end|\s*:\s*[\d,\s-]*)\]/gi;

/** Returns a copy of `value` with citation markers removed from every string inside it. */
export function stripCitations<T>(value: T): T {
  if (typeof value === "string") return value.replace(CITATION_MARKER, "") as T;
  if (Array.isArray(value)) return value.map(stripCitations) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripCitations(v)])
    ) as T;
  }
  return value;
}
