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
  FaChartLine,
  FaClock,
  FaAward,
  FaCalendarAlt,
  FaChevronRight,
} from "react-icons/fa";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

const StatCard = ({ icon: Icon, title, value, tone = "emerald", subtitle }) => {
  const colors = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    indigo: "from-indigo-500 to-blue-600 shadow-indigo-500/20",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative z-10 flex flex-col h-full rounded-[1.4rem] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`rounded-2xl bg-gradient-to-br ${colors} p-4 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="text-2xl" />
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Data</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
          <p className="mt-1 text-4xl font-black text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br ${colors} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`}></div>
    </div>
  );
};

const ChartContainer = ({ title, children, icon: Icon }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-sm p-8 shadow-sm">
    <div className="flex items-center gap-3 mb-8">
      {Icon && <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><Icon /></div>}
      <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
    {children}
  </div>
);

const BarChartCard = ({ title, items }) => {
  const series = items?.length ? items : buildFiveYearSeries();
  const max = Math.max(...series.map((item) => item.total), 1);
  return (
    <ChartContainer title={title} icon={FaChartLine}>
      <div className="mt-4 space-y-5">
        {series.map((item) => (
          <div key={item.year} className="group">
            <div className="mb-2 flex justify-between items-end">
              <span className="text-sm font-bold text-slate-500">{item.year}</span>
              <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.total} <span className="text-[10px] text-slate-400 font-medium">Ujian</span></span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.max((item.total / max) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartContainer>
  );
};

const PieChartCard = ({ title, roleSummary }) => {
  let items = [
    { label: "Siswa", value: roleSummary.siswa || 0, tone: 'emerald' },
    { label: "Guru", value: roleSummary.guru || 0, tone: 'indigo' },
    { label: "Admin", value: roleSummary.admin || 0, tone: 'violet' },
  ];
  const rawTotal = items.reduce((acc, item) => acc + item.value, 0);
  if (rawTotal === 0) {
    items = items.map((item) => ({ ...item, value: 1 }));
  }
  const total = items.reduce((acc, item) => acc + item.value, 0) || 1;
  let cumulative = 0;
  const colors = {
    emerald: "#10b981",
    indigo: "#6366f1",
    violet: "#8b5cf6",
  };

  const slices = items.map((item) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    const largeArc = end - start > 0.5 ? 1 : 0;
    const startX = 50 + 40 * Math.cos(2 * Math.PI * start - Math.PI / 2);
    const startY = 50 + 40 * Math.sin(2 * Math.PI * start - Math.PI / 2);
    const endX = 50 + 40 * Math.cos(2 * Math.PI * end - Math.PI / 2);
    const endY = 50 + 40 * Math.sin(2 * Math.PI * end - Math.PI / 2);
    const d = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
    return { ...item, d, color: colors[item.tone] };
  });

  return (
    <ChartContainer title={title} icon={FaUsers}>
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="h-48 w-48 drop-shadow-xl transform transition-transform duration-500 hover:rotate-6">
            {slices.map((slice) => (
              <path key={slice.label} d={slice.d} fill={slice.color} className="transition-all duration-300 hover:opacity-80 cursor-pointer" />
            ))}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-2xl font-black text-slate-800">{rawTotal}</span>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total User</span>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 w-full">
          {slices.map((slice) => (
            <div key={slice.label} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
              <span className="h-2 w-6 rounded-full mb-2" style={{ backgroundColor: slice.color }} />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{slice.label}</span>
              <span className="text-lg font-black text-slate-900">{rawTotal === 0 ? 0 : slice.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
};

const StudentSubmissions = ({ submissions }) => (
  <ChartContainer title="Hasil Ujian Terbaru" icon={FaAward}>
    <div className="space-y-4">
      {submissions.length > 0 ? (
        submissions.slice(0, 5).map((sub) => (
          <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:border-emerald-100 group">
            <div className="flex items-center gap-4">
               <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transition-colors ${sub.score >= 75 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                 {sub.score || 0}
               </div>
               <div>
                 <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{sub.exams?.title || 'Ujian'}</h4>
                 <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                   <FaCalendarAlt className="text-[10px]" /> {format(new Date(sub.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                 </p>
               </div>
            </div>
            <FaChevronRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
           <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
             <FaAward className="text-3xl" />
           </div>
           <p className="text-slate-500 font-medium">Belum ada hasil ujian yang tersedia.</p>
        </div>
      )}
    </div>
  </ChartContainer>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(emptySummary);
  const [charts, setCharts] = useState(emptyCharts);
  const [submissions, setSubmissions] = useState([]);
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

  const userName = useMemo(() => {
    if (!token) return "";
    try {
      return jwtDecode(token)?.name || "";
    } catch {
      return "";
    }
  }, [token]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        if (role === "ADMIN") {
          const [usersRes, studentsRes, subjectsRes, examsRes, chartRes] = await Promise.all([
            api.get("/users", { params: { page: 1, limit: 1 } }),
            api.get("/users/role", { params: { role: "SISWA", page: 1, limit: 1 } }),
            api.get("/subjects", { params: { page: 1, limit: 1 } }),
            api.get("/exams", { params: { page: 1, limit: 1 } }),
            api.get("/reports/dashboard-charts").catch(() => ({ data: emptyCharts })),
          ]);

          setSummary({
            totalUsers: usersRes.data?.meta?.total || 0,
            totalStudents: studentsRes.data?.meta?.total || 0,
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
            api.get("/reports/dashboard-charts").catch(() => ({ data: emptyCharts })),
          ]);

          setSummary({
            ...emptySummary,
            teacherExams: teacherExamRes.data?.meta?.total || 0,
            totalSubjects: subjectsRes.data?.meta?.total || 0,
          });
          setCharts(chartRes.data || emptyCharts);
          return;
        }

        // SISWA
        const [todayExamRes, submissionsRes] = await Promise.all([
           api.get("/exams/today", { params: { page: 1, limit: 1 } }),
           api.get("/exam-submissions/me", { params: { page: 1, limit: 5 } })
        ]);

        setSummary({
          ...emptySummary,
          todayExams: todayExamRes.data?.meta?.total || 0,
        });
        setSubmissions(submissionsRes.data?.data || []);
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {userName || "Pengguna"}! 👋
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Senang melihat Anda kembali. Berikut adalah ringkasan aktivitas {role === 'SISWA' ? 'belajar' : 'akademik'} Anda hari ini.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
             <FaCalendarAlt className="text-emerald-500" />
             <span className="text-sm font-bold text-slate-700">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
             ))}
          </div>
        ) : role === "ADMIN" ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={FaUsers} title="Total Pengguna" value={summary.totalUsers} tone="indigo" subtitle="Semua Akun Terdaftar" />
              <StatCard icon={FaUserGraduate} title="Siswa Aktif" value={summary.totalStudents} tone="emerald" subtitle="Siswa Terverifikasi" />
              <StatCard icon={FaBookOpen} title="Mata Pelajaran" value={summary.totalSubjects} tone="violet" subtitle="Materi Pembelajaran" />
              <StatCard icon={FaClipboardCheck} title="Total Ujian" value={summary.totalExams} tone="amber" subtitle="Ujian Dilaksanakan" />
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <BarChartCard title="Statistik Ujian" items={charts.submissionByYear || []} />
              <PieChartCard title="Komposisi Pengguna" roleSummary={charts.roleSummary || {}} />
            </div>
          </div>
        ) : role === "GURU" ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={FaChalkboardTeacher} title="Ujian Saya" value={summary.teacherExams} tone="emerald" subtitle="Ujian yang dikelola" />
              <StatCard icon={FaBookOpen} title="Mata Pelajaran" value={summary.totalSubjects} tone="indigo" subtitle="Materi Pengajaran" />
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-200 flex flex-col justify-between">
                 <FaAward className="text-4xl opacity-30 mb-4" />
                 <div>
                   <p className="text-indigo-100 font-bold text-sm uppercase tracking-widest mb-1">Status Guru</p>
                   <h3 className="text-2xl font-black">Professional Educator</h3>
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <BarChartCard title="Aktivitas Ujian" items={charts.submissionByYear || []} />
              <PieChartCard title="Demografi Siswa" roleSummary={charts.roleSummary || {}} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={FaClipboardCheck} title="Ujian Hari Ini" value={summary.todayExams} tone="emerald" subtitle="Ujian yang harus dikerjakan" />
              <StatCard icon={FaClock} title="Jam Belajar" value="-" tone="amber" subtitle="Total waktu pengerjaan" />
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                 <div className="relative z-10">
                   <p className="text-emerald-100 font-bold text-sm uppercase tracking-widest mb-2">Quotes Hari Ini</p>
                   <h3 className="text-xl font-bold leading-tight">"Pendidikan adalah senjata paling ampuh untuk mengubah dunia."</h3>
                   <p className="mt-4 text-xs font-medium text-emerald-100/80 italic">— Nelson Mandela</p>
                 </div>
                 <FaAward className="absolute -right-4 -bottom-4 text-8xl text-white/10 rotate-12 transition-transform duration-500 group-hover:scale-125" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                 <StudentSubmissions submissions={submissions} />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                 <h3 className="text-xl font-bold text-slate-800 mb-6">Tips Sukses</h3>
                 <ul className="space-y-6">
                    <li className="flex gap-4">
                       <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">1</div>
                       <p className="text-sm text-slate-600 leading-relaxed">Baca instruksi ujian dengan teliti sebelum memulai pengerjaan.</p>
                    </li>
                    <li className="flex gap-4">
                       <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">2</div>
                       <p className="text-sm text-slate-600 leading-relaxed">Manfaatkan waktu sebaik mungkin, jangan terburu-buru.</p>
                    </li>
                    <li className="flex gap-4">
                       <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">3</div>
                       <p className="text-sm text-slate-600 leading-relaxed">Pastikan koneksi internet stabil selama ujian berlangsung.</p>
                    </li>
                 </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default Dashboard;
