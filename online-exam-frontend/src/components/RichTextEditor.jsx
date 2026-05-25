import { useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import RichTextRenderer from "./RichTextRenderer";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "2 MB";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Tulis konten di sini",
  minRows = 5,
}) => {
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  const getEditor = () => quillRef.current?.getEditor();

  const insertHtml = (html) => {
    const editor = getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    editor.clipboard.dangerouslyPasteHTML(range.index, html);
    editor.setSelection(range.index + 1, 0);
  };

  const insertFormula = (latex) => {
    const editor = getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    editor.insertEmbed(range.index, "formula", latex, "user");
    editor.insertText(range.index + 1, " ", "user");
    editor.setSelection(range.index + 2, 0);
  };

  const insertCustomFormula = () => {
    const latex = window.prompt(
      "Ketik rumus singkat. Contoh: x^2, \\sqrt{x}, atau \\frac{a}{b}",
      "x^2",
    );

    if (latex?.trim()) insertFormula(latex.trim());
  };

  const insertTable = () => {
    const rows = Number(window.prompt("Jumlah baris tabel", "2")) || 2;
    const cols = Number(window.prompt("Jumlah kolom tabel", "2")) || 2;
    const safeRows = Math.min(Math.max(rows, 1), 8);
    const safeCols = Math.min(Math.max(cols, 1), 6);

    const body = Array.from({ length: safeRows }, (_, rowIndex) => (
      `<tr>${Array.from({ length: safeCols }, (_, colIndex) => (
        `<td>Baris ${rowIndex + 1}, Kolom ${colIndex + 1}</td>`
      )).join("")}</tr>`
    )).join("");

    insertHtml(`<table><tbody>${body}</tbody></table><p><br></p>`);
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
      const editor = getEditor();
      if (!editor) return;

      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, "image", reader.result, "user");
      editor.setSelection(range.index + 1, 0);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    },
  }), []);

  const formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "image",
    "formula",
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
        <p>
          Ketik langsung seperti editor biasa. Gambar maksimal {MAX_IMAGE_SIZE_LABEL}.
          Gunakan tombol di bawah untuk menambah gambar, tabel, atau rumus tanpa mengetik kode.
        </p>
      </div>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="app-rich-quill"
        style={{ minHeight: `${Math.max(minRows, 3) * 2.5}rem` }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Tambah Gambar
        </button>
        <button
          type="button"
          onClick={insertTable}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Tambah Tabel
        </button>
        <button
          type="button"
          onClick={() => insertFormula("x^2")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Pangkat
        </button>
        <button
          type="button"
          onClick={() => insertFormula("\\sqrt{x}")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Akar
        </button>
        <button
          type="button"
          onClick={() => insertFormula("\\frac{a}{b}")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Pecahan
        </button>
        <button
          type="button"
          onClick={insertCustomFormula}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Rumus Lain
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

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
