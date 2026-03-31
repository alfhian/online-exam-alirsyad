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
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="min-w-full bg-white text-sm text-gray-700">
        <thead className="bg-emerald-50 text-emerald-700 font-semibold">
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
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((exam, index) => (
              <tr
                key={exam.id}
                className="hover:bg-emerald-50 transition-all duration-150"
              >
                <td className="px-4 py-3 border-b border-gray-100 text-center text-gray-600">
                  {index + 1}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-gray-800 font-medium">
                  {exam.title}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center">
                  {exam.subject?.name || "-"}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center capitalize">
                  {exam.type}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center">
                  {formatDateOnly(exam.date)}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center">
                  {exam.duration}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center">
                  <ActionMenu itemId={exam.id} menu="studentExam" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="7"
                className="px-4 py-6 text-center text-gray-500 italic"
              >
                Tidak ada ujian hari ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

StudentExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default StudentExamTable;
