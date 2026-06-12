import { useEffect, useMemo, useState } from "react";
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
  const [essayScores, setEssayScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const initialEssayScores = {};
      data.questions?.forEach((q) => {
        initialScoring[q.id] = q.is_correct ?? null;
        if (q.type !== "multiple_choice") {
          initialEssayScores[q.id] = q.essay_score ?? "";
        }
      });
      setScoring(initialScoring);
      setEssayScores(initialEssayScores);
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

  const handleSetEssayScore = (questionId, score) => {
    setEssayScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const scoreSummary = useMemo(() => {
    const questions = submission?.questions || [];
    const multipleChoiceQuestions = questions.filter((q) => q.type === "multiple_choice");
    const essayQuestions = questions.filter((q) => q.type !== "multiple_choice");
    const multipleChoiceCorrect = multipleChoiceQuestions.filter((q) => scoring[q.id] === true).length;
    const multipleChoiceScore = multipleChoiceQuestions.length
      ? Math.round((multipleChoiceCorrect / multipleChoiceQuestions.length) * 100)
      : null;
    const essayQuestionScores = essayQuestions.map((q) => {
      const rawScore = essayScores[q.id];
      const parsedScore = rawScore === "" || rawScore === undefined || rawScore === null ? null : Number(rawScore);
      return Number.isFinite(parsedScore)
        ? Math.max(0, Math.min(100, Math.round(parsedScore)))
        : null;
    });
    const safeEssayScore = essayQuestionScores.length && essayQuestionScores.every((score) => score !== null)
      ? Math.min(100, essayQuestionScores.reduce((sum, score) => sum + Number(score), 0))
      : null;
    const components = [
      multipleChoiceScore,
      essayQuestions.length > 0 ? safeEssayScore : null,
    ].filter((score) => score !== null);
    const finalScore = components.length
      ? Math.round(components.reduce((sum, score) => sum + score, 0) / components.length)
      : 0;

    return {
      multipleChoiceQuestions,
      essayQuestions,
      multipleChoiceCorrect,
      multipleChoiceScore,
      essayQuestionScores,
      safeEssayScore,
      finalScore,
    };
  }, [essayScores, scoring, submission]);

  const handleSaveScore = async () => {
    if (saving) return;
    try {
      setSaving(true);

      if (scoreSummary.essayQuestions.length > 0 && scoreSummary.essayQuestionScores.some((score) => score === null)) {
        MySwal.fire("Nilai essay belum lengkap", "Isi nilai setiap jawaban essay dengan angka 0 sampai 100.", "warning");
        return;
      }

      const payload = Object.entries(scoring).map(([questionId, isCorrect]) => ({
        question_id: questionId,
        is_correct: isCorrect,
      }));
      const essayPayload = scoreSummary.essayQuestions.map((question) => ({
        question_id: question.id,
        score: scoreSummary.essayQuestionScores[scoreSummary.essayQuestions.findIndex((item) => item.id === question.id)],
      }));

      await api.patch(
        `/teacher-exams/submission/${submissionId}/scoring`,
        {
          scores: payload,
          totalScore: scoreSummary.finalScore,
          essayScores: essayPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      MySwal.fire({
        title: "Berhasil!",
        text: `Nilai ujian berhasil disimpan.\nSkor akhir: ${scoreSummary.finalScore}`,
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

            {/* Ringkasan Nilai */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <div>
                <h5 className="font-semibold text-gray-800">Ringkasan Nilai</h5>
                <p className="text-xs text-gray-500 mt-1">
                  Nilai PG dihitung otomatis dari soal pilihan ganda saja. Poin essay dijumlahkan dan maksimal 100.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Nilai PG</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {scoreSummary.multipleChoiceScore ?? "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {scoreSummary.multipleChoiceCorrect}/{scoreSummary.multipleChoiceQuestions.length} benar
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Poin Essay</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {scoreSummary.safeEssayScore ?? "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Jumlah poin dari {scoreSummary.essayQuestions.length} jawaban essay, maksimal 100
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Nilai Akhir</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {scoreSummary.finalScore}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {scoreSummary.essayQuestions.length > 0 && scoreSummary.multipleChoiceQuestions.length > 0
                      ? "(Nilai PG + Nilai Essay) / 2"
                      : scoreSummary.essayQuestions.length > 0
                        ? "Mengikuti nilai essay"
                        : "Mengikuti nilai PG"}
                  </p>
                </div>
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
                    essayScore={essayScores[q.id]}
                    onSetScore={handleSetScore}
                    onSetEssayScore={handleSetEssayScore}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">Tidak ada soal untuk dinilai.</p>
              )}
            </div>

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
