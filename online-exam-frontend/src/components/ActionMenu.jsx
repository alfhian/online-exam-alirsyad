import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import { 
  EllipsisVerticalIcon, 
  PencilSquareIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  PlayIcon, 
  EyeIcon, 
  CheckBadgeIcon,
  TrashIcon 
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import api from "../api/axiosConfig";

export default function ActionMenu({
  itemId,
  onEdit,
  menu,
  type,
  onShowStudents,
  onEditSiswa,
  onStart,
  onDelete,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ✅ Mulai ujian siswa
  const handleStartExam = async (examId) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/exam-submissions/${examId}/me`);

      if (data?.submitted) {
        Swal.fire({
          title: "Peringatan!",
          text: "Anda sudah mengerjakan ujian ini.",
          icon: "warning",
          customClass: { popup: 'rounded-3xl' }
        });
        return;
      }

      navigate(`/student/exam/${examId}`);
    } catch (err) {
      console.error("Error check submission:", err);
      Swal.fire({
        title: "Error",
        text: "Gagal memeriksa status ujian",
        icon: "error",
        customClass: { popup: 'rounded-3xl' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaire = () => navigate(`/exam/${itemId}/questionnaire`);
  const handleViewDetail = () => navigate(`/exam-submissions/${itemId}`);
  const handleScoring = () => navigate(`/teacher-exam/submission/${itemId}`);

  const ActionItem = ({ onClick, icon: Icon, label, variant = "default" }) => (
    <MenuItem>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${
            active ? "bg-slate-50 text-emerald-600" : "text-slate-600"
          } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors`}
        >
          <Icon className={`h-4 w-4 transition-transform ${active ? 'scale-110' : ''}`} />
          {label}
        </button>
      )}
    </MenuItem>
  );

  return (
    <div className="relative inline-block text-left">
      <Menu as="div" className="relative">
        <div>
          <MenuButton
            className="h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all focus:outline-none border border-transparent hover:border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-slate-500" />
          </MenuButton>
        </div>

        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems
            className="fixed z-50 mt-2 w-48 origin-top-right right-0 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 focus:outline-none overflow-hidden"
          >
            <div className="py-1">
              {/* 🔧 Menu umum untuk Edit */}
              {(menu == "exam" ||
                 menu == "user" ||
                 menu == "subjects" ||
                 menu == "questionnaire") &&
                type !== "SISWA" && (
                  <ActionItem onClick={() => onEdit(itemId)} icon={PencilSquareIcon} label="Edit Data" />
                )}

              {/* 🔧 Menu khusus siswa */}
              {menu === "user" && type === "SISWA" && (
                <ActionItem onClick={() => onEditSiswa(itemId)} icon={PencilSquareIcon} label="Edit Siswa" />
              )}

              {/* 🔧 Untuk remedial: daftar siswa */}
              {type === "REMEDIAL" && (
                <ActionItem onClick={() => onShowStudents(itemId)} icon={UserGroupIcon} label="Students" />
              )}

              {/* 🔧 Untuk ujian → buka questionnaire */}
              {menu === "exam" && (
                <ActionItem onClick={handleQuestionnaire} icon={DocumentTextIcon} label="Questionnaire" />
              )}

              {/* 🔧 Untuk siswa mulai ujian */}
              {menu === "studentExam" && (
                <ActionItem 
                  onClick={() => handleStartExam(itemId)} 
                  icon={PlayIcon} 
                  label={loading ? "Loading..." : "Mulai Ujian"} 
                />
              )}

              {/* 🔧 Halaman hasil ujian */}
              {menu === "submittedExam" && (
                <ActionItem onClick={handleViewDetail} icon={EyeIcon} label="Lihat Detail" />
              )}

              {/* 🔧 Guru lihat daftar siswa */}
              {menu === "teacherExam" && (
                <ActionItem onClick={() => onShowStudents(itemId)} icon={UserGroupIcon} label="Daftar Siswa" />
              )}

              {/* 🔧 Guru memberi nilai */}
              {menu === "teacherExamSubmission" && (
                <ActionItem onClick={handleScoring} icon={CheckBadgeIcon} label="Beri Nilai" />
              )}

              {/* 🗑️ Hapus (untuk menu yang mendukung) */}
              {onDelete && (
                <div className="border-t border-slate-100 my-1">
                  <ActionItem 
                    onClick={() => onDelete(itemId)} 
                    icon={TrashIcon} 
                    label="Hapus" 
                  />
                </div>
              )}
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
}
