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
      <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm text-gray-700">
        <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
          <tr>
            <th className="px-4 py-3 text-center">No</th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("title")}
            >
              Judul {renderSortIndicator("title")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("subject")}
            >
              Mata Pelajaran {renderSortIndicator("subject")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("type")}
            >
              Tipe {renderSortIndicator("type")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("date")}
            >
              Tanggal {renderSortIndicator("date")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("duration")}
            >
              Durasi (menit) {renderSortIndicator("duration")}
            </th>
            <th className="px-4 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((exam, index) => (
              <tr
                key={exam.id}
                className="hover:bg-emerald-50 transition-colors duration-200"
              >
                <td className="px-4 py-3 border-t text-center">{index + 1}</td>
                <td className="px-4 py-3 border-t">{exam.title}</td>
                <td className="px-4 py-3 border-t text-center">
                  {exam.subject?.name || "-"}
                </td>
                <td className="px-4 py-3 border-t text-center">{exam.type}</td>
                <td className="px-4 py-3 border-t text-center">
                  {formatDateOnly(exam.date)}
                </td>
                <td className="px-4 py-3 border-t text-center">
                  {exam.duration}
                </td>
                <td className="px-4 py-3 border-t text-center">
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
              <td
                colSpan="7"
                className="px-4 py-6 text-center text-gray-500 italic"
              >
                Tidak ada ujian dengan submission
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

TeacherExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default TeacherExamTable;
