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

const emptyCharts = {
  submissionByYear: [],
  averageScoreByYear: [],
  roleSummary: { siswa: 0, guru: 0, admin: 0 },
};

const buildFiveYearSeries = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, idx) => ({
    year: currentYear - 4 + idx,
    total: 0,
    average: 0,
  }));
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

const BarChartCard = ({ title, items }) => {
  const series = items?.length ? items : buildFiveYearSeries();
  const max = Math.max(...series.map((item) => item.total), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="mt-4 space-y-3">
        {series.map((item) => (
          <div key={item.year}>
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>{item.year}</span>
              <span className="font-semibold text-slate-800">{item.total}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                style={{ width: `${Math.max((item.total / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieChartCard = ({ title, roleSummary }) => {
  let items = [
    { label: "Siswa", value: roleSummary.siswa || 0 },
    { label: "Guru", value: roleSummary.guru || 0 },
    { label: "Admin", value: roleSummary.admin || 0 },
  ];
  const rawTotal = items.reduce((acc, item) => acc + item.value, 0);
  if (rawTotal === 0) {
    items = items.map((item) => ({ ...item, value: 1 }));
  }
  const total = items.reduce((acc, item) => acc + item.value, 0) || 1;
  let cumulative = 0;
  const colors = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"];

  const slices = items.map((item, index) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    const largeArc = end - start > 0.5 ? 1 : 0;
    const startX = 50 + 40 * Math.cos(2 * Math.PI * start - Math.PI / 2);
    const startY = 50 + 40 * Math.sin(2 * Math.PI * start - Math.PI / 2);
    const endX = 50 + 40 * Math.cos(2 * Math.PI * end - Math.PI / 2);
    const endY = 50 + 40 * Math.sin(2 * Math.PI * end - Math.PI / 2);
    const d = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
    return { ...item, d, color: colors[index % colors.length] };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
        <svg viewBox="0 0 100 100" className="h-52 w-52">
          {slices.map((slice) => (
            <path key={slice.label} d={slice.d} fill={slice.color} />
          ))}
        </svg>
        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-600">{slice.label}</span>
              <span className="font-semibold text-slate-800">
                {rawTotal === 0 ? 0 : slice.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LineChartCard = ({ title, items }) => {
  const series = items?.length ? items : buildFiveYearSeries();
  const max = Math.max(...series.map((item) => item.average), 1);
  const points = series
    .map((item, idx) => {
      const x = (idx / Math.max(series.length - 1, 1)) * 100;
      const y = 95 - (item.average / max) * 85;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <svg viewBox="0 0 100 100" className="mt-4 h-56 w-full">
        <polyline points="0,100 100,100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="2.5" />
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
        {series.map((item) => (
          <div key={item.year} className="rounded-lg bg-slate-50 px-2 py-1">
            {item.year}: <span className="font-semibold text-slate-800">{item.average}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [summary, setSummary] = useState(emptySummary);
  const [charts, setCharts] = useState(emptyCharts);
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
          const [usersRes, subjectsRes, examsRes, chartRes] = await Promise.all([
            api.get("/users", { params: { page: 1, limit: 1 } }),
            api.get("/users/role", { params: { role: "SISWA", page: 1, limit: 1 } }),
            api.get("/subjects", { params: { page: 1, limit: 1 } }),
            api.get("/exams", { params: { page: 1, limit: 1 } }),
            api
              .get("/reports/dashboard-charts")
              .catch(() => ({ data: emptyCharts })),
          ]);

          setSummary({
            totalUsers: usersRes.data?.meta?.total || 0,
            totalStudents: usersRes.data?.total || 0,
            totalSubjects: subjectsRes.data?.meta?.total || 0,
            totalExams: examsRes.data?.meta?.total || 0,
            todayExams: 0,
            teacherExams: 0,
          });
          setCharts(chartRes.data || emptyCharts);
          return;
        }

        if (role === "GURU") {
          const [teacherExamRes, subjectsRes, chartRes] = await Promise.all([
            api.get("/teacher-exams", { params: { page: 1, limit: 1 } }),
            api.get("/subjects", { params: { page: 1, limit: 1 } }),
            api
              .get("/reports/dashboard-charts")
              .catch(() => ({ data: emptyCharts })),
          ]);

          setSummary({
            ...emptySummary,
            teacherExams: teacherExamRes.data?.meta?.total || 0,
            totalSubjects: subjectsRes.data?.meta?.total || 0,
          });
          setCharts(chartRes.data || emptyCharts);
          return;
        }

        const todayExamRes = await api.get("/exams/today", {
          params: { page: 1, limit: 1 },
        });

        setSummary({
          ...emptySummary,
          todayExams: todayExamRes.data?.meta?.total || 0,
        });
        setCharts(emptyCharts);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
        setSummary(emptySummary);
        setCharts(emptyCharts);
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
          <div className="space-y-4">
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BarChartCard
                title="Total Submission Ujian per Tahun (5 Tahun)"
                items={charts.submissionByYear || []}
              />
              <PieChartCard title="Komposisi User (Siswa/Guru/Admin)" roleSummary={charts.roleSummary || {}} />
            </div>
            <LineChartCard
              title="Rata-rata Nilai Siswa per Tahun (5 Tahun)"
              items={charts.averageScoreByYear || []}
            />
          </div>
        ) : role === "GURU" ? (
          <div className="space-y-4">
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BarChartCard
                title="Total Submission Ujian per Tahun (5 Tahun)"
                items={charts.submissionByYear || []}
              />
              <PieChartCard title="Komposisi User (Siswa/Guru/Admin)" roleSummary={charts.roleSummary || {}} />
            </div>
            <LineChartCard
              title="Rata-rata Nilai Siswa per Tahun (5 Tahun)"
              items={charts.averageScoreByYear || []}
            />
          </div>
        ) : (
          <div className="space-y-4">
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
            <LineChartCard
              title="Progress Harian Siswa"
              items={[
                { year: "Target", average: 1 },
                { year: "Aktual", average: summary.todayExams },
              ]}
            />
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default Dashboard;
