import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosConfig";
import SubjectSelect from "../components/DropdownSubject";
import * as XLSX from "xlsx";

const toCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
};

const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState("exam");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    subjectId: "",
    examType: "",
  });

  const [examRows, setExamRows] = useState([]);
  const [submissionRows, setSubmissionRows] = useState([]);
  const [subjectRows, setSubjectRows] = useState([]);
  const [studentRows, setStudentRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const payload = {};
    if (filters.from) payload.from = filters.from;
    if (filters.to) payload.to = filters.to;
    if (filters.subjectId) payload.subjectId = filters.subjectId;
    if (filters.examType) payload.examType = filters.examType;
    return payload;
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examRes, submissionRes, subjectRes, studentRes] = await Promise.all([
        api.get("/reports/exam-performance", { params }),
        api.get("/reports/submission-list", { params }),
        api.get("/reports/subject-summary", { params }),
        api.get("/reports/student-score-summary", { params }),
      ]);

      setExamRows(examRes.data || []);
      setSubmissionRows(submissionRes.data || []);
      setSubjectRows(subjectRes.data || []);
      setStudentRows(studentRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params]);

  const normalizedRows = useMemo(() => {
    if (activeTab === "exam") {
      return examRows.map((row) => ({
        judul: row.title,
        tipe: row.type,
        tanggal: row.date,
        durasi: row.duration,
        mapel: row.subjects?.name || "-",
        kelas: row.subjects?.class_id || "-",
      }));
    }

    if (activeTab === "submission") {
      return submissionRows.map((row) => ({
        ujian: row.exams?.title || "-",
        tipe: row.exams?.type || "-",
        mapel: row.exams?.subjects?.name || "-",
        siswa: row.users?.name || "-",
        nis_nik: row.users?.userid || "-",
        nilai: row.score ?? "-",
        submit_at: row.created_at,
      }));
    }

    if (activeTab === "subject") {
      return subjectRows.map((row) => ({
        mapel: row.subject,
        kelas: row.class_id,
        total_siswa: row.totalStudents,
        total_ujian: row.totalExams,
        total_submission: row.totalSubmissions,
        sudah_dinilai: row.scoredSubmissions,
        belum_dinilai: row.unscoredSubmissions,
        rata_rata: row.averageScore == null ? "-" : Number(row.averageScore).toFixed(2),
        nilai_tertinggi: row.highestScore ?? "-",
        nilai_terendah: row.lowestScore ?? "-",
        lulus: row.passedCount,
        belum_lulus: row.failedCount,
      }));
    }

    return studentRows.map((row) => ({
      siswa: row.student,
      nis_nik: row.userid,
      mapel_diikuti: row.subjects || "-",
      total_mapel: row.totalSubjects,
      total_ujian: row.totalExams,
      total_submission: row.totalSubmissions,
      sudah_dinilai: row.scoredSubmissions,
      belum_dinilai: row.unscoredSubmissions,
      rata_rata: row.averageScore == null ? "-" : Number(row.averageScore).toFixed(2),
      nilai_tertinggi: row.highestScore ?? "-",
      nilai_terendah: row.lowestScore ?? "-",
      lulus: row.passedCount,
      belum_lulus: row.failedCount,
    }));
  }, [activeTab, examRows, submissionRows, subjectRows, studentRows]);

  const exportCsv = () => {
    downloadFile(toCsv(normalizedRows), `report-${activeTab}.csv`, "text/csv;charset=utf-8;");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(normalizedRows.length ? normalizedRows : [{ data: "Tidak ada data" }]);
    worksheet["!cols"] = Object.keys(normalizedRows[0] || { data: "" }).map((key) => ({
      wch: Math.max(14, key.length + 4),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `report-${activeTab}.xlsx`);
  };

  return (
    <Sidebar>
      <div className="module-shell space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h1 className="module-title">Laporan Akademik</h1>
          <p className="mt-2 text-slate-600">
            Filter data, lihat laporan, lalu export CSV/Excel. Filter tanggal memakai tanggal ujian untuk Report Ujian,
            dan tanggal submit untuk laporan nilai/submission.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Dari tanggal</span>
              <input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span>Sampai tanggal</span>
              <input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            </label>
            <SubjectSelect subject={filters.subjectId} setSubject={(v) => setFilters((p) => ({ ...p, subjectId: v || "" }))} />
            <select value={filters.examType} onChange={(e) => setFilters((p) => ({ ...p, examType: e.target.value }))}>
              <option value="">Semua Tipe</option>
              <option value="REGULER">Reguler</option>
              <option value="REMEDIAL">Remedial</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:flex">
              <button className={`module-action-btn ${activeTab === "exam" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("exam")}>Report Ujian</button>
              <button className={`module-action-btn ${activeTab === "submission" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("submission")}>Report Submission</button>
              <button className={`module-action-btn ${activeTab === "subject" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("subject")}>Report Mapel</button>
              <button className={`module-action-btn ${activeTab === "student" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("student")}>Report Nilai Siswa</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button className="module-action-btn bg-slate-100 text-slate-700" onClick={exportCsv}>Export CSV</button>
              <button className="module-action-btn bg-emerald-600 text-white" onClick={exportExcel}>Export Excel</button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500 text-xs italic">Loading report...</p>
          ) : (
            <>
              <div className="hidden lg:block table-shell overflow-x-auto">
                <table className="w-full text-sm text-slate-700">
                  <thead className="bg-emerald-50 text-emerald-700 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      {normalizedRows[0]
                        ? Object.keys(normalizedRows[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left border-b">
                              {key.replaceAll("_", " ")}
                            </th>
                          ))
                        : <th className="px-4 py-3 text-left border-b">Data</th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {normalizedRows.length ? (
                      normalizedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors border-b last:border-none">
                          {Object.values(row).map((val, i) => (
                            <td key={`${idx}-${i}`} className="px-4 py-3">{String(val ?? "-")}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-12 text-center text-slate-400 italic">Tidak ada data report untuk filter ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4">
                {normalizedRows.length ? (
                  normalizedRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
                    >
                      <div className="flex gap-3 items-start relative z-10">
                        <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 leading-tight truncate">
                            {row.judul || row.ujian || row.mapel || row.siswa || "Laporan"}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            {row.tipe || row.kelas || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 relative z-10">
                        {Object.entries(row).map(([key, val], i) => (
                          key !== "judul" && key !== "ujian" && key !== "mapel" && key !== "siswa" && key !== "tipe" && key !== "kelas" && (
                            <div key={i}>
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">{key.replaceAll("_", " ")}</p>
                              <p className="text-xs font-semibold text-slate-700 truncate">{String(val ?? "-")}</p>
                            </div>
                          )
                        ))}
                        {(row.kelas || row.mapel) && !row.judul && !row.ujian && (
                           <div>
                             <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Info</p>
                             <p className="text-xs font-semibold text-slate-700">{row.kelas || row.mapel}</p>
                           </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-400 italic border border-slate-100">
                    Tidak ada data laporan.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default Reports;
