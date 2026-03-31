import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ScoringQuestionCard from "../components/Exams/ScoringQuestionCard";
import formatDateOnly from "../utils/formatDateOnly";
import { FaRegEdit } from "react-icons/fa";
import api from "../api/axiosConfig";

const MySwal = withReactContent(Swal);

const TeacherExamScoring = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [scoring, setScoring] = useState({});
  const [loading, setLoading] = useState(true);
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
    try {
      const questions = submission.questions || [];

      const totalMultiple = questions.filter(q => q.type === "multiple_choice").length;
      const totalEssay = questions.filter(q => q.type === "essay").length;

      const correctMultiple = questions.filter(
        q => q.type === "multiple_choice" && scoring[q.id] === true
      ).length;

      const correctEssay = questions.filter(
        q => q.type === "essay" && scoring[q.id] === true
      ).length;

      let scoreMultiple = 0;
      let scoreEssay = 0;

      /* ----------------------------------------------
      * CASE 1: HANYA MULTIPLE CHOICE
      * --------------------------------------------*/
      if (totalMultiple > 0 && totalEssay === 0) {
        scoreMultiple = (correctMultiple / totalMultiple) * 100;
        scoreEssay = 0;
      }

      /* ----------------------------------------------
      * CASE 2: HANYA ESSAY
      * --------------------------------------------*/
      else if (totalEssay > 0 && totalMultiple === 0) {
        scoreEssay = (correctEssay / totalEssay) * 100;
        scoreMultiple = 0;
      }

      /* ----------------------------------------------
      * CASE 3: ADA KEDUANYA (aturan default 60/40)
      * --------------------------------------------*/
      else {
        scoreMultiple = totalMultiple > 0 ? (correctMultiple / totalMultiple) * 60 : 0;
        scoreEssay = totalEssay > 0 ? (correctEssay / totalEssay) * 40 : 0;
      }

      const finalScore = Math.round(scoreMultiple + scoreEssay);

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
      MySwal.fire("Error", "Gagal menyimpan nilai.", "error");
    }
  };

  useEffect(() => {
    fetchSubmissionDetail();
  }, [submissionId]);

  return (
    <Sidebar>
      <div className="p-8 bg-gray-50 min-h-screen rounded-2xl shadow-inner font-poppins">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
            <FaRegEdit className="text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Penilaian Ujian Siswa</h3>
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

            {/* Tombol Simpan */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveScore}
                className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200 shadow-sm"
              >
                Simpan & Selesaikan Penilaian
              </button>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default TeacherExamScoring;
