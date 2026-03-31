import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import Pagination from "../components/Paginate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SubmittedExamTable from "../components/Exams/SubmittedExamTable";
import { FaClipboardList } from "react-icons/fa";

const MySwal = withReactContent(Swal);

const SubmittedExams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0 });

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/exam-submissions/me`, {
        params: { search, sort, order, page, limit: pageSize },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSubmissions(Array.isArray(res.data?.data) ? res.data.data : []);
      setMeta(res.data?.meta || { total: 0 });
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil data hasil ujian.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setSubmissions([]);
      setMeta({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [search, sort, order, page]);

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
            <FaClipboardList className="text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Hasil Ujian</h3>
        </div>

        {/* === Table Section === */}
        <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 p-4 overflow-x-auto">
          <SearchBar value={search} />

          {loading ? (
            <div className="mt-6 animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Tidak ada data ujian yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <SubmittedExamTable
                  data={submissions}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                />
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  {meta.total > 0 && (
                    <span>
                      Menampilkan <strong>{(page - 1) * pageSize + 1}</strong> -{" "}
                      <strong>{Math.min(page * pageSize, meta.total)}</strong> dari{" "}
                      <strong>{meta.total}</strong> entri
                    </span>
                  )}
                </div>
                <Pagination
                  current={page}
                  total={meta.total}
                  pageSize={pageSize}
                  onPageChange={(p) =>
                    setSearchParams({ search, sort, order, page: p.toString() })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default SubmittedExams;
