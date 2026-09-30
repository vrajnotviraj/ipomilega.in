import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

/** Renders a blog post's markdown with the site's type styles, at a readable line length. */
export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="max-w-[65ch] text-base leading-[1.55] text-foreground [&_img]:max-w-full [&_img]:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Raw HTML is allowed but sanitized: no scripts, handlers or iframes.
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className="mb-6 scroll-mt-24 border-b border-border pb-4 text-4xl font-bold tracking-[-0.03em]">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-10 mb-4 scroll-mt-24 text-3xl font-bold tracking-[-0.03em] leading-[1.1]">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-8 mb-3 scroll-mt-24 text-xl font-bold tracking-[-0.015em]">{children}</h3>,
          p: ({ children }) => <p className="mb-4">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-inside list-disc space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-inside list-decimal space-y-2">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-lg bg-secondary px-5 py-3 text-muted-foreground">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
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
