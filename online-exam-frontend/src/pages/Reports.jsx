import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const firstRelation = (value) => (Array.isArray(value) ? value[0] : value) || null;

const reportConfig = {
  ujian: {
    key: "exam",
    title: "Report Ujian",
    description: "Daftar ujian berdasarkan tanggal ujian, tipe, mapel, kelas, dan judul ujian.",
  },
  submission: {
    key: "submission",
    title: "Report Submission",
    description: "Daftar submission siswa berdasarkan tanggal submit, ujian, siswa, status nilai, dan rentang nilai.",
  },
  mapel: {
    key: "subject",
    title: "Report Mapel",
    description: "Ringkasan performa setiap mata pelajaran berdasarkan ujian dan submission siswa.",
  },
  "nilai-siswa": {
    key: "student",
    title: "Report Nilai Siswa",
    description: "Ringkasan nilai per siswa dengan filter nama, NIS, kelas, status kelulusan, dan rentang rata-rata.",
  },
};

const includesText = (value, keyword) =>
  !keyword || String(value ?? "").toLowerCase().includes(keyword.trim().toLowerCase());

const numberInRange = (value, min, max) => {
  const numberValue = value === "-" || value === null || value === undefined ? null : Number(value);
  if (min !== "" && (numberValue === null || numberValue < Number(min))) return false;
  if (max !== "" && (numberValue === null || numberValue > Number(max))) return false;
  return true;
};

const Reports = () => {
  const { reportType = "ujian" } = useParams();
  const navigate = useNavigate();
  const activeConfig = reportConfig[reportType] || reportConfig.ujian;
  const activeTab = activeConfig.key;
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    subjectId: "",
    examType: "",
    keyword: "",
    className: "",
    scoreMin: "",
    scoreMax: "",
    averageMin: "",
    averageMax: "",
    scoreStatus: "",
    passStatus: "",
    submissionMin: "",
  });

  const [examRows, setExamRows] = useState([]);
  const [submissionRows, setSubmissionRows] = useState([]);
  const [subjectRows, setSubjectRows] = useState([]);
  const [studentRows, setStudentRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportConfig[reportType]) navigate("/laporan/ujian", { replace: true });
  }, [navigate, reportType]);

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

  const filteredExamRows = useMemo(() => {
    return examRows.filter((row) => {
      const subject = firstRelation(row.subjects);
      return (
        includesText(row.title, filters.keyword) &&
        includesText(subject?.class_id, filters.className)
      );
    });
  }, [examRows, filters.className, filters.keyword]);

  const filteredSubmissionRows = useMemo(() => {
    return submissionRows.filter((row) => {
      const exam = row.exam || firstRelation(row.exams);
      const subject = row.subject || firstRelation(exam?.subjects);
      const student = row.student || row.users || {};
      const score = row.score ?? null;
      const scored = score !== null && score !== undefined && score !== "";

      if (filters.scoreStatus === "scored" && !scored) return false;
      if (filters.scoreStatus === "unscored" && scored) return false;

      return (
        [student.name, student.userid, exam?.title].some((value) => includesText(value, filters.keyword)) &&
        includesText(subject?.class_id, filters.className) &&
        numberInRange(score, filters.scoreMin, filters.scoreMax)
      );
    });
  }, [filters.className, filters.keyword, filters.scoreMax, filters.scoreMin, filters.scoreStatus, submissionRows]);

  const filteredSubjectRows = useMemo(() => {
    return subjectRows.filter((row) => {
      if (filters.scoreStatus === "scored" && Number(row.scoredSubmissions || 0) <= 0) return false;
      if (filters.scoreStatus === "unscored" && Number(row.unscoredSubmissions || 0) <= 0) return false;
      if (filters.submissionMin !== "" && Number(row.totalSubmissions || 0) < Number(filters.submissionMin)) return false;

      return (
        includesText(row.subject, filters.keyword) &&
        includesText(row.class_id, filters.className) &&
        numberInRange(row.averageScore, filters.averageMin, filters.averageMax)
      );
    });
  }, [
    filters.averageMax,
    filters.averageMin,
    filters.className,
    filters.keyword,
    filters.scoreStatus,
    filters.submissionMin,
    subjectRows,
  ]);

  const filteredStudentRows = useMemo(() => {
    return studentRows.filter((row) => {
      const averageScore = row.averageScore ?? null;
      if (filters.scoreStatus === "scored" && Number(row.scoredSubmissions || 0) <= 0) return false;
      if (filters.scoreStatus === "unscored" && Number(row.unscoredSubmissions || 0) <= 0) return false;
      if (filters.passStatus === "passed" && Number(row.passedCount || 0) <= 0) return false;
      if (filters.passStatus === "failed" && Number(row.failedCount || 0) <= 0) return false;

      return (
        [row.student, row.userid, row.subjects].some((value) => includesText(value, filters.keyword)) &&
        includesText(row.class_id, filters.className) &&
        numberInRange(averageScore, filters.averageMin, filters.averageMax)
      );
    });
  }, [
    filters.averageMax,
    filters.averageMin,
    filters.className,
    filters.keyword,
    filters.passStatus,
    filters.scoreStatus,
    studentRows,
  ]);

  const normalizedRows = useMemo(() => {
    if (activeTab === "exam") {
      return filteredExamRows.map((row) => ({
        judul: row.title,
        tipe: row.type,
        tanggal: row.date,
        durasi: row.duration,
        mapel: row.subjects?.name || "-",
        kelas: row.subjects?.class_id || "-",
      }));
    }

    if (activeTab === "submission") {
      return filteredSubmissionRows.map((row) => ({
        ujian: row.exam?.title || firstRelation(row.exams)?.title || "-",
        tipe: row.exam?.type || firstRelation(row.exams)?.type || "-",
        mapel: row.subject?.name || firstRelation(firstRelation(row.exams)?.subjects)?.name || "-",
        siswa: row.student?.name || row.users?.name || "-",
        nis_nik: row.student?.userid || row.users?.userid || "-",
        nilai: row.score ?? "-",
        submit_at: row.created_at,
      }));
    }

    if (activeTab === "subject") {
      return filteredSubjectRows.map((row) => ({
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

    return filteredStudentRows.map((row) => ({
      siswa: row.student,
      nis_nik: row.userid,
      kelas: row.class_id || "-",
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
  }, [activeTab, filteredExamRows, filteredStudentRows, filteredSubjectRows, filteredSubmissionRows]);

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

  const buildRowsByType = (type) => {
    const previousTab = activeTab;
    if (type === previousTab) return normalizedRows;

    if (type === "submission") {
      return filteredSubmissionRows.map((row) => ({
        ujian: row.exam?.title || firstRelation(row.exams)?.title || "-",
        tipe: row.exam?.type || firstRelation(row.exams)?.type || "-",
        mapel: row.subject?.name || firstRelation(firstRelation(row.exams)?.subjects)?.name || "-",
        siswa: row.student?.name || row.users?.name || "-",
        nis_nik: row.student?.userid || row.users?.userid || "-",
        nilai: row.score ?? "-",
        submit_at: row.created_at,
      }));
    }

    if (type === "subject") {
      return filteredSubjectRows.map((row) => ({
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

    if (type === "student") {
      return filteredStudentRows.map((row) => ({
        siswa: row.student,
        nis_nik: row.userid,
        kelas: row.class_id || "-",
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
    }

    return filteredExamRows.map((row) => ({
      judul: row.title,
      tipe: row.type,
      tanggal: row.date,
      durasi: row.duration,
      mapel: row.subjects?.name || "-",
      kelas: row.subjects?.class_id || "-",
    }));
  };

  const exportAcademicExcel = () => {
    const workbook = XLSX.utils.book_new();
    [
      ["Submission", buildRowsByType("submission")],
      ["Mapel", buildRowsByType("subject")],
      ["Nilai Siswa", buildRowsByType("student")],
    ].forEach(([sheetName, rows]) => {
      const safeRows = rows.length ? rows : [{ data: "Tidak ada data" }];
      const worksheet = XLSX.utils.json_to_sheet(safeRows);
      worksheet["!cols"] = Object.keys(safeRows[0] || { data: "" }).map((key) => ({
        wch: Math.max(14, key.length + 4),
      }));
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, "report-akademik.xlsx");
  };

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => {
    setFilters({
      from: "",
      to: "",
      subjectId: "",
      examType: "",
      keyword: "",
      className: "",
      scoreMin: "",
      scoreMax: "",
      averageMin: "",
      averageMax: "",
      scoreStatus: "",
      passStatus: "",
      submissionMin: "",
    });
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
  const labelClass = "space-y-1 text-xs font-semibold text-slate-600";

  const renderCommonDateSubjectTypeFilters = ({ dateLabel = "Tanggal ujian", showType = true } = {}) => (
    <>
      <label className={labelClass}>
        <span>Dari {dateLabel}</span>
        <input className={inputClass} type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} />
      </label>
      <label className={labelClass}>
        <span>Sampai {dateLabel}</span>
        <input className={inputClass} type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} />
      </label>
      <div className={labelClass}>
        <span>Mata Pelajaran</span>
        <SubjectSelect subject={filters.subjectId} setSubject={(v) => updateFilter("subjectId", v || "")} />
      </div>
      {showType && (
        <label className={labelClass}>
          <span>Tipe Ujian</span>
          <select className={inputClass} value={filters.examType} onChange={(e) => updateFilter("examType", e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="REGULER">Reguler</option>
            <option value="REMEDIAL">Remedial</option>
          </select>
        </label>
      )}
    </>
  );

  const renderFilters = () => {
    if (activeTab === "exam") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {renderCommonDateSubjectTypeFilters()}
          <label className={labelClass}>
            <span>Judul Ujian</span>
            <input className={inputClass} value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} placeholder="Cari judul ujian..." />
          </label>
          <label className={labelClass}>
            <span>Kelas</span>
            <input className={inputClass} value={filters.className} onChange={(e) => updateFilter("className", e.target.value)} placeholder="Contoh: X TKJ" />
          </label>
        </div>
      );
    }

    if (activeTab === "submission") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
          {renderCommonDateSubjectTypeFilters({ dateLabel: "tanggal submit" })}
          <label className={labelClass}>
            <span>Siswa / NIS / Ujian</span>
            <input className={inputClass} value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} placeholder="Cari siswa, NIS, ujian..." />
          </label>
          <label className={labelClass}>
            <span>Status Nilai</span>
            <select className={inputClass} value={filters.scoreStatus} onChange={(e) => updateFilter("scoreStatus", e.target.value)}>
              <option value="">Semua Status</option>
              <option value="scored">Sudah Dinilai</option>
              <option value="unscored">Belum Dinilai</option>
            </select>
          </label>
          <label className={labelClass}>
            <span>Nilai Min</span>
            <input className={inputClass} type="number" min="0" max="100" value={filters.scoreMin} onChange={(e) => updateFilter("scoreMin", e.target.value)} />
          </label>
          <label className={labelClass}>
            <span>Nilai Max</span>
            <input className={inputClass} type="number" min="0" max="100" value={filters.scoreMax} onChange={(e) => updateFilter("scoreMax", e.target.value)} />
          </label>
        </div>
      );
    }

    if (activeTab === "subject") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
          {renderCommonDateSubjectTypeFilters()}
          <label className={labelClass}>
            <span>Mapel</span>
            <input className={inputClass} value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} placeholder="Cari mapel..." />
          </label>
          <label className={labelClass}>
            <span>Kelas</span>
            <input className={inputClass} value={filters.className} onChange={(e) => updateFilter("className", e.target.value)} placeholder="Contoh: XI" />
          </label>
          <label className={labelClass}>
            <span>Rata-rata Min</span>
            <input className={inputClass} type="number" min="0" max="100" value={filters.averageMin} onChange={(e) => updateFilter("averageMin", e.target.value)} />
          </label>
          <label className={labelClass}>
            <span>Submission Min</span>
            <input className={inputClass} type="number" min="0" value={filters.submissionMin} onChange={(e) => updateFilter("submissionMin", e.target.value)} />
          </label>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {renderCommonDateSubjectTypeFilters()}
        <label className={labelClass}>
          <span>Nama / NIS / Mapel</span>
          <input className={inputClass} value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} placeholder="Cari siswa, NIS, mapel..." />
        </label>
        <label className={labelClass}>
          <span>Kelas</span>
          <input className={inputClass} value={filters.className} onChange={(e) => updateFilter("className", e.target.value)} placeholder="Contoh: X TKJ" />
        </label>
        <label className={labelClass}>
          <span>Status Nilai</span>
          <select className={inputClass} value={filters.scoreStatus} onChange={(e) => updateFilter("scoreStatus", e.target.value)}>
            <option value="">Semua Status</option>
            <option value="scored">Sudah Ada Nilai</option>
            <option value="unscored">Ada Belum Dinilai</option>
          </select>
        </label>
        <label className={labelClass}>
          <span>Status Kelulusan</span>
          <select className={inputClass} value={filters.passStatus} onChange={(e) => updateFilter("passStatus", e.target.value)}>
            <option value="">Semua</option>
            <option value="passed">Pernah Lulus</option>
            <option value="failed">Ada Tidak Lulus</option>
          </select>
        </label>
        <label className={labelClass}>
          <span>Rata-rata Min</span>
          <input className={inputClass} type="number" min="0" max="100" value={filters.averageMin} onChange={(e) => updateFilter("averageMin", e.target.value)} />
        </label>
        <label className={labelClass}>
          <span>Rata-rata Max</span>
          <input className={inputClass} type="number" min="0" max="100" value={filters.averageMax} onChange={(e) => updateFilter("averageMax", e.target.value)} />
        </label>
      </div>
    );
  };

  return (
    <Sidebar pageTitle={activeConfig.title}>
      <div className="module-shell space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h1 className="module-title">{activeConfig.title}</h1>
          <p className="mt-2 text-slate-600">
            {activeConfig.description}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-700">Filter {activeConfig.title}</h3>
            <button className="module-action-btn bg-slate-100 text-slate-700" onClick={resetFilters}>
              Reset Filter
            </button>
          </div>
          {renderFilters()}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">{activeConfig.title}</p>
              <p className="text-xs text-slate-500">Menampilkan {normalizedRows.length} baris data</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button className="module-action-btn bg-slate-100 text-slate-700" onClick={exportCsv}>Export CSV</button>
              <button className="module-action-btn bg-emerald-600 text-white" onClick={exportExcel}>Export Excel</button>
              <button className="module-action-btn bg-blue-600 text-white" onClick={exportAcademicExcel}>Export Akademik</button>
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
