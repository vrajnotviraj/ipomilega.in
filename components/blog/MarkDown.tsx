import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { Element, ElementContent } from "hast";
import { headingIds } from "@/components/blog/headings";

const textOf = (node: Element | ElementContent): string =>
  node.type === "text" ? node.value : "children" in node ? node.children.map(textOf).join("") : "";

/** Site-relative or ipomilega.in links stay in the tab; everything else opens a new one. */
const isInternal = (href?: string) => !!href && /^(\/(?!\/)|#|https:\/\/(www\.)?ipomilega\.in(\/|$))/.test(href);

type HeadingProps = { children?: React.ReactNode; node?: Element };

/** Renders a blog post's markdown with the site's type styles, at a readable line length. */
export default function MarkdownRenderer({ content }: { content: string }) {
  // One id counter per render, in document order, so the ids match `headingsOf` in headings.ts.
  const idFor = headingIds();
  const idOf = (node?: Element) => (node ? idFor(textOf(node)) : undefined);
  const sectionHeading = ({ children, node }: HeadingProps) => (
    <h2 id={idOf(node)} className="mt-12 mb-4 scroll-mt-24 font-display text-2xl font-bold leading-[1.15] tracking-[-0.03em] text-balance sm:text-3xl">
      {children}
    </h2>
  );

  return (
    <div className="text-base leading-[1.55] text-foreground [&_img]:max-w-full [&_img]:rounded-lg [&>*:first-child]:mt-0 [&>:is(p,ul,ol,blockquote,h2,h3)]:max-w-[70ch]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Raw HTML is allowed but sanitized: no scripts, handlers or iframes.
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // The page title is the only h1, so an h1 inside the post body becomes a section heading.
          h1: sectionHeading,
          h2: sectionHeading,
          h3: ({ children, node }) => (
            <h3 id={idOf(node)} className="mt-8 mb-3 scroll-mt-24 font-display text-lg font-bold tracking-[-0.015em] text-balance sm:text-xl">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5 text-pretty">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-5 marker:text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-5 marker:font-mono marker:text-muted-foreground">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-lg bg-secondary px-5 py-3 text-muted-foreground">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              {...(isInternal(href) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => (
            <code className={className ?? "rounded-lg bg-secondary px-1.5 py-0.5 font-mono text-[0.9em]"}>{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-lg bg-secondary p-4 font-mono text-sm [&>code]:bg-transparent! [&>code]:p-0!">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-border bg-secondary p-3 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border p-3 tabular-nums">{children}</td>,
          hr: () => <hr className="my-10 border-border" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="not-italic highlight">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
