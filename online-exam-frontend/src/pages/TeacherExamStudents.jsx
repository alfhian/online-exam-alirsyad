import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import Pagination from "../components/Paginate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import TeacherExamStudentsTable from "../components/Exams/TeacherExamStudentsTable";
import { FaUserGraduate } from "react-icons/fa";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);

const TeacherExamStudents = () => {
  const { examId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [examTitle, setExamTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0 });

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  // === Fetch Student Submissions ===
  const fetchStudentSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/teacher-exams/${examId}/students`,
        {
          params: { search, sort, order, page, limit: pageSize },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const metaInfo = res.data?.meta || { total: 0 };
      setSubmissions(list);
      setMeta(metaInfo);

      if (list.length > 0 && list[0].exam?.title) {
        setExamTitle(list[0].exam.title);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil data siswa yang mengerjakan ujian.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSubmissions();
  }, [search, sort, order, page]);

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                <FaUserGraduate className="text-2xl" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">
                Daftar Siswa yang Mengikuti Ujian{" "}
                {examTitle ? <span className="text-emerald-600">: {examTitle}</span> : ""}
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
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Tidak ada data ujian yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <TeacherExamStudentsTable
                  data={submissions}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  onRefresh={fetchStudentSubmissions}
                />
              </div>

              {/* Pagination Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
                <div className="text-sm text-gray-600">
                  {meta.total > 0 && (
                    <span>
                      Menampilkan{" "}
                      <strong>{(page - 1) * pageSize + 1}</strong> hingga{" "}
                      <strong>{Math.min(page * pageSize, meta.total)}</strong>{" "}
                      dari <strong>{meta.total}</strong> entri
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

export default TeacherExamStudents;
  