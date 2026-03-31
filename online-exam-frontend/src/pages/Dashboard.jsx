import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosConfig";
import {
  FaBookOpen,
  FaUsers,
  FaUserGraduate,
  FaClipboardCheck,
  FaChalkboardTeacher,
} from "react-icons/fa";

const emptySummary = {
  totalUsers: 0,
  totalStudents: 0,
  totalSubjects: 0,
  totalExams: 0,
  todayExams: 0,
  teacherExams: 0,
};

const StatCard = ({ icon: Icon, title, value, tone = "emerald" }) => {
  const toneClass =
    {
      emerald: "bg-emerald-100 text-emerald-600",
      blue: "bg-blue-100 text-blue-600",
      violet: "bg-violet-100 text-violet-600",
      amber: "bg-amber-100 text-amber-600",
    }[tone] || "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${toneClass}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const role = useMemo(() => {
    if (!token) return "SISWA";
    try {
      return jwtDecode(token)?.role || "SISWA";
    } catch {
      return "SISWA";
    }
  }, [token]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        if (role === "ADMIN") {
          const [usersRes, subjectsRes, examsRes] = await Promise.all([
            api.get("/users", { params: { page: 1, limit: 1 } }),
            api.get("/subjects", { params: { page: 1, limit: 1 } }),
            api.get("/exams", { params: { page: 1, limit: 1 } }),
          ]);

          const users = usersRes.data?.meta?.total || 0;
          const students =
            usersRes.data?.data?.filter((item) => item.role === "SISWA").length || 0;

          setSummary({
            totalUsers: users,
            totalStudents: students,
            totalSubjects: subjectsRes.data?.meta?.total || 0,
            totalExams: examsRes.data?.meta?.total || 0,
            todayExams: 0,
            teacherExams: 0,
          });
          return;
        }

        if (role === "GURU") {
          const [teacherExamRes, subjectsRes] = await Promise.all([
            api.get("/teacher-exams", { params: { page: 1, limit: 1 } }),
            api.get("/subjects", { params: { page: 1, limit: 1 } }),
          ]);

          setSummary({
            ...emptySummary,
            teacherExams: teacherExamRes.data?.meta?.total || 0,
            totalSubjects: subjectsRes.data?.meta?.total || 0,
          });
          return;
        }

        const todayExamRes = await api.get("/exams/today", {
          params: { page: 1, limit: 1 },
        });

        setSummary({
          ...emptySummary,
          todayExams: todayExamRes.data?.meta?.total || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
        setSummary(emptySummary);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [role]);

  return (
    <Sidebar>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard {role}</h1>
          <p className="mt-2 text-slate-600">
            Ringkasan data terbaru berdasarkan hak akses akun Anda.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
            Memuat ringkasan dashboard...
          </div>
        ) : role === "ADMIN" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FaUsers} title="Total Pengguna" value={summary.totalUsers} />
            <StatCard
              icon={FaUserGraduate}
              title="Siswa Aktif"
              value={summary.totalStudents}
              tone="blue"
            />
            <StatCard
              icon={FaBookOpen}
              title="Total Mata Pelajaran"
              value={summary.totalSubjects}
              tone="violet"
            />
            <StatCard
              icon={FaClipboardCheck}
              title="Total Ujian"
              value={summary.totalExams}
              tone="amber"
            />
          </div>
        ) : role === "GURU" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard
              icon={FaChalkboardTeacher}
              title="Ujian yang Ditangani"
              value={summary.teacherExams}
              tone="emerald"
            />
            <StatCard
              icon={FaBookOpen}
              title="Mata Pelajaran"
              value={summary.totalSubjects}
              tone="blue"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard
              icon={FaClipboardCheck}
              title="Ujian Hari Ini"
              value={summary.todayExams}
              tone="emerald"
            />
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
              <p className="text-lg font-semibold">Tetap semangat belajar 🌟</p>
              <p className="mt-2 text-sm">
                Kerjakan ujian tepat waktu dan jaga fokus untuk hasil terbaik.
              </p>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default Dashboard;
