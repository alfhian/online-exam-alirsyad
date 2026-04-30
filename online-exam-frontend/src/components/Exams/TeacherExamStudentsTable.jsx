import React from "react";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import PropTypes from "prop-types";
import formatDateOnly from "../../utils/formatDateOnly";
import ActionMenu from "../ActionMenu";
import { useNavigate } from "react-router-dom";

const TeacherExamStudentsTable = ({ data, searchParams, setSearchParams }) => {
  const navigate = useNavigate();
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "desc";

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "desc";
    const newOrder = currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    setSearchParams({
      search: searchParams.get("search") || "",
      sort: key,
      order: newOrder,
      page: "1",
    });
  };

  const renderSortIndicator = (key) => {
    if (sort !== key) return <HiSelector className="inline text-gray-400 ml-1" />;
    return order === "asc" ? (
      <HiChevronUp className="inline text-emerald-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-emerald-500 ml-1" />
    );
  };

  const handleGrade = (submissionId) => {
    navigate(`/teacher/exams/submission/${submissionId}/grading`);
  };

  return (
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block table-shell overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
          <thead className="bg-emerald-50 text-emerald-700 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center border-b">No</th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 select-none"
                onClick={() => handleSort("userid")}
              >
                NIS {renderSortIndicator("userid")}
              </th>
              <th
                className="px-4 py-3 text-left border-b cursor-pointer hover:text-emerald-700 select-none"
                onClick={() => handleSort("student_name")}
              >
                Siswa {renderSortIndicator("student_name")}
              </th>
              <th
                className="px-4 py-3 text-center border-b cursor-pointer hover:text-emerald-700 select-none"
                onClick={() => handleSort("submitted_at")}
              >
                Tanggal Submit {renderSortIndicator("submitted_at")}
              </th>
              <th className="px-4 py-3 text-center border-b">Nilai</th>
              <th className="px-4 py-3 text-center border-b">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {Array.isArray(data) && data.length > 0 ? (
              data.map((submission, index) => (
                <tr
                  key={submission.id}
                  className="hover:bg-emerald-50/50 transition-colors duration-200 border-b last:border-none"
                >
                  <td className="px-4 py-4 text-center">{(page - 1) * 10 + index + 1}</td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">
                    {submission.student?.userid || "-"}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {submission.student?.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500">
                    {formatDateOnly(submission.created_at)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {submission.score != null ? (
                      (() => {
                        let color = "bg-green-50 text-green-700 border-green-100";
                        if (submission.score < 50) color = "bg-rose-50 text-rose-700 border-rose-100";
                        else if (submission.score < 75) color = "bg-amber-50 text-amber-700 border-amber-100";
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                            {submission.score}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-100 italic">
                        Belum Dinilai
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ActionMenu
                      itemId={submission.id}
                      menu="teacherExamSubmission"
                      onGrade={() => handleGrade(submission.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-12 text-center text-slate-400 italic bg-slate-50/30"
                >
                  Belum ada siswa yang mengerjakan ujian ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((submission, index) => (
            <div 
              key={submission.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                    {(page - 1) * 10 + index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight pr-8">{submission.student?.name || "Tanpa Nama"}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">NIS: {submission.student?.userid || "-"}</p>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                  <ActionMenu
                    itemId={submission.id}
                    menu="teacherExamSubmission"
                    onGrade={() => handleGrade(submission.id)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</p>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Selesai</span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nilai Akhir</p>
                  <p className="text-xs font-bold">
                    {submission.score != null ? (
                      <span className={submission.score < 75 ? "text-amber-500" : "text-emerald-600"}>
                        {submission.score}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">Belum Dinilai</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Diserahkan</p>
                  <p className="text-xs text-slate-500 font-medium">{formatDateOnly(submission.created_at)}</p>
                </div>
                <div className="flex items-end justify-end">
                   <button 
                    onClick={() => handleGrade(submission.id)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Detail Nilai →
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

TeacherExamStudentsTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default TeacherExamStudentsTable;
