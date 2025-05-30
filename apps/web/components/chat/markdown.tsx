import Link from "next/link";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BusinessMarkdown = ({ children }: { children: string }) => {
  const components = {
    a: ({ node, children, ...props }: any) => (
      <Link
        className="text-blue-600 underline hover:text-blue-800"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    ),
    table: ({ node, ...props }: any) => (
      <table className="min-w-full border border-border my-4" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th className="border border-border px-3 py-2 bg-muted font-semibold" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="border border-border px-3 py-2" {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4" {...props} />
    ),
    img: ({ node, ...props }: any) => (
      <img className="rounded-md my-4 max-w-full" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc ml-6 my-2" {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal ml-6 my-2" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="mb-1" {...props} />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold" {...props} />
    ),
    em: ({ node, ...props }: any) => (
      <em className="italic" {...props} />
    ),
    h1: ({ node, ...props }: any) => (
      <h1 className="text-4xl font-semibold mt-10 mb-4" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-2xl font-semibold mt-8 mb-3" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props} />
    ),
    h4: ({ node, ...props }: any) => (
      <h4 className="text-lg font-medium mt-4 mb-2" {...props} />
    ),
    h5: ({ node, ...props }: any) => (
      <h5 className="text-base font-medium mt-3 mb-1" {...props} />
    ),
    h6: ({ node, ...props }: any) => (
      <h6 className="text-sm font-normal mt-2 mb-1" {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p className="mb-4 leading-7" {...props} />
    ),
    code: ({ node, inline, className, children, ...props }: any) => (
      inline ? (
        <code className="px-1 py-0.5 bg-muted/50 rounded text-sm font-mono" {...props}>{children}</code>
      ) : (
        <pre className="overflow-x-auto bg-muted/50 rounded-md border p-4 text-sm font-mono my-4" {...props}>
          <code>{children}</code>
        </pre>
      )
    ),
    hr: ({ node, ...props }: any) => (
      <hr className="my-8 border-border" {...props} />
    ),
  };

  return (
    <div className="markdoc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = React.memo(
  BusinessMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);