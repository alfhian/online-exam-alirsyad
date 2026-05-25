import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import katex from "katex";
import "mathlive";
import "mathlive/static.css";
import "quill/dist/quill.snow.css";
import RichTextRenderer from "./RichTextRenderer";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "2 MB";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Tulis konten di sini",
  minRows = 5,
}) => {
  const editorHostRef = useRef(null);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const mathFieldRef = useRef(null);
  const lastValueRef = useRef(value || "");
  const [isMathEditorOpen, setIsMathEditorOpen] = useState(false);
  const [mathValue, setMathValue] = useState("");

  useEffect(() => {
    if (!editorHostRef.current || quillRef.current) return;

    if (typeof window !== "undefined") {
      window.katex = katex;
    }

    const editor = new Quill(editorHostRef.current, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      },
      formats: [
        "bold",
        "italic",
        "underline",
        "list",
        "bullet",
        "image",
        "formula",
      ],
    });

    editor.root.innerHTML = value || "";
    lastValueRef.current = value || "";

    editor.on("text-change", () => {
      const html = editor.root.innerHTML;
      const normalizedHtml = html === "<p><br></p>" ? "" : html;
      lastValueRef.current = normalizedHtml;
      onChange(normalizedHtml);
    });

    quillRef.current = editor;
  }, []);

  useEffect(() => {
    const editor = quillRef.current;
    if (!editor) return;

    const nextValue = value || "";
    if (nextValue === lastValueRef.current || nextValue === editor.root.innerHTML) {
      return;
    }

    const selection = editor.getSelection();
    editor.root.innerHTML = nextValue;
    lastValueRef.current = nextValue;

    if (selection) {
      editor.setSelection(selection);
    }
  }, [value]);

  useEffect(() => {
    if (!isMathEditorOpen) return;

    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.value = mathValue;
    mathField.mathVirtualKeyboardPolicy = "auto";
    mathField.smartFence = true;
    mathField.smartSuperscript = true;
    mathField.placeholder = "Tulis rumus di sini";

    const handleInput = () => setMathValue(mathField.value);
    mathField.addEventListener("input", handleInput);

    window.setTimeout(() => {
      mathField.focus();
    }, 50);

    return () => {
      mathField.removeEventListener("input", handleInput);
    };
  }, [isMathEditorOpen]);

  const getEditor = () => quillRef.current;

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

  const openMathEditor = (initialValue = "") => {
    setMathValue(initialValue);
    setIsMathEditorOpen(true);
  };

  const insertMathTemplate = (template) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.insert(template, { selectionMode: "placeholder" });
    setMathValue(mathField.value);
    mathField.focus();
  };

  const submitMathFormula = () => {
    const latex = mathFieldRef.current?.value || mathValue;
    if (latex.trim()) {
      insertFormula(latex.trim());
    }

    setMathValue("");
    setIsMathEditorOpen(false);
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

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
        <p>
          Ketik langsung seperti editor biasa. Gambar maksimal {MAX_IMAGE_SIZE_LABEL}.
          Gunakan tombol di bawah untuk menambah gambar, tabel, atau rumus dengan editor visual.
        </p>
      </div>

      <div
        className="app-rich-quill"
        style={{ minHeight: `${Math.max(minRows, 3) * 2.5}rem` }}
      >
        <div ref={editorHostRef} />
      </div>

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
          onClick={() => openMathEditor("x^{2}")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Pangkat
        </button>
        <button
          type="button"
          onClick={() => openMathEditor("\\sqrt{x}")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Akar
        </button>
        <button
          type="button"
          onClick={() => openMathEditor("\\frac{a}{b}")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Pecahan
        </button>
        <button
          type="button"
          onClick={() => openMathEditor("")}
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Tambah Rumus
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

      {isMathEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Rumus</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Klik area rumus, lalu gunakan keyboard rumus yang muncul atau tombol cepat di bawah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMathEditorOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <math-field ref={mathFieldRef} class="mathlive-field" />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => insertMathTemplate("x^{#?}")}
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Pangkat
              </button>
              <button
                type="button"
                onClick={() => insertMathTemplate("\\sqrt{#?}")}
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Akar
              </button>
              <button
                type="button"
                onClick={() => insertMathTemplate("\\frac{#?}{#?}")}
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Pecahan
              </button>
              <button
                type="button"
                onClick={() => insertMathTemplate("\\pi")}
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Pi
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMathEditorOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitMathFormula}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Sisipkan Rumus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
