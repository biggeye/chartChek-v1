"use client"

import React from 'react';
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ReactNode, CSSProperties } from "react";

interface MarkdownProps {
  children: string
}

interface CustomCodeProps {
  node?: any; // The AST node from remark
  inline?: boolean;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties; // Use imported CSSProperties type
  [key: string]: any; // Allow other props like those from rehype
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: CustomCodeProps) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter
                // Cast to 'any' as a workaround for persistent type mismatch
                style={vscDarkPlus as any}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" {...props} />
              </div>
            )
          },
          th({ node, ...props }) {
            return <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-bold" {...props} />
          },
          td({ node, ...props }) {
            return <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
