import React from "react";
import formatDateOnly from "../../utils/formatDateOnly";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import ActionMenu from "../ActionMenu";

const SubmittedExamTable = ({ data, searchParams, setSearchParams }) => {
  const navigate = useNavigate();
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "desc";

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "asc";
    const newOrder =
      currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    setSearchParams({ sort: key, order: newOrder, page: "1" });
  };

  const renderSortIndicator = (key) => {
    if (sort !== key)
      return <HiSelector className="inline text-gray-400 ml-1" />;
    return order === "asc" ? (
      <HiChevronUp className="inline text-blue-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-blue-500 ml-1" />
    );
  };

  return (
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block mt-4 bg-white rounded-2xl shadow-md border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm text-slate-700 border-separate border-spacing-0">
          <thead className="bg-gradient-to-r from-emerald-50 to-teal-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr className="text-sm font-semibold">
              <th className="px-4 py-3 text-center border-b">No</th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b hover:text-emerald-700"
                onClick={() => handleSort("exam.title")}
              >
                Judul Ujian {renderSortIndicator("exam.title")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b hover:text-emerald-700"
                onClick={() => handleSort("exam.subject")}
              >
                Mata Pelajaran {renderSortIndicator("exam.subject")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b hover:text-emerald-700"
                onClick={() => handleSort("created_at")}
              >
                Tanggal Submit {renderSortIndicator("created_at")}
              </th>
              <th className="px-4 py-3 text-center border-b">Score</th>
              <th className="px-4 py-3 text-center border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((submission, index) => (
                <tr
                  key={submission.id}
                  className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center">{index + 1}</td>
                  <td className="px-4 py-3">{submission.exam?.title || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {submission.exam?.subject?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatDateOnly(submission.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-emerald-600">
                      {submission.score ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu itemId={submission.id} menu={"submittedExam"} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-12 text-center text-gray-500 italic bg-slate-50/30"
                >
                  Belum ada ujian yang disubmit
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Mobile Card View */}
      <div className="lg:hidden space-y-4 mt-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((submission, index) => (
            <div 
              key={submission.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight pr-8">{submission.exam?.title || "Tanpa Judul"}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{submission.exam?.type}</p>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                  <ActionMenu itemId={submission.id} menu={"submittedExam"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mata Pelajaran</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{submission.exam?.subject?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Skor Akhir</p>
                  <p className="text-sm font-bold text-emerald-600">{submission.score ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Diserahkan</p>
                  <p className="text-xs text-slate-500 font-medium">{formatDateOnly(submission.created_at)}</p>
                </div>
                <div className="flex items-end justify-end">
                   <button 
                    onClick={() => navigate(`/student/submitted-exams/${submission.id}`)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Detail Hasil →
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Belum ada submission.
          </div>
        )}
      </div>
    </div>
  );
};

SubmittedExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default SubmittedExamTable;
