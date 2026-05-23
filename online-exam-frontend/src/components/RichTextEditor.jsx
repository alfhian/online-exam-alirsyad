import { useRef } from "react";
import {
  FaBold,
  FaImage,
  FaItalic,
  FaListOl,
  FaListUl,
  FaSquareRootAlt,
  FaTable,
  FaUnderline,
} from "react-icons/fa";
import RichTextRenderer from "./RichTextRenderer";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "2 MB";

const insertAtCursor = (text, insertText, selectionStart, selectionEnd) => {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  return `${before}${insertText.replace("{{selected}}", selected)}${after}`;
};

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Tulis konten di sini",
  minRows = 5,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const applyInsert = (template) => {
    const textarea = textareaRef.current;
    const currentValue = value || "";
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextValue = insertAtCursor(currentValue, template, start, end);

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + template.replace("{{selected}}", "").length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  const wrapSelection = (tag) => {
    applyInsert(`<${tag}>{{selected}}</${tag}>`);
  };

  const insertTable = () => {
    const table = `
<table>
  <tbody>
    <tr>
      <td>Kolom 1</td>
      <td>Kolom 2</td>
    </tr>
    <tr>
      <td>Isi</td>
      <td>Isi</td>
    </tr>
  </tbody>
</table>`;

    applyInsert(table);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      window.alert(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_LABEL}. Silakan kompres gambar terlebih dahulu.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      applyInsert(`<img src="${reader.result}" alt="Gambar soal" />`);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { label: "Bold", icon: FaBold, action: () => wrapSelection("strong") },
    { label: "Italic", icon: FaItalic, action: () => wrapSelection("em") },
    { label: "Underline", icon: FaUnderline, action: () => wrapSelection("u") },
    { label: "Bullet list", icon: FaListUl, action: () => applyInsert("<ul><li>{{selected}}</li></ul>") },
    { label: "Number list", icon: FaListOl, action: () => applyInsert("<ol><li>{{selected}}</li></ol>") },
    { label: "Rumus", icon: FaSquareRootAlt, action: () => applyInsert("${{selected}}$") },
    { label: "Pangkat", text: "x^2", action: () => applyInsert("$x^2$") },
    { label: "Akar", text: "sqrt", action: () => applyInsert("$\\sqrt{x}$") },
    { label: "Pecahan", text: "a/b", action: () => applyInsert("$\\frac{a}{b}$") },
    { label: "Tabel", icon: FaTable, action: insertTable },
    { label: "Gambar", icon: FaImage, action: () => fileInputRef.current?.click() },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              type="button"
              onClick={tool.action}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
              title={tool.label}
              aria-label={tool.label}
            >
              {Icon ? <Icon className="text-sm" /> : <span className="text-[10px] font-bold">{tool.text}</span>}
            </button>
          );
        })}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
        <p>
          Gambar maksimal {MAX_IMAGE_SIZE_LABEL}. Rumus memakai format LaTeX di antara tanda dollar:
          pangkat <code>$x^2$</code>, akar <code>$\sqrt&#123;x&#125;$</code>, pecahan <code>$\frac&#123;a&#125;&#123;b&#125;$</code>.
        </p>
      </div>

      <textarea
        ref={textareaRef}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={minRows}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-emerald-400 focus:outline-none"
      />

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Preview
        </p>
        {value ? (
          <RichTextRenderer content={value} />
        ) : (
          <p className="text-sm italic text-slate-400">Konten belum diisi.</p>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
