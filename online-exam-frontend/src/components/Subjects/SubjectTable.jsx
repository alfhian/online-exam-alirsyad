import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import ActionMenu from "../ActionMenu";
import PropTypes from "prop-types";

const SubjectTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit }) => {
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

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
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block table-shell overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
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
              <th className="px-4 py-3 text-center">
                Guru Pengampu
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
                  className="hover:bg-emerald-50 transition-colors duration-200 border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{subject.name}</td>
                  <td className="px-4 py-3 text-center uppercase">
                    {subject.class_id}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {subject.teacher?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {subject.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu itemId={subject.id} onEdit={onEdit} menu="subjects" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-6 text-center text-gray-500 italic"
                >
                  Tidak ada mata pelajaran ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((subject, index) => (
            <div 
              key={subject.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                    {(page - 1) * pageSize + index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight pr-8">{subject.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                         {subject.class_id || '-'}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                  <ActionMenu itemId={subject.id} onEdit={onEdit} menu="subjects" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Guru Pengampu</p>
                  <p className="text-xs font-semibold text-slate-700">{subject.teacher?.name || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Deskripsi</p>
                  <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                    {subject.description || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Tidak ada data mata pelajaran.
          </div>
        )}
      </div>
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
