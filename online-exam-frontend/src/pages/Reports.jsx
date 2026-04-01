import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosConfig";
import SubjectSelect from "../components/DropdownSubject";

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
      const [examRes, submissionRes, subjectRes] = await Promise.all([
        api.get("/reports/exam-performance", { params }),
        api.get("/reports/submission-list", { params }),
        api.get("/reports/subject-summary", { params }),
      ]);

      setExamRows(examRes.data || []);
      setSubmissionRows(submissionRes.data || []);
      setSubjectRows(subjectRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params]);

  const activeRows = activeTab === "exam" ? examRows : activeTab === "submission" ? submissionRows : subjectRows;

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

    return subjectRows.map((row) => ({
      mapel: row.subject,
      kelas: row.class_id,
      total_submission: row.totalSubmissions,
      rata_rata: Number(row.averageScore || 0).toFixed(2),
    }));
  }, [activeTab, examRows, submissionRows, subjectRows]);

  const exportCsv = () => {
    downloadFile(toCsv(normalizedRows), `report-${activeTab}.csv`, "text/csv;charset=utf-8;");
  };

  const exportExcel = () => {
    downloadFile(toCsv(normalizedRows), `report-${activeTab}.xls`, "application/vnd.ms-excel");
  };

  return (
    <Sidebar>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">Laporan Akademik</h1>
          <p className="mt-2 text-slate-600">Filter data, lihat laporan, lalu export CSV/Excel.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            <input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            <SubjectSelect subject={filters.subjectId} setSubject={(v) => setFilters((p) => ({ ...p, subjectId: v || "" }))} />
            <select value={filters.examType} onChange={(e) => setFilters((p) => ({ ...p, examType: e.target.value }))}>
              <option value="">Semua Tipe</option>
              <option value="REGULER">Reguler</option>
              <option value="REMEDIAL">Remedial</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button className={`px-4 py-2 ${activeTab === "exam" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("exam")}>Report Ujian</button>
            <button className={`px-4 py-2 ${activeTab === "submission" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("submission")}>Report Submission</button>
            <button className={`px-4 py-2 ${activeTab === "subject" ? "btn-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveTab("subject")}>Report Mapel</button>
            <div className="ml-auto flex gap-2">
              <button className="bg-slate-100 px-4 py-2 text-slate-700" onClick={exportCsv}>Export CSV</button>
              <button className="bg-emerald-600 px-4 py-2 text-white" onClick={exportExcel}>Export Excel</button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading report...</p>
          ) : (
            <div className="table-shell">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr>
                    {normalizedRows[0]
                      ? Object.keys(normalizedRows[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left capitalize">
                            {key.replaceAll("_", " ")}
                          </th>
                        ))
                      : <th className="px-3 py-2 text-left">Data</th>}
                  </tr>
                </thead>
                <tbody>
                  {normalizedRows.length ? (
                    normalizedRows.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={`${idx}-${i}`} className="px-3 py-2">{String(val ?? "-")}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500">Tidak ada data report untuk filter ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default Reports;

