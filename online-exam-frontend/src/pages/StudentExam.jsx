import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import Pagination from "../components/Paginate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import StudentExamTable from "../components/Exams/StudentExamTable";
import { FaBookOpen, FaClock, FaLeaf } from "react-icons/fa";

const MySwal = withReactContent(Swal);

const StudentExams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0 });

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "title";
  const order = searchParams.get("order") || "asc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const fetchStudentExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/exams/today`, {
        params: { search, sort, order, page, limit: pageSize },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const examList = Array.isArray(res.data?.data) ? res.data.data : [];
      const metaInfo = res.data?.meta || { total: 0 };

      setExams(examList);
      setMeta(metaInfo);
    } catch (err) {
      console.error("Failed to fetch student exams:", err);
      MySwal.fire({
        title: "Gagal Mengambil Data",
        text: "Terjadi kesalahan saat memuat ujian hari ini.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setSearchParams({ search: "", sort: "title", order: "asc", page: "1" });
      setExams([]);
      setMeta({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
  }, [search, sort, order, page]);

  return (
    <Sidebar>
      <div className="p-6 min-h-screen bg-gray-50 rounded-2xl shadow-sm max-w-screen-xl mx-auto transition-all duration-300">
        {/* === Header Section === */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <FaBookOpen className="text-emerald-600 text-3xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Ujian Hari Ini
              </h3>
              <p className="text-gray-600 text-sm pt-1">
                Daftar ujian yang tersedia untuk kamu hari ini — semangat dan
                tetap fokus ya 🌿
              </p>
            </div>
          </div>
        </div>

        {/* === Statistik Mini === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className="flex items-center justify-between bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm">Total Ujian Hari Ini</p>
              <p className="text-2xl font-bold text-emerald-600">{meta.total}</p>
            </div>
            <FaClock className="text-3xl text-emerald-500 opacity-80" />
          </div>

          <div className="flex items-center justify-between bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold text-emerald-600">
                {loading ? "Memuat..." : "Tersedia"}
              </p>
            </div>
            <FaLeaf className="text-3xl text-emerald-500 opacity-80" />
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
            <p className="text-gray-500 italic text-center py-10">
              Tidak ada ujian tersedia hari ini.
            </p>
          ) : (
            <>
              <StudentExamTable
                data={exams}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                onRefresh={fetchStudentExams}
                isStudentView={true}
              />

              {/* Pagination Section */}
              <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
                <div className="text-sm text-gray-600">
                  {meta.total > 0 && (
                    <span>
                      Menampilkan{" "}
                      <strong>{(page - 1) * pageSize + 1}</strong> hingga{" "}
                      <strong>{Math.min(page * pageSize, meta.total)}</strong> dari{" "}
                      <strong>{meta.total}</strong> data
                    </span>
                  )}
                </div>
                <Pagination
                  current={page}
                  total={meta.total}
                  pageSize={pageSize}
                  onPageChange={(p) =>
                    setSearchParams({
                      search,
                      sort,
                      order,
                      page: p.toString(),
                    })
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

export default StudentExams;
