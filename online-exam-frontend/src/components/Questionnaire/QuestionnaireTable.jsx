import React from "react";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import ActionMenu from "../ActionMenu";
import PropTypes from "prop-types";

const QuestionnaireTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit }) => {
  const sort = searchParams.get("sort") || "question";
  const order = searchParams.get("order") || "asc";

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "asc";
    const newOrder = currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    setSearchParams({ sort: key, order: newOrder, page: "1" });
  };

  const renderSortIndicator = (key) => {
    if (sort !== key) return <HiSelector className="inline text-gray-400 ml-1" />;
    return order === "asc" ? (
      <HiChevronUp className="inline text-emerald-500 ml-1" />
    ) : (
      <HiChevronDown className="inline text-emerald-500 ml-1" />
    );
  };

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700 table-fixed">
          <thead className="bg-gradient-to-r from-emerald-50 to-teal-100 text-gray-700">
            <tr className="text-sm font-semibold">
              <th className="px-4 py-3 text-center border-b min-w-[60px]">No</th>
              <th className="px-4 py-3 text-center border-b min-w-[60px]">No Urut</th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[300px] hover:text-emerald-700"
                onClick={() => handleSort("question")}
              >
                Pertanyaan {renderSortIndicator("question")}
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none border-b min-w-[180px] hover:text-emerald-700"
                onClick={() => handleSort("type")}
              >
                Jenis {renderSortIndicator("type")}
              </th>
              <th className="px-4 py-3 text-center border-b min-w-[220px]">
                Opsi Jawaban
              </th>
              <th className="px-4 py-3 text-center border-b min-w-[140px]">
                Jawaban Benar
              </th>
              <th className="px-4 py-3 text-center border-b min-w-[100px]">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((q, index) => (
                <tr
                  key={q.id}
                  className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center">{index + 1}</td>
                  <td className="px-4 py-3 text-center">{q.index}</td>
                  <td className="px-4 py-3 text-gray-800 break-words">{q.question}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        q.type === "multiple_choice"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {q.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 break-words">
                    {q.type === "multiple_choice" && Array.isArray(q.options)
                      ? q.options.map((opt) => opt.value).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">
                    {q.answer || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu itemId={q.id} onEdit={onEdit} menu="questionnaire" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-6 text-center text-gray-500 bg-gray-50 italic"
                >
                  Tidak ada pertanyaan ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

QuestionnaireTable.propTypes = {
  data: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

export default QuestionnaireTable;
