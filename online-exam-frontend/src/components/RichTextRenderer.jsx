import React from "react";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const RichTextRenderer = ({ content }) => {
  if (!content) return null;

  // Simple regex to find $...$ for inline and $$...$$ for block math
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

  return (
    <div className="rich-text-content prose max-w-none prose-slate">
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
        } else {
          return (
            <div
              key={index}
              className="inline"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }}
            />
          );
        }
      })}
    </div>
  );
};

export default RichTextRenderer;
