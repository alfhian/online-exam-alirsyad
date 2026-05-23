import { useEffect, useRef } from "react";
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

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Tulis konten di sini",
  minRows = 5,
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== (value || "")) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  const syncValue = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command, commandValue = null) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertHtml = (html) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    syncValue();
  };

  const insertFormula = (template) => {
    const selectedText = window.getSelection()?.toString() || "x";
    const formula = template(selectedText);
    focusEditor();
    document.execCommand("insertText", false, formula);
    syncValue();
  };

  const insertTable = () => {
    insertHtml(`
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
      </table>
    `);
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
      insertHtml(`<img src="${reader.result}" alt="Gambar soal" />`);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { label: "Bold", icon: FaBold, action: () => runCommand("bold") },
    { label: "Italic", icon: FaItalic, action: () => runCommand("italic") },
    { label: "Underline", icon: FaUnderline, action: () => runCommand("underline") },
    { label: "Bullet list", icon: FaListUl, action: () => runCommand("insertUnorderedList") },
    { label: "Number list", icon: FaListOl, action: () => runCommand("insertOrderedList") },
    { label: "Pangkat", text: "x^2", action: () => insertFormula((selected) => `$${selected || "x"}^2$`) },
    { label: "Akar", text: "sqrt", action: () => insertFormula((selected) => `$\\sqrt{${selected || "x"}}$`) },
    { label: "Pecahan", text: "a/b", action: () => insertFormula(() => "$\\frac{a}{b}$") },
    { label: "Rumus bebas", icon: FaSquareRootAlt, action: () => insertFormula((selected) => `$${selected || "x"}$`) },
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
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-white px-2 text-slate-600 shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
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
          Ketik langsung seperti editor biasa. Gambar maksimal {MAX_IMAGE_SIZE_LABEL}. Untuk rumus,
          blok teks lalu klik tombol pangkat/akar, atau gunakan tombol rumus yang tersedia.
        </p>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        data-placeholder={placeholder}
        className="rich-text-editor min-h-[12rem] w-full overflow-y-auto rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        style={{ minHeight: `${Math.max(minRows, 3) * 2.5}rem` }}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Preview tampilan siswa
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
