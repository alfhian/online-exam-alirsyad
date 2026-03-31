import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import Pagination from "../components/Paginate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import TeacherExamTable from "../components/Exams/TeacherExamTable";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);

const TeacherExam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0 });
  const navigate = useNavigate();

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  // === Fetch Exams Data ===
  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher-exams", {
        params: { search, sort, order, page, limit: pageSize },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const examList = Array.isArray(res.data?.data) ? res.data.data : [];
      const metaInfo = res.data?.meta || { total: 0 };

      setExams(examList);
      setMeta(metaInfo);
    } catch (err) {
      console.error("Failed to fetch teacher exams:", err);
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil daftar ujian.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setExams([]);
      setMeta({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [search, sort, order, page]);

  const handleViewStudents = (examId) => {
    navigate(`/teacher/exams/${examId}/students`);
  };

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <FaClipboardList className="text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Daftar Ujian yang Dikerjakan Siswa
            </h3>
          </div>
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
          ) : exams.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Tidak ada data ujian yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <TeacherExamTable
                  data={exams}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  onViewStudents={handleViewStudents}
                />
              </div>

              {/* 📄 Pagination Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3 text-sm text-gray-600">
                {meta.total > 0 && (
                  <span>
                    Menampilkan{" "}
                    <strong>{(page - 1) * pageSize + 1}</strong> hingga{" "}
                    <strong>{Math.min(page * pageSize, meta.total)}</strong> dari{" "}
                    <strong>{meta.total}</strong> entri
                  </span>
                )}
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

export default TeacherExam;
