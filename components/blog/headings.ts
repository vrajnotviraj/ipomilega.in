// Heading anchors for blog posts. The "On this page" list (headingsOf, from raw markdown) and MarkdownRenderer
// (from the rendered heading text) must produce the same ids; headings.check.mjs guards that. No imports, so the check runs under plain node.

/** "Risks to watch" -> "risks-to-watch". Emphasis markers and punctuation collapse into the dashes, so raw and rendered text agree. */
const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Hands out heading ids in document order; a repeated heading gets "-2", "-3". */
export function headingIds() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text) || "section";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

/**
 * The post's section headings with the ids MarkdownRenderer gives them. The renderer shows `#` and `##` as sections,
 * so both are listed; `###` is counted but not listed, so repeated text numbers the same way on both sides.
 */
export function headingsOf(content: string): { id: string; text: string }[] {
  const idFor = headingIds();
  const body = content.replace(/^(```|~~~)[\s\S]*?^\1/gm, "");
  const sections: { id: string; text: string }[] = [];
  for (const [, hashes, raw] of body.matchAll(/^(#{1,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)) {
    const text = raw.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    const id = idFor(text);
    if (hashes.length <= 2) sections.push({ id, text: text.replace(/(\*\*|__|\*|_|`)(.+?)\1/g, "$2") });
  }
  return sections;
}
