import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import ActionMenu from "../ActionMenu";
import PropTypes from "prop-types";

const SubjectTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit }) => {
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "asc";
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

  return (
    <div className="font-poppins">
      <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm text-gray-700">
        <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
          <tr>
            <th className="px-4 py-3 text-center">No</th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("name")}
            >
              Nama {renderSortIndicator("name")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("class_id")}
            >
              Kelas {renderSortIndicator("class_id")}
            </th>
            <th
              className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700"
              onClick={() => handleSort("description")}
            >
              Deskripsi {renderSortIndicator("description")}
            </th>
            <th className="px-4 py-3 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((subject, index) => (
              <tr
                key={subject.id}
                className="hover:bg-emerald-50 transition-colors duration-200"
              >
                <td className="px-4 py-3 border-t text-center">{index + 1}</td>
                <td className="px-4 py-3 border-t">{subject.name}</td>
                <td className="px-4 py-3 border-t text-center">
                  Kelas {subject.class_id}
                </td>
                <td className="px-4 py-3 border-t text-gray-600">
                  {subject.description || "-"}
                </td>
                <td className="px-4 py-3 border-t text-center">
                  <ActionMenu itemId={subject.id} onEdit={onEdit} menu="subjects" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="5"
                className="px-4 py-6 text-center text-gray-500 italic"
              >
                Tidak ada mata pelajaran ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

SubjectTable.propTypes = {
  data: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

export default SubjectTable;
