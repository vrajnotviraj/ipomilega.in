import { ImageResponse } from "next/og";
import { getBlogBySlug } from "@/lib/queries/blogs";
import { publishedAtOf } from "@/lib/seo/news-sitemap";
import { BrandMark, CHALK, INK, MARIGOLD, MUTED, OG_SIZE } from "@/lib/seo/og";
import { formatBlogDate, readTimeOf } from "@/components/blog/blog-format";
import RootImage from "@/app/opengraph-image";

// Per-article preview card: category, title, date and read time on the C1 chalk. WhatsApp, X and LinkedIn
// show it as the large link preview. Engine articles have no cover image, so this is their only picture.
export const alt = "Article on IPO Milega";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 600;

// The default OG font has no ₹ glyph (it renders as a box), so money reads "Rs" on the card.
const rupees = (text: string) => text.replace(/₹\s*/g, "Rs ");

export default async function BlogOgImage({ params }: { params: Promise<{ id: string }> }) {
  const blog = await getBlogBySlug((await params).id);
  if (!blog) return RootImage();

  const title = rupees(blog.title);
  const published = formatBlogDate(publishedAtOf(blog));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: CHALK, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMark size={56} />
            <div style={{ display: "flex", gap: 8, fontSize: 34, letterSpacing: -1 }}>
              <span style={{ fontWeight: 700 }}>IPO</span>
              <span>Milega</span>
            </div>
          </div>
          {blog.category && (
            <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: INK, color: CHALK, fontSize: 26 }}>{blog.category}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: title.length > 70 ? 60 : 72, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>{title}</div>
          <div style={{ width: 150, height: 8, marginTop: 28, borderRadius: 4, background: MARIGOLD }} />
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: MUTED }}>
            {`${blog.author} · ${published} · ${readTimeOf(blog)} min read`}
          </div>
        </div>
      </div>
    ),
    size
  );
}
