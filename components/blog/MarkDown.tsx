import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';

export default function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Raw HTML is allowed but sanitized (no scripts, handlers or iframes); highlight runs after so its classes survive.
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 text-foreground border-b pb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-3xl font-semibold mb-4 mt-8 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-2xl font-semibold mb-3 mt-6 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 space-y-2 list-disc list-inside text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 space-y-2 list-decimal list-inside text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/30 rounded-r">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-muted p-3 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-border p-3">{children}</td>,
          hr: () => <hr className="my-8 border-border" />,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
