import type { Author, Blog } from "@/types/ipo";
import { SITE_NAME, SITE_URL } from "@/lib/seo/share";
import { publishedAtOf } from "@/lib/seo/news-sitemap";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const RESEARCH_AUTHOR = "IPO Milega Research";

/** A JSON-LD script tag, with `<` escaped so the data can't close the tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const SITE_DESCRIPTION = "Live, upcoming and past Indian IPOs with GMP, subscription, allotment dates and a scored analysis of every prospectus.";

/** The research desk as an article author, linked to /about. */
export const researchAuthor = { "@type": "Organization", name: RESEARCH_AUTHOR, url: `${SITE_URL}/about` };

/** The publisher and the site, once for every page. */
export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
      description: SITE_DESCRIPTION,
      sameAs: ["https://x.com/ipomilega"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["IPOMilega", "ipomilega.in"],
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en-IN",
    },
  ],
};

export type Crumb = { name: string; href: string };

/** A BreadcrumbList for the given trail of site paths. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href === "/" ? "" : crumb.href}`,
    })),
  };
}

/** The blog index as a CollectionPage whose ItemList is the posts shown on it, newest first. */
export function blogIndexJsonLd({ name, description, posts }: { name: string; description: string; posts: { slug: string; title: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_URL}/blogs`,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blogs/${post.slug}`,
        name: post.title,
      })),
    },
  };
}

/** A BlogPosting for one post. The research desk is an Organization; a writer is a Person, linked to their page when they have one. */
export function articleJsonLd(blog: Blog) {
  const url = `${SITE_URL}/blogs/${blog.slug}`;
  const author =
    blog.author === RESEARCH_AUTHOR
      ? researchAuthor
      : { "@type": "Person", name: blog.author, ...(blog.author_slug && { url: `${SITE_URL}/authors/${blog.author_slug}` }) };

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.meta_description,
    image: blog.image_url ? [blog.image_url] : [`${url}/opengraph-image`],
    datePublished: publishedAtOf(blog),
    dateModified: blog.updated_at || blog.created_at,
    author,
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

/** A ProfilePage for a writer. */
export function authorJsonLd(author: Author) {
  const url = `${SITE_URL}/authors/${author.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "Person",
      name: author.name,
      url,
      ...(author.bio && { description: author.bio }),
      worksFor: { "@id": ORGANIZATION_ID },
    },
  };
}
