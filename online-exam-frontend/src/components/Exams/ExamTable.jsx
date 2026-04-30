import React, { useState } from "react";
import StudentsModal from "../StudentsModal";
import formatDateOnly from "../../utils/formatDateOnly";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import ActionMenu from "../ActionMenu";
import PropTypes from "prop-types";

const ExamTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit }) => {
  const sort = searchParams.get("sort") || "title";
  const order = searchParams.get("order") || "asc";
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [showStudents, setShowStudents] = useState(false);

  const openStudentsModal = (examId) => {
    setSelectedExamId(examId);
    setShowStudents(true);
  };

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
      <HiChevronUp className="inline text-primary-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-primary-500 ml-1" />
    );
  };

  return (
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block table-shell overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
          <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center border-b min-w-[60px]">No</th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[180px] hover:text-emerald-700"
                onClick={() => handleSort("title")}
              >
                Judul Ujian {renderSortIndicator("title")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[160px] hover:text-emerald-700"
                onClick={() => handleSort("subject")}
              >
                Mata Pelajaran {renderSortIndicator("subject")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[130px] hover:text-emerald-700"
                onClick={() => handleSort("type")}
              >
                Tipe {renderSortIndicator("type")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[130px] hover:text-emerald-700"
                onClick={() => handleSort("date")}
              >
                Tanggal {renderSortIndicator("date")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[140px] hover:text-emerald-700"
                onClick={() => handleSort("duration")}
              >
                Durasi (menit) {renderSortIndicator("duration")}
              </th>
              <th className="px-4 py-3 text-center border-b min-w-[120px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((exam, index) => (
                <tr
                  key={exam.id}
                  className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{exam.title}</td>
                  <td className="px-4 py-3">{exam.subject?.name || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        exam.type === "REGULER"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {exam.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{formatDateOnly(exam.date)}</td>
                  <td className="px-4 py-3 text-center">{exam.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu
                      itemId={exam.id}
                      onEdit={onEdit}
                      menu="exam"
                      type={exam.type}
                      onShowStudents={openStudentsModal}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-6 text-center text-gray-500 bg-gray-50 italic"
                >
                  Tidak ada ujian ditemukan.
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
                       <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                         exam.type === "REGULER" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                       }`}>
                         {exam.type}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                  <ActionMenu
                    itemId={exam.id}
                    onEdit={onEdit}
                    menu="exam"
                    type={exam.type}
                    onShowStudents={openStudentsModal}
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
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Tidak ada data ujian.
          </div>
        )}
      </div>

      <StudentsModal
        isOpen={showStudents}
        onClose={() => setShowStudents(false)}
        examId={selectedExamId}
      />
    </div>
  );
};

ExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

export default ExamTable;
