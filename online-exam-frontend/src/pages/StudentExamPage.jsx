import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import Swal from "sweetalert2";
import RichTextRenderer from "../components/RichTextRenderer";
import LoadingButton from "../components/LoadingButton";
import { enqueueVideoUpload } from "../utils/backgroundVideoUpload";

/* ---------------- Helper ---------------- */

const START_TIMEOUT_MS = 30000;
const SUBMIT_TIMEOUT_MS = 30000;
const SUBMIT_RETRY_DELAY_MS = 1200;

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const normalizeOptions = (options) => {
  if (Array.isArray(options)) {
    return options.map((option) => ({
      type: option.type || "text",
      value: option.value || "",
    }));
  }
  if (typeof options !== "string") return [];

  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const StudentExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Exam states
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});

  // Session & status
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startMessage, setStartMessage] = useState("Memulai ujian...");
  const [submitting, setSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // Refs
  const submittingRef = useRef(false);
  const internalNavigationRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const allowInternalNavigation = () => {
    internalNavigationRef.current = true;
    window.__ALLOW_INTERNAL_NAVIGATION__ = true;
  };

  const blockInternalNavigation = () => {
    internalNavigationRef.current = false;
    window.__ALLOW_INTERNAL_NAVIGATION__ = false;
  };

  /* ---------------- Fetch Exam ---------------- */
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data: examData } = await api.get(`/exams/${examId}`);

        setExam(examData);
        setTimeLeft(Number(examData.duration) * 60);

        const { data: qRes } = await api.get(`/exams/${examId}/questions`);

        console.log(qRes.questions);
        

        const normalizedQuestions = (qRes.questions || []).map((question) => ({
          ...question,
          options: normalizeOptions(question.options),
        }));

        setQuestions(normalizedQuestions);
      } catch (err) {
        console.error("Gagal ambil exam:", err);
        Swal.fire("Error", "Gagal memuat ujian", "error");
        navigate("/student/exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, navigate]);

  /* ---------------- Proctoring ---------------- */
  const violationRef = useRef(0);
  const alarm = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"));

  useEffect(() => {
    if (!started) return;

    const currentAlarm = alarm.current;
    currentAlarm.loop = true;

    const showWarning = async (msg) => {
      // Play alarm
      currentAlarm.play().catch(e => console.log("Autoplay blocked or audio error", e));
      
      violationRef.current += 1;

      if (violationRef.current >= 3) {
        if (sessionId) {
          await api
            .post(`/exam-sessions/${sessionId}/disqualify`, {
              reason: "proctoring_violation",
            })
            .catch((err) => console.error("Gagal menandai sesi diskualifikasi:", err));
        }

        await Swal.fire({
          title: "DISKUALIFIKASI!",
          text: "Anda telah melakukan pelanggaran lebih dari 2 kali. Sesi ujian Anda dihentikan.",
          icon: "error",
          confirmButtonText: "OK",
        });
        currentAlarm.pause();
        localStorage.removeItem("token");
        allowInternalNavigation();
        window.location.href = "/"; // Force hard redirect
        return;
      }

      await Swal.fire({
        title: "Peringatan!",
        text: `${msg} (Pelanggaran ke-${violationRef.current}/2)`,
        icon: "warning",
        confirmButtonText: "Saya Mengerti",
      });

      currentAlarm.pause();
      currentAlarm.currentTime = 0;

      if (sessionId && !submittingRef.current) {
        await api.post(`/exam-sessions/${sessionId}/tab-switch`, {});
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        showWarning("Anda keluar dari fullscreen!");
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && !submittingRef.current) {
        showWarning("Anda tidak boleh berpindah tab!");
      }
    };
    const handleBeforeUnload = (e) => {
      if (internalNavigationRef.current || window.__ALLOW_INTERNAL_NAVIGATION__) return;
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      currentAlarm.pause();
    };
  }, [started, sessionId]);

  /* ---------------- Recording ---------------- */
  const startRecording = useCallback(async (sessionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 10, max: 15 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 300_000,
        audioBitsPerSecond: 48_000,
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error("🎥 MediaRecorder error:", event.error);
      };

      mediaRecorder.onstop = async () => {
        console.log("🎥 onstop triggered");

        // Log chunks
        console.log("Chunks count:", chunksRef.current.length);
        let totalBytes = 0;
        chunksRef.current.forEach((c, idx) => {
          console.log(` chunk[${idx}] size:`, c.size, "type:", c.type);
          totalBytes += c.size;
        });
        console.log("Total bytes (sum of chunks):", totalBytes);

        // small delay to let last data push settle
        await new Promise((r) => setTimeout(r, 500));

        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("Blob created:", { size: blob.size, type: blob.type });

        if (blob.size === 0) {
          console.error("❌ Blob kosong, abort upload");
          return;
        }

        try {
          await enqueueVideoUpload({
            sessionId,
            blob,
            fileName: "exam-recording.webm",
          });
        } catch (err) {
          console.error("Gagal memasukkan rekaman ke queue upload:", err);
        } finally {
          // stop camera tracks (safety)
          try {
            const stream = mediaRecorderRef.current?.stream;
            if (stream) {
              stream.getTracks().forEach((t) => {
                console.log("Stopping track:", t.kind, t.label);
                t.stop();
              });
            }
          } catch (e) {
            console.warn("Failed stopping tracks:", e);
          }
        }
      };

      mediaRecorder.start(10000);
      return true;
    } catch (err) {
      console.error("❌ Gagal akses kamera:", err);
      return false;
    }
  }, []);

  /* ---------------- Handlers ---------------- */
  const handleAnswerChange = (questionId, answer) => {
    setStudentAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const requestFullscreenIfAvailable = async () => {
    const elem = document.documentElement;
    try {
      if (document.fullscreenElement) return true;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      else return false;
      return true;
    } catch (err) {
      console.warn("Fullscreen tidak dapat dimulai otomatis:", err);
      return false;
    }
  };

  const handleStart = async () => {
    if (starting) return;
    try {
      setStarting(true);
      setStartMessage("Menyiapkan sesi ujian...");
      const { data } = await api.post(`/exam-sessions/${examId}/start`, {}, {
        timeout: START_TIMEOUT_MS,
        skipAuthRedirect: true,
      });

      setSessionId(data.id);
      setStarted(true);

      // 🔹 Robust Fullscreen Request
      setStartMessage("Mengaktifkan mode fullscreen...");
      const fullscreenStarted = await requestFullscreenIfAvailable();
      if (!fullscreenStarted) {
        Swal.fire({
          icon: "info",
          title: "Fullscreen Manual",
          text: "Jika tombol fullscreen muncul, tekan tombol tersebut untuk kembali ke mode ujian.",
          timer: 2500,
          showConfirmButton: false,
        });
      }

      setStartMessage("Mengaktifkan kamera...");
      const recordingStarted = await startRecording(data.id);
      if (!recordingStarted) {
        Swal.fire({
          icon: "warning",
          title: "Kamera Tidak Aktif",
          text: "Ujian tetap dimulai, tetapi rekaman pengawasan tidak aktif. Silakan izinkan kamera/mikrofon jika browser meminta izin.",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Gagal mulai ujian:", err);
      const message =
        err.response?.status === 401
          ? "Sesi login Anda sudah berakhir. Silakan login kembali sebelum memulai ujian."
          : err.userMessage || "Tidak bisa memulai sesi ujian. Periksa koneksi lalu coba lagi.";

      await Swal.fire("Error", message, "error");
      if (err.response?.status === 401) {
        allowInternalNavigation();
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setStartMessage("Memulai ujian...");
      setStarting(false);
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const isRetryableSubmitError = (err) => {
    const status = err.response?.status;
    return (
      err.code === "ECONNABORTED" ||
      err.code === "ETIMEDOUT" ||
      !status ||
      status >= 500
    );
  };

  const submitExamWithRetry = useCallback(async (payload) => {
    try {
      return await api.post(`/exam-submissions/${examId}`, payload, {
        timeout: SUBMIT_TIMEOUT_MS,
      });
    } catch (err) {
      if (!isRetryableSubmitError(err)) throw err;

      Swal.update({
        title: "Mencoba mengirim ulang...",
        text: "Koneksi sempat terganggu. Sistem sedang memastikan jawaban terkirim.",
      });
      Swal.showLoading();

      await wait(SUBMIT_RETRY_DELAY_MS);
      return api.post(`/exam-submissions/${examId}`, payload, {
        timeout: SUBMIT_TIMEOUT_MS,
      });
    }
  }, [examId]);

  const handleSubmit = useCallback(async ({ auto = false } = {}) => {
    if (submittingRef.current) return;

    if (!auto) {
      const result = await Swal.fire({
        title: "Yakin ingin mengirim jawaban?",
        text: "Pastikan semua jawaban sudah benar. Setelah dikirim, kamu tidak bisa mengubah jawaban lagi.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, kirim sekarang!",
        cancelButtonText: "Batal",
        reverseButtons: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      });

      if (!result.isConfirmed) {
        Swal.fire({
          icon: "info",
          title: "Dibatalkan",
          text: "Kamu bisa memeriksa kembali jawaban sebelum mengirim.",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
    }

    try {
      submittingRef.current = true;
      setSubmitting(true);

      Swal.fire({
        title: auto ? "Waktu habis. Mengirim jawaban..." : "Mengirim jawaban...",
        text: auto
          ? "Sistem sedang menyimpan jawaban yang sudah diisi."
          : "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        answers: questions.map((question) => ({
          question_id: question.id,
          answer: studentAnswers[question.id] ?? "",
        })),
        sessionId: sessionId,
      };

      await submitExamWithRetry(payload);

      allowInternalNavigation();

      // Stop recording + exit fullscreen
      if (document.fullscreenElement) await document.exitFullscreen();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      await Swal.fire({
        icon: "success",
        title: auto ? "Waktu Habis!" : "Ujian Terkirim!",
        text: auto
          ? "Waktu ujian selesai. Jawaban yang sudah kamu isi berhasil dikirim."
          : "Jawaban kamu berhasil dikirim. Terima kasih sudah mengikuti ujian.",
        confirmButtonText: "OK",
      });

      navigate("/student/exam");
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response?.status === 401) {
        allowInternalNavigation();
      } else {
        blockInternalNavigation();
      }
      Swal.fire("Error", err.userMessage || "Gagal menyimpan jawaban", "error");
    } finally {
      if (!internalNavigationRef.current) submittingRef.current = false;
      setSubmitting(false);
    }
  }, [navigate, questions, sessionId, studentAnswers, submitExamWithRetry]);

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (!exam || !started || !sessionId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleSubmit({ auto: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, handleSubmit, sessionId, started]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const requestFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  /* ---------------- Render ---------------- */
  if (loading) return <p className="p-6">Loading...</p>;

  if (!started) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white text-center px-6">
        <div className="max-w-md">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-4 animate-bounce">
            🚀 Siap Untuk Ujianmu?
          </h1>
          <p className="text-gray-600 mb-8">
            {exam?.title
              ? `Ujian: ${exam.title}`
              : "Pastikan kamu siap dan fokus untuk mengerjakan ujian ini."}
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <p className="text-gray-700 font-medium">
              🔒 Setelah menekan tombol mulai, layar akan masuk ke mode
              fullscreen dan rekaman video akan dimulai untuk keperluan
              pengawasan. Pastikan kamera dan mikrofon kamu aktif!
            </p>
          </div>

          <LoadingButton
            onClick={handleStart}
            loading={starting}
            loadingText={startMessage}
            className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Mulai Ujian Sekarang 🎯
          </LoadingButton>

          <p className="mt-6 text-sm text-gray-500">
            Semoga sukses! Fokus, tenang, dan tunjukkan kemampuan terbaikmu 💪
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header Ujian */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse hover:bg-red-700 transition-colors shadow-lg"
            >
              ⚠️ Kembali ke Fullscreen
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-blue-700">{exam?.title}</h1>
            <p className="text-sm text-gray-500">
              Fokus dan kerjakan dengan tenang 💪
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-red-600 animate-pulse">
            ⏳ {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-gray-500">Sisa waktu ujian</p>
        </div>
      </header>

      {/* Daftar Soal */}
      <main className="flex-1 overflow-y-auto p-6">
        {questions.length > 0 ? (
          [...questions]
            .sort((a, b) =>
              a.type === b.type
                ? (a.index || 0) - (b.index || 0)
                : a.type === "multiple_choice"
                ? -1
                : 1
            )
            .map((q, index) => (
              <div
                key={q.id}
                className="mb-8 p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-semibold">
                    {index + 1}
                  </span>
                  <div className="font-semibold text-gray-800 leading-relaxed text-lg flex-1">
                    <RichTextRenderer content={q.question} />
                  </div>
                </div>

                {/* Opsi Pilihan Ganda */}
                {q.type === "multiple_choice" ? (
                  <div className="mt-3 space-y-3">
                    {q.options?.map((opt, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                          studentAnswers[q.id] === opt.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.value}
                          onChange={() => handleAnswerChange(q.id, opt.value)}
                          checked={studentAnswers[q.id] === opt.value}
                          className="accent-blue-600 scale-110"
                        />
                        {opt.type === "image" && /^https?:|^data:image\//.test(opt.value) ? (
                          <img
                            src={opt.value}
                            alt={`option-${i}`}
                            className="h-20 rounded-md border"
                          />
                        ) : (
                          <div className="flex-1 text-gray-700">
                            <RichTextRenderer content={opt.value} />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  // Jawaban Esai
                  <textarea
                    name={`q-${q.id}`}
                    className="w-full border border-gray-300 rounded-xl p-3 mt-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200"
                    placeholder="Tulis jawaban Anda di sini..."
                    rows={5}
                    value={studentAnswers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}
              </div>
            ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Tidak ada soal tersedia 😅</p>
          </div>
        )}
      </main>

      {/* Tombol Submit */}
      <footer className="p-4 bg-white shadow-inner flex justify-end items-center sticky bottom-0">
        <LoadingButton
          onClick={handleSubmit}
          loading={submitting}
          loadingText="Mengirim Jawaban..."
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Kirim Jawaban 📝
        </LoadingButton>
      </footer>
    </div>
  );

};

export default StudentExamPage;
