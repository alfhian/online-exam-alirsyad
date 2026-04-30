import React from "react";
import formatDateOnly from "../../utils/formatDateOnly";
import {
  HiChevronUp,
  HiChevronDown,
  HiSelector,
} from "react-icons/hi";
import PropTypes from "prop-types";
import ActionMenu from "../ActionMenu";

const StudentExamTable = ({ data, searchParams, setSearchParams }) => {
  const sort = searchParams.get("sort") || "title";
  const order = searchParams.get("order") || "asc";

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
      <HiChevronUp className="inline text-emerald-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-emerald-500 ml-1" />
    );
  };

  return (
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="bg-emerald-50 text-emerald-700 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center border-b border-gray-200">
                No
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer border-b border-gray-200"
                onClick={() => handleSort("title")}
              >
                Judul {renderSortIndicator("title")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b border-gray-200"
                onClick={() => handleSort("subject")}
              >
                Mata Pelajaran {renderSortIndicator("subject")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b border-gray-200"
                onClick={() => handleSort("type")}
              >
                Tipe {renderSortIndicator("type")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b border-gray-200"
                onClick={() => handleSort("date")}
              >
                Tanggal {renderSortIndicator("date")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer border-b border-gray-200"
                onClick={() => handleSort("duration")}
              >
                Durasi (menit) {renderSortIndicator("duration")}
              </th>
              <th className="px-4 py-3 text-center border-b border-gray-200">
                Status
              </th>
              <th className="px-4 py-3 text-center border-b border-gray-200">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((exam, index) => (
                <tr
                  key={exam.id}
                  className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center text-gray-600">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {exam.title}
                  </td>
                  <td className="px-4 py-3 text-center text-xs uppercase font-bold text-slate-500">
                    {exam.subject?.name} <span className="text-emerald-600">({exam.subject?.class_id})</span>
                  </td>
                  <td className="px-4 py-3 text-center capitalize">
                    {exam.type}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatDateOnly(exam.date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {exam.duration}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {exam.is_submitted ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                        Sudah Dikerjakan
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                        Belum Dikerjakan
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!exam.is_submitted && (
                      <ActionMenu itemId={exam.id} menu="studentExam" />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-12 text-center text-gray-500 italic bg-slate-50/50"
                >
                  Tidak ada ujian hari ini.
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
                    {index + 1}
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
                {!exam.is_submitted && (
                  <div className="absolute top-0 right-0">
                    <ActionMenu itemId={exam.id} menu="studentExam" />
                  </div>
                )}
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
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</p>
                  {exam.is_submitted ? (
                    <span className="text-[10px] font-bold text-green-600">Sudah Dikerjakan</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">Belum Dikerjakan</span>
                  )}
                </div>
                <div className="flex items-end justify-end">
                  {!exam.is_submitted && (
                    <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                      Kerjakan →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Tidak ada ujian hari ini.
          </div>
        )}
      </div>
    </div>
  );
};

StudentExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default StudentExamTable;
