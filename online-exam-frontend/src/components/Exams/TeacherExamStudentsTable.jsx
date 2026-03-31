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
      <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm text-gray-700">
        <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
          <tr>
            <th className="px-4 py-3 text-center">No</th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700 select-none"
              onClick={() => handleSort("userid")}
            >
              NIS {renderSortIndicator("userid")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700 select-none"
              onClick={() => handleSort("student_name")}
            >
              Siswa {renderSortIndicator("student_name")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700 select-none"
              onClick={() => handleSort("submitted_at")}
            >
              Tanggal Submit {renderSortIndicator("submitted_at")}
            </th>
            <th className="px-4 py-3 text-center">Nilai</th>
            <th className="px-4 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((submission, index) => (
              <tr
                key={submission.id}
                className="hover:bg-emerald-50 transition-colors duration-200"
              >
                <td className="px-4 py-3 border-t text-center">{index + 1}</td>
                <td className="px-4 py-3 border-t text-center">
                  {submission.student?.userid || "-"}
                </td>
                <td className="px-4 py-3 border-t">
                  {submission.student?.name || "-"}
                </td>
                <td className="px-4 py-3 border-t text-center">
                  {formatDateOnly(submission.created_at)}
                </td>
                <td className="px-4 py-3 border-t text-center">
                  {submission.score != null ? (
                    (() => {
                      let color = "text-green-600";
                      if (submission.score < 50) color = "text-red-500";
                      else if (submission.score < 75) color = "text-yellow-500";
                      return (
                        <span className={`${color} font-semibold`}>
                          {submission.score}
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="px-4 py-3 border-t text-center">
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
                colSpan="5"
                className="px-4 py-6 text-center text-gray-500 italic"
              >
                Belum ada siswa yang mengerjakan ujian ini
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

TeacherExamStudentsTable.propTypes = {
  data: PropTypes.array.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
};

export default TeacherExamStudentsTable;
