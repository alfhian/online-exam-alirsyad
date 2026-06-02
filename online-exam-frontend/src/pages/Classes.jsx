import { useEffect, useState } from "react";
import { FaSchool } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const initialForm = { id: "", name: "", grade: "" };

export default function Classes() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/classes", { params: { limit: 100 } });
      setRows(res.data?.data || []);
    } catch (err) {
      MySwal.fire("Error", err.response?.data?.message || "Gagal mengambil data kelas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.id || !form.name) {
      MySwal.fire("Gagal!", "Kode dan nama kelas wajib diisi.", "warning");
      return;
    }

    try {
      await api.post("/classes", form);
      setForm(initialForm);
      MySwal.fire("Berhasil!", "Kelas berhasil ditambahkan.", "success");
      fetchClasses();
    } catch (err) {
      MySwal.fire("Gagal!", err.response?.data?.message || "Gagal menambah kelas.", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Hapus kelas?",
      text: "Kelas hanya bisa dihapus jika belum dipakai mata pelajaran aktif.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/classes/${id}`);
      MySwal.fire("Berhasil!", "Kelas berhasil dihapus.", "success");
      fetchClasses();
    } catch (err) {
      MySwal.fire("Gagal!", err.response?.data?.message || "Gagal menghapus kelas.", "error");
    }
  };

  return (
    <Sidebar>
      <div className="module-shell">
        <div className="module-header">
          <div className="module-title-wrap">
            <div className="module-icon">
              <FaSchool className="text-lg" />
            </div>
            <h3 className="module-title">Pengelolaan Kelas</h3>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-sm font-bold text-slate-800">Tambah Kelas</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Kode Kelas</label>
                <input
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  placeholder="Contoh: 10AK"
                  className="mt-1 w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Nama Kelas</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Kelas 10 AK"
                  className="mt-1 w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Tingkat</label>
                <input
                  name="grade"
                  type="number"
                  value={form.grade}
                  onChange={handleChange}
                  placeholder="Contoh: 10"
                  className="mt-1 w-full px-3 py-2"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Simpan Kelas
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-sm font-bold text-slate-800">Daftar Kelas</h4>
            {loading ? (
              <p className="text-sm text-slate-500">Memuat data...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada kelas.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.id} {item.grade ? `- Tingkat ${item.grade}` : ""}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
