import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import SearchBar from "../components/Users/SearchBar";
import ExamTable from "../components/Exams/ExamTable";
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
import SubjectSelect from "../components/DropdownSubject";
import CustomDatePicker from "../components/CustomDatePicker";
import ExamTypeSelect from "../components/DropdownExamType";
import { format } from "date-fns";
import { FaClipboardList } from "react-icons/fa";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);

const Exam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [meta, setMeta] = useState({ total: 0 });
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    type: "Reguler",
    date: "",
    duration: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setFormData((prev) => ({ ...prev, date: formatted }));
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/exams", {
        params: { search, page, limit: pageSize },
      });
      setExams(Array.isArray(res.data?.data) ? res.data.data : []);
      setMeta(res.data?.meta || { total: 0 });
    } catch {
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil data ujian.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page]);

  const handleSubmit = async () => {
    try {
      await api.post("/exams", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowModal(false);
      MySwal.fire({
        title: "Berhasil!",
        text: `Ujian berhasil ditambahkan.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchExams();
    } catch {
      MySwal.fire({
        title: "Gagal!",
        text: `Tidak dapat menambah ujian.`,
        icon: "error",
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await api.get(`/exams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const exam = res.data;
      if (exam) {
        setFormData({
          title: exam.title,
          subject_id: exam.subject_id,
          type: exam.type,
          date: exam.date,
          duration: exam.duration,
        });
        setSelectedId(exam.id);
        setEditModalOpen(true);
      }
    } catch {
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil data ujian untuk diedit.",
        icon: "error",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(
        `/exams/${selectedId}`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setEditModalOpen(false);
      MySwal.fire({
        title: "Berhasil!",
        text: "Ujian berhasil diperbarui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchExams();
    } catch {
      MySwal.fire({
        title: "Gagal!",
        text: "Tidak dapat memperbarui ujian.",
        icon: "error",
      });
    }
  };

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <FaClipboardList className="text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Daftar Ujian</h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all"
          >
            + Tambah Ujian
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <SearchBar value={search} />

          {loading ? (
            <div className="mt-6 animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <ExamTable
                  data={exams}
                  onRefresh={fetchExams}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  onEdit={handleEdit}
                />
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  {meta.total > 0 && (
                    <span>
                      Menampilkan{" "}
                      <strong>{(page - 1) * pageSize + 1}</strong> -{" "}
                      <strong>{Math.min(page * pageSize, meta.total)}</strong>{" "}
                      dari <strong>{meta.total}</strong> ujian
                    </span>
                  )}
                </div>
                <Pagination
                  current={page}
                  total={meta.total}
                  pageSize={pageSize}
                  onPageChange={(p) => setSearchParams({ page: p })}
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Tambah/Edit */}
        <Transition appear show={showModal || editModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => {
              setShowModal(false);
              setEditModalOpen(false);
            }}
          >
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                  <DialogPanel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-gray-200 transition-all">
                    <DialogTitle
                      as="h3"
                      className="text-xl font-semibold text-gray-800 mb-4"
                    >
                      {showModal ? "Tambah Ujian Baru" : "Edit Ujian"}
                    </DialogTitle>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Judul Ujian
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        />
                      </div>

                      <CustomDatePicker
                        label="Tanggal Ujian"
                        selectedDate={formData.date}
                        onChange={handleDateChange}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Jenis Ujian
                        </label>
                        <div className="border border-gray-300 rounded-lg">
                          <ExamTypeSelect
                            type={formData.type}
                            setType={(value) =>
                              setFormData((prev) => ({ ...prev, type: value }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Durasi (menit)
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mata Pelajaran
                        </label>
                        <div className="border border-gray-300 rounded-lg">
                          <SubjectSelect
                            subject={formData.subject_id}
                            setSubject={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                subject_id: value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditModalOpen(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        onClick={showModal ? handleSubmit : handleUpdate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                      >
                        {showModal ? "Simpan" : "Perbarui"}
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

export default Exam;
