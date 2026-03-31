import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function StudentsModal({ isOpen, onClose, examId }) {
  const MySwal = withReactContent(Swal);
  
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchStudents = async (page = 1) => {
    if (!examId) return;
    setLoading(true);

    try {
      const [allUsersRes, examUsersRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_BASE_URL}/users/role?role=SISWA&examId=${examId}&page=${page}&limit=${pagination.limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then((res) => res.json()),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/exams/${examId}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ]);

      setStudents(allUsersRes.data || []);
      setPagination({
        page: allUsersRes.page,
        limit: allUsersRes.limit,
        total: allUsersRes.total,
      });
      setSelectedStudents(
        Array.isArray(examUsersRes)
        ? examUsersRes.map((item) => item.student_id)
        : []
      );
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchStudents(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pagination.page]);

  const handleToggle = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/exams/${examId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });

      MySwal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data siswa berhasil disimpan.",
        timer: 1500,
        showConfirmButton: false,
      });

      if (!res.ok) throw new Error("Failed to save students");
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-poppins" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform rounded-2xl bg-white p-6 shadow-lg transition-all">
                <Dialog.Title className="text-lg font-semibold text-emerald-700">
                  Assign Students
                </Dialog.Title>

                <div className="mt-4 max-h-[60vh] overflow-y-auto border rounded-xl">
                  <table className="w-full text-sm text-gray-700">
                    <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">No</th>
                        <th className="px-4 py-3 text-center">NIS</th>
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-center">Kelas</th>
                        <th className="px-4 py-3 text-center">Pilih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-500 italic"
                          >
                            Loading data...
                          </td>
                        </tr>
                      ) : students.length > 0 ? (
                        students.map((student, index) => (
                          <tr
                            key={student.id}
                            className="hover:bg-emerald-50 transition-all duration-150 border-b last:border-none"
                          >
                            <td className="px-4 py-3">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800 text-center">
                              {student.userid}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {student.name}
                            </td>
                            <td className="px-4 py-3 text-center">{student.class_name || "-"}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                className="accent-emerald-600"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleToggle(student.id)}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-500 italic"
                          >
                            Tidak ada siswa ditemukan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                  <span>
                    Halaman {pagination.page} dari {totalPages} — Total {pagination.total} siswa
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded-lg border text-sm ${
                        pagination.page === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, totalPages),
                        }))
                      }
                      disabled={pagination.page >= totalPages}
                      className={`px-3 py-1 rounded-lg border text-sm ${
                        pagination.page >= totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                    onClick={onClose}
                  >
                    Batal
                  </button>
                  <button
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    onClick={handleSave}
                  >
                    Simpan
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
