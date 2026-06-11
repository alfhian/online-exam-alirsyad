import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ScoringQuestionCard from "../components/Exams/ScoringQuestionCard";
import formatDateOnly from "../utils/formatDateOnly";
import { FaRegEdit } from "react-icons/fa";
import api from "../api/axiosConfig";
import LoadingButton from "../components/LoadingButton";

const MySwal = withReactContent(Swal);

const TeacherExamScoring = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [scoring, setScoring] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualScore, setManualScore] = useState("");
  const navigate = useNavigate();

  const fetchSubmissionDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/teacher-exams/submission/${submissionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = res.data;
      setSubmission(data);

      // Pre-fill skor awal jika sudah pernah dinilai
      const initialScoring = {};
      data.questions?.forEach((q) => {
        initialScoring[q.id] = q.is_correct ?? null;
      });
      setScoring(initialScoring);
      setManualScore(data.score ?? "");
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      MySwal.fire({
        title: "Error",
        text: "Gagal mengambil data ujian siswa.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetScore = (questionId, isCorrect) => {
    setScoring((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
  };

  const handleSaveScore = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const questions = submission.questions || [];
      
      const totalMultiple = questions.filter(q => q.type === "multiple_choice").length;
      const hasEssay = questions.some(q => q.type === "essay");
      const correctMultiple = questions.filter(
        q => q.type === "multiple_choice" && scoring[q.id] === true
      ).length;

      const parsedManualScore = Number(manualScore);
      if (hasEssay && (!Number.isFinite(parsedManualScore) || parsedManualScore < 0 || parsedManualScore > 100)) {
        MySwal.fire("Gagal!", "Nilai akhir essay harus diisi antara 0 sampai 100.", "warning");
        return;
      }

      const finalScore = hasEssay
        ? Math.round(parsedManualScore)
        : totalMultiple > 0
          ? Math.round((correctMultiple / totalMultiple) * 100)
          : 0;

      const payload = Object.entries(scoring).map(([questionId, isCorrect]) => ({
        question_id: questionId,
        is_correct: isCorrect,
      }));

      await api.patch(
        `/teacher-exams/submission/${submissionId}/scoring`,
        { scores: payload, totalScore: finalScore },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      MySwal.fire({
        title: "Berhasil!",
        text: `Nilai ujian berhasil disimpan.\nSkor akhir: ${finalScore}`,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => navigate("/teacher-exam"));

    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal menyimpan nilai.";
      MySwal.fire("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSubmissionDetail();
  }, [submissionId]);

  return (
    <Sidebar pageTitle={submission?.exam?.title || "Penilaian Ujian Siswa"}>
      <div className="module-shell font-poppins">
        {/* Header */}
        <div className="module-header justify-start">
          <div className="module-title-wrap">
            <div className="module-icon">
              <FaRegEdit className="text-lg" />
            </div>
            <h3 className="module-title">Penilaian Ujian Siswa</h3>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        ) : !submission ? (
          <p className="text-red-500 italic">Data tidak ditemukan.</p>
        ) : (
          <div className="space-y-6">
            {/* Info Umum */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-gray-600">
              <h4 className="text-xl font-semibold mb-2 text-gray-800">
                {submission.exam?.title || "-"}
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Mata Pelajaran:</span>{" "}
                  {submission.exam?.subject?.name || "-"}
                </p>
                <p>
                  <span className="font-semibold">Tanggal Submit:</span>{" "}
                  {formatDateOnly(submission.created_at)}
                </p>
                <p>
                  <span className="font-semibold">Siswa:</span>{" "}
                  {submission.student?.name || "-"}
                </p>
              </div>
            </div>

            {/* Daftar Soal */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <h5 className="font-semibold text-gray-700 mb-2">Daftar Soal</h5>
              {submission.questions?.length > 0 ? (
                submission.questions.map((q, idx) => (
                  <ScoringQuestionCard
                    key={q.id}
                    question={{
                      id: q.id,
                      text: q.question,
                      type: q.type,
                      options: q.options,
                      correctAnswer: q.answer,
                      studentAnswer: q.student_answer,
                    }}
                    index={idx}
                    isCorrect={scoring[q.id]}
                    onSetScore={handleSetScore}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">Tidak ada soal untuk dinilai.</p>
              )}
            </div>

            {submission.questions?.some((q) => q.type === "essay") && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nilai Akhir dari Guru
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualScore}
                  onChange={(event) => setManualScore(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Masukkan nilai 0 - 100"
                />
              </div>
            )}

            {/* Tombol Simpan */}
            <div className="flex justify-end">
              <LoadingButton
                onClick={handleSaveScore}
                loading={saving}
                loadingText="Menyimpan nilai..."
                className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200 shadow-sm"
              >
                Simpan & Selesaikan Penilaian
              </LoadingButton>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default TeacherExamScoring;
