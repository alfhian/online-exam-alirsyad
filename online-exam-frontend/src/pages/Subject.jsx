import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { FaBookOpen } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import SubjectTable from "../components/Subjects/SubjectTable";
import Pagination from "../components/Paginate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import ClassSelect from "../components/DropdownClass";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);

const Subjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [meta, setMeta] = useState({ total: 0 });
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    class_id: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/subjects", {
        params: { search, sort, order, page, limit: pageSize },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setData(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0 });
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      MySwal.fire("Error", "Gagal mengambil data mata pelajaran.", "error");
      setData([]);
      setMeta({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleSubmit = async () => {
    try {
      await api.post("/subjects", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setShowModal(false);
      MySwal.fire("Berhasil!", "Mata Pelajaran berhasil ditambahkan.", "success");
      fetchData();
    } catch (err) {
      MySwal.fire("Gagal!", "Gagal menambah Mata Pelajaran.", "error");
      console.error("Failed to add subject:", err);
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await api.get(`/subjects/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = res.data;
      setFormData({
        id: data.id,
        name: data.name,
        description: data.description,
        class_id: data.class_id,
      });
      setSelectedId(data.id);
      setEditModalOpen(true);
    } catch (err) {
      MySwal.fire("Error", "Gagal mengambil data Mata Pelajaran.", "error");
      console.error("Failed to fetch subject for edit:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(
        `/subjects/${selectedId}`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setEditModalOpen(false);
      MySwal.fire("Berhasil!", "Mata Pelajaran berhasil diperbarui.", "success");
      fetchData();
    } catch (err) {
      MySwal.fire("Gagal!", "Gagal memperbarui Mata Pelajaran.", "error");
      console.error("Failed to update subject:", err);
    }
  };

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner font-poppins">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <FaBookOpen className="text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Daftar Mata Pelajaran
            </h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors duration-200"
          >
            + Tambah Mata Pelajaran
          </button>
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
          ) : data.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              Tidak ada data mata pelajaran yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <SubjectTable
                  data={data}
                  onRefresh={fetchData}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  onEdit={handleEdit}
                />
              </div>

              {/* Pagination Info */}
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

        {/* Modal Tambah */}
        <Transition appear show={showModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowModal(false)}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm" />
            </TransitionChild>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <DialogTitle className="text-lg font-semibold text-gray-800">
                      Tambah Mata Pelajaran
                    </DialogTitle>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nama
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Kelas
                        </label>
                        <div className="border border-gray-300 rounded-lg">
                          <ClassSelect
                            classes={formData.class_id}
                            setClasses={(value) =>
                              setFormData((prev) => ({ ...prev, class_id: value }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Deskripsi
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Simpan
                      </button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal Edit */}
        <Transition appear show={editModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setEditModalOpen(false)}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm" />
            </TransitionChild>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <DialogTitle className="text-lg font-semibold text-gray-800">
                      Edit Mata Pelajaran
                    </DialogTitle>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nama
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Kelas
                        </label>
                        <div className="border border-gray-300 rounded-lg">
                          <ClassSelect
                            classes={formData.class_id}
                            setClasses={(value) =>
                              setFormData((prev) => ({ ...prev, class_id: value }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Deskripsi
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                      <button
                        onClick={() => setEditModalOpen(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </Sidebar>
  );
};

export default Subjects;
