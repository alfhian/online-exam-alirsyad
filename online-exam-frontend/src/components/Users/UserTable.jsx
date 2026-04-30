import formatDate from "../../utils/formatDate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ToggleStatusButton from "./ToggleStatusButton";
import { HiChevronUp, HiChevronDown, HiSelector } from "react-icons/hi";
import ActionMenu from "../ActionMenu";
import axios from "axios";
import PropTypes from "prop-types";
import api from "../../api/axiosConfig";

const MySwal = withReactContent(Swal);

const UserTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit, onEditSiswa, onDelete }) => {
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const handleSort = (key) => {
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order") || "asc";
    const newOrder = currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    setSearchParams({ sort: key, order: newOrder, page: "1" });
  };

  const onToggle = async (id, newStatus) => {
    try {
      await api.put(
        `/users/${id}/status`,
        {
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      MySwal.fire({
        title: "Berhasil!",
        text: `Status telah diubah.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      onRefresh();
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      MySwal.fire({
        title: "Gagal!",
        text: `Status gagal diubah.`,
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
    }
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
    <div className="font-poppins">
      {/* 🔹 Desktop Table View */}
      <div className="hidden lg:block table-shell overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
          <thead className="bg-emerald-50 text-emerald-700 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-2 text-center border-b min-w-[60px]">No</th>
              <th
                className="px-4 py-2 text-center border-b min-w-[120px] cursor-pointer select-none hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("userid")}
              >
                User ID {renderSortIndicator("userid")}
              </th>
              <th
                className="px-4 py-2 text-left border-b min-w-[200px] cursor-pointer select-none hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("name")}
              >
                Nama {renderSortIndicator("name")}
              </th>
              <th
                className="px-4 py-2 text-center border-b min-w-[100px] cursor-pointer select-none hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("class_name")}
              >
                Kelas {renderSortIndicator("class_name")}
              </th>
              <th
                className="px-4 py-2 text-center border-b min-w-[100px] cursor-pointer select-none hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("role")}
              >
                Role {renderSortIndicator("role")}
              </th>
              <th
                className="px-4 py-2 text-center border-b min-w-[100px] cursor-pointer select-none hover:text-emerald-700 transition-colors"
                onClick={() => handleSort("is_active")}
              >
                Status {renderSortIndicator("is_active")}
              </th>
              <th className="px-4 py-2 text-center border-b min-w-[120px]">Aksi</th>
            </tr>
          </thead>

          <tbody className="text-xs">
            {Array.isArray(data) && data.length > 0 ? (
              data.map((user, index) => (
                <tr
                  key={user.id}
                  className="hover:bg-emerald-50/50 transition-all duration-150 border-b last:border-none"
                >
                  <td className="px-4 py-2.5 text-center text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-2.5 text-center text-slate-500">{user.userid}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {user.name}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {user.class_name || <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 text-[9px] rounded font-semibold uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : user.role === "GURU"
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex justify-center scale-90">
                      <ToggleStatusButton
                        label={user.name}
                        isActive={user.is_active}
                        onConfirm={(newStatus) => onToggle(user.id, newStatus)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <ActionMenu
                      itemId={user.id}
                      onEdit={onEdit}
                      menu="user"
                      type={user.role}
                      onEditSiswa={onEditSiswa}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-slate-400 bg-slate-50/30 italic">
                  Tidak ada data pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((user, index) => (
            <div 
              key={user.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600' : user.role === 'GURU' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {(page - 1) * pageSize + index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight pr-8">{user.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      {user.userid}
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-0">
                   <ActionMenu
                    itemId={user.id}
                    onEdit={onEdit}
                    onEditSiswa={onEditSiswa}
                    onDelete={onDelete}
                    menu="user"
                    type={user.role}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Role</p>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    user.role === "ADMIN" ? "bg-rose-50 text-rose-600" :
                    user.role === "GURU" ? "bg-indigo-50 text-indigo-600" :
                    "bg-emerald-50 text-emerald-600"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Kelas</p>
                  <p className="text-xs font-semibold text-slate-700 uppercase">{user.class_name || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</p>
                  <div className="scale-75 origin-left">
                    <ToggleStatusButton
                      label={user.name}
                      isActive={user.is_active}
                      onConfirm={(newStatus) => onToggle(user.id, newStatus)}
                    />
                  </div>
                </div>
                <div className="flex items-end justify-end">
                   <button 
                    onClick={() => user.role === 'SISWA' ? onEditSiswa(user.id) : onEdit(user.id)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit Profil →
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
            Tidak ada data pengguna.
          </div>
        )}
      </div>
    </div>
  );
};

UserTable.propTypes = {
  data: PropTypes.array.isRequired,
  onRefresh: PropTypes.func.isRequired,
  searchParams: PropTypes.object.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onEditSiswa: PropTypes.func,
  onDelete: PropTypes.func,
};

export default UserTable;
