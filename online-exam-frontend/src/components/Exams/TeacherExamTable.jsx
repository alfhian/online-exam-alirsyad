import React from "react";
import formatDateOnly from "../../utils/formatDateOnly";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import PropTypes from "prop-types";
import ActionMenu from "../ActionMenu";
import { useNavigate } from "react-router-dom";

const TeacherExamTable = ({ data, searchParams, setSearchParams }) => {
  const navigate = useNavigate();
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "desc";
    const newOrder =
      currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    setSearchParams({
      search: searchParams.get("search") || "",
      sort: key,
      order: newOrder,
      page: "1",
    });
  };

  const renderSortIndicator = (key) => {
    if (sort !== key)
      return <HiSelector className="inline text-gray-400 ml-1" />;
    return order === "asc" ? (
      <HiChevronUp className="inline text-emerald-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-emerald-500 ml-1" />
    );
  };

  const handleViewStudents = (examId) => {
    navigate(`/teacher-exam/${examId}/students`);
  };

  return (
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block table-shell overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
          <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center border-b">No</th>
              <th
                className="px-4 py-3 text-left border-b cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("title")}
              >
                Judul {renderSortIndicator("title")}
              </th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("subject")}
              >
                Mata Pelajaran {renderSortIndicator("subject")}
              </th>
              <th className="px-4 py-3 text-center border-b">Kelas</th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("type")}
              >
                Tipe {renderSortIndicator("type")}
              </th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("date")}
              >
                Tanggal {renderSortIndicator("date")}
              </th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("duration")}
              >
                Durasi {renderSortIndicator("duration")}
              </th>
              <th className="px-4 py-3 text-center border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((exam, index) => (
                <tr
                  key={exam.id}
                  className="hover:bg-emerald-50/50 transition-colors duration-200 border-b last:border-none"
                >
                  <td className="px-4 py-4 text-center">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{exam.title}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
                      {exam.subject?.name || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold uppercase">
                      {exam.subject?.class_id || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">{exam.type}</td>
                  <td className="px-4 py-4 text-center text-slate-500">{formatDateOnly(exam.date)}</td>
                  <td className="px-4 py-4 text-center font-medium">
                    <span className="text-emerald-600">{exam.duration}</span>
                    <span className="text-[10px] text-slate-400 ml-1">min</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ActionMenu
                      itemId={exam.id}
                      menu="teacherExam"
                      onShowStudents={handleViewStudents}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-slate-400 italic bg-slate-50/30">
                  Tidak ada ujian yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((exam, index) => (
            <div 
              key={exam.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                    {(page - 1) * pageSize + index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight pr-8">{exam.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                         {exam.subject?.class_id || '-'}
                       </span>
                       <span className="text-[10px] text-slate-400 font-medium">
                         {exam.type}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                  <ActionMenu
                    itemId={exam.id}
                    menu="teacherExam"
                    onShowStudents={handleViewStudents}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mata Pelajaran</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{exam.subject?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Durasi</p>
                  <p className="text-xs font-semibold text-emerald-600">{exam.duration} <span className="text-[10px] text-slate-400 font-normal">Menit</span></p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Tanggal</p>
                  <p className="text-xs text-slate-500 font-medium">{formatDateOnly(exam.date)}</p>
                </div>
                <div className="flex items-end justify-end">
                  <button 
                    onClick={() => handleViewStudents(exam.id)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Daftar Siswa →
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Tidak ada data ujian.
          </div>
        )}
      </div>
    </div>
  );
};

TeacherExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default TeacherExamTable;
