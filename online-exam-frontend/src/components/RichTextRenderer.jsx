import React, { useState } from "react";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const RichTextRenderer = ({ content }) => {
  const [preview, setPreview] = useState(null);

  if (!content) return null;

  // Simple regex to find $...$ for inline and $$...$$ for block math
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

  return (
    <div
      className="rich-text-content prose max-w-none prose-slate"
      onClick={(event) => {
        if (event.target?.tagName === "IMG") {
          setPreview({
            src: event.target.getAttribute("src"),
            alt: event.target.getAttribute("alt") || "Preview gambar soal",
          });
        }
      }}
    >
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
        } else {
          return (
            <div
              key={index}
              className="rich-text-html [&_img]:my-3 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-sm"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }}
            />
          );
        }
      })}
      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow"
            onClick={() => setPreview(null)}
          >
            Tutup
          </button>
          <img
            src={preview.src}
            alt={preview.alt}
            className="max-h-[90vh] max-w-[95vw] rounded-lg bg-white object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default RichTextRenderer;
