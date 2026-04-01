import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import UserTable from "../components/Users/UserTable";
import Pagination from "../components/Paginate";
import RoleSelect from "../components/DropdownRole";
import ClassSelect from "../components/DropdownClass";
import GenderSelect from "../components/DropdownGender";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);
const initialFormData = {
  id: "",
  userid: "",
  nisn: "",
  name: "",
  gender: "",
  class_id: "",
  class_name: "",
  password: "",
  role: "ADMIN",
  description: "",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: "",
};

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSiswaModalOpen, setEditSiswaModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : {};
  const role = decoded.role;

  const [formData, setFormData] = useState(initialFormData);
  const resetForm = () => setFormData({ ...initialFormData, created_at: new Date().toISOString() });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", {
        params: { search, sort, order, page, limit: pageSize },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0 });
    } catch (err) {
      console.error("Failed to fetch users:", err);
      MySwal.fire("Error", "Gagal mengambil data pengguna.", "error");
      setUsers([]);
      setMeta({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, sort, order, page]);

  // Submit user
  const handleSubmit = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      resetForm();
      MySwal.fire("Berhasil!", "User berhasil ditambahkan.", "success");
      fetchUsers();
    } catch (err) {
      MySwal.fire("Gagal!", "Gagal menambah user.", "error");
    }
  };

  // Edit & update
  const handleEditUser = async (id) => {
    try {
      const res = await api.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setFormData(user);
      setSelectedUserId(user.id);
      setEditModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      
      MySwal.fire("Error", "Gagal mengambil data user.", "error");
    }
  };

  const handleEditSiswa = async (id) => {
    try {
      const res = await api.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      console.log(res.data);
      
      setFormData(user);
      setSelectedUserId(user.id);
      setEditSiswaModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch user data:', err);

      MySwal.fire("Error", "Gagal mengambil data user.", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(
        `/users/${selectedUserId}`,
        { ...formData, updated_at: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditModalOpen(false);
      resetForm();
      MySwal.fire("Berhasil!", "User berhasil diperbarui.", "success");
      fetchUsers();
    } catch (err) {
      MySwal.fire("Gagal!", "Gagal memperbarui user.", "error");
    }
  };

  const handleGenerateRandomToken = async () => {
    try {
      MySwal.fire({
        title: "Apakah Anda yakin?",
        text: "Token siswa akan diacak ulang.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, acak!",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          const res = await api.post(`/users/generate-password-siswa`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log(res.data);
          
          
          MySwal.fire("Berhasil!", "Token berhasil diacak menjadi "+res.data.password, "success");
        }
      });
    } catch (err) {
      MySwal.fire("Gagal!", "Gagal mengacak token.", "error");
    }
  };

  const AddUserModal = () => (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => { setShowModal(false); resetForm(); }}>
        <TransitionChild as={Fragment}>
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-xl">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Tambah User Baru
              </DialogTitle>

              <div className="mt-4 space-y-4">
                {/* NIK / NIS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIK / NIS</label>
                  <input
                    name="userid"
                    value={formData.userid}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* NISN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">NISN</label>
                  <input
                    name="nisn"
                    value={formData.nisn}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <GenderSelect
                    gender={formData.gender}
                    setGender={(v) => setFormData((p) => ({ ...p, gender: v }))}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <RoleSelect
                    role={formData.role}
                    setRole={(v) => setFormData((p) => ({ ...p, role: v }))}
                  />
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <ClassSelect
                    classes={formData.class_id}
                    setClasses={(v, name) =>
                      setFormData((p) => ({ ...p, class_id: v, class_name: name }))
                    }
                  />
                </div>

                {/* Nomor kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Kelas</label>
                  <input
                    name="class_name"
                    value={formData.class_name || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-200 rounded-lg">
                  Batal
                </button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
                  Simpan
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Modal Edit User (dengan field sama)
  const EditUserModal = () => (
    <Transition appear show={editModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => { setEditModalOpen(false); resetForm(); }}>
        <TransitionChild as={Fragment}>
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-xl">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Edit User
              </DialogTitle>

              <div className="mt-4 space-y-4">
                <input
                  name="userid"
                  value={formData.userid}
                  disabled
                  className="mt-1 w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full border px-3 py-2 rounded-lg"
                />
                <GenderSelect
                  gender={formData.gender}
                  setGender={(v) => setFormData((p) => ({ ...p, gender: v }))}
                />
                <RoleSelect
                  role={formData.role}
                  setRole={(v) => setFormData((p) => ({ ...p, role: v }))}
                />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={() => { setEditModalOpen(false); resetForm(); }} className="px-4 py-2 bg-gray-200 rounded-lg">
                  Batal
                </button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
                  Update
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // --- Modal khusus siswa ---
  const EditSiswaModal = () => (
    <Transition appear show={editSiswaModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => { setEditSiswaModalOpen(false); resetForm(); }}>
        <TransitionChild as={Fragment}>
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-xl">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Edit Data Siswa
              </DialogTitle>

              <div className="mt-4 space-y-4">
                {/* NISN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">NISN</label>
                  <input
                    name="nisn"
                    value={formData.nisn || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <GenderSelect
                    gender={formData.gender}
                    setGender={(v) => setFormData((p) => ({ ...p, gender: v }))}
                  />
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <ClassSelect
                    classes={formData.class_id}
                    setClasses={(v) =>
                      setFormData((p) => ({ ...p, class_id: v }))
                    }
                  />
                </div>

                {/* Nomor Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Kelas</label>
                  <input
                    name="class_name"
                    value={formData.class_name || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>


                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => { setEditSiswaModalOpen(false); resetForm(); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.put(
                        `/users/${selectedUserId}`,
                        { ...formData, updated_at: new Date().toISOString() },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setEditSiswaModalOpen(false);
                      resetForm();
                      MySwal.fire("Berhasil!", "Data siswa berhasil diperbarui.", "success");
                      fetchUsers();
                    } catch (err) {
                      MySwal.fire("Gagal!", "Gagal memperbarui data siswa.", "error");
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner font-poppins">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <FaUsers className="text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Manajemen Pengguna
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors duration-200"
            >
              + Tambah User
            </button>
            <button
              onClick={handleGenerateRandomToken}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors duration-200"
            >
              Acak Token
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 p-4 overflow-x-auto">
          <SearchBar value={search} />

          {loading ? (
            <div className="mt-6 animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Tidak ada data pengguna yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <UserTable
                  data={users}
                  onRefresh={fetchUsers}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  onEdit={handleEditUser}
                  onEditSiswa={handleEditSiswa}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3 text-sm text-gray-600">
                {meta.total > 0 && (
                  <span>
                    Menampilkan{" "}
                    <strong>{(page - 1) * pageSize + 1}</strong> hingga{" "}
                    <strong>{Math.min(page * pageSize, meta.total)}</strong> dari{" "}
                    <strong>{meta.total}</strong> entri
                  </span>
                )}
                <Pagination
                  current={page}
                  total={meta.total}
                  pageSize={pageSize}
                  onPageChange={(p) =>
                    setSearchParams({ search, sort, order, page: p.toString() })
                  }
                />
              </div>
            </>
          )}
        </div>
      
      {AddUserModal()}
      {EditUserModal()}
      {EditSiswaModal()}

      </div>
    </Sidebar>
  );
};

export default Users;
