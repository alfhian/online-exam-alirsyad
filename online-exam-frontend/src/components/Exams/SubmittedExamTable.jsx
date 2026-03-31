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
    <div className="mt-4 bg-white rounded-2xl shadow-md border border-gray-100 overflow-x-auto">
      <table className="min-w-full text-sm text-gray-700 border-separate border-spacing-0">
        <thead className="bg-gradient-to-r from-emerald-50 to-teal-100 text-gray-700">
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
                  {submission.score ?? "-"}
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
                className="px-4 py-6 text-center text-gray-500 italic"
              >
                Belum ada ujian yang disubmit
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

SubmittedExamTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default SubmittedExamTable;
