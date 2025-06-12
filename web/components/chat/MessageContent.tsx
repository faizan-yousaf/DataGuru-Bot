import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageContentProps {
  content: string;
}

const markdownComponents: Components = {
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2">
        <code className="text-sm font-mono" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
};

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};