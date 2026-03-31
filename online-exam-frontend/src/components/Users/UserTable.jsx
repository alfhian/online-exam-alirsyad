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

const UserTable = ({ data, onRefresh, searchParams, setSearchParams, onEdit, onEditSiswa }) => {
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";

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
      <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm text-gray-700">
        <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
          <tr>
            <th
              className="px-4 py-3 text-center border-b min-w-[80px] select-none hover:text-emerald-700"
            >
              No
            </th>
            <th
              className="px-4 py-3 text-center border-b min-w-[80px] cursor-pointer select-none hover:text-emerald-700"
              onClick={() => handleSort("userid")}
            >
              User ID {renderSortIndicator("userid")}
            </th>
            <th
              className="px-4 py-3 text-center border-b min-w-[160px] cursor-pointer select-none hover:text-emerald-700"
              onClick={() => handleSort("name")}
            >
              Nama {renderSortIndicator("name")}
            </th>
            <th
              className="px-4 py-3 text-center border-b min-w-[100px] cursor-pointer select-none hover:text-emerald-700"
              onClick={() => handleSort("role")}
            >
              Role {renderSortIndicator("role")}
            </th>
            <th
              className="px-4 py-3 text-center border-b min-w-[100px] cursor-pointer select-none hover:text-emerald-700"
              onClick={() => handleSort("is_active")}
            >
              Status {renderSortIndicator("is_active")}
            </th>
            <th
              className="px-4 py-3 text-center border-b min-w-[140px] cursor-pointer select-none hover:text-emerald-700"
              onClick={() => handleSort("created_at")}
            >
              Dibuat {renderSortIndicator("created_at")}
            </th>
            <th className="px-4 py-3 text-center border-b min-w-[120px]">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((user, index) => (
              <tr
                key={user.userid}
                className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
              >
                <td className="px-4 py-3 text-center">{index+1}</td>
                <td className="px-4 py-3 text-center">{user.userid}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-red-100 text-red-700"
                        : user.role === "GURU"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleStatusButton
                    label={user.name}
                    isActive={user.is_active}
                    onConfirm={(newStatus) => onToggle(user.id, newStatus)}
                  />
                </td>
                <td className="px-4 py-3 text-center">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <ActionMenu
                    itemId={user.id}
                    onEdit={onEdit}
                    menu="user"
                    type={user.role}
                    onEditSiswa={onEditSiswa}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="px-4 py-6 text-center text-gray-500 bg-gray-50 italic"
              >
                Tidak ada data pengguna.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
};

export default UserTable;
