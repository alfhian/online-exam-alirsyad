import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import formatDateOnly from "../utils/formatDateOnly";

const MySwal = withReactContent(Swal);

const ExamResultDetail = () => {
  const { id } = useParams(); // submissionId
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExamResult = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/exam-submissions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setResult(res.data);
    } catch (err) {
      console.error("Gagal fetch hasil ujian:", err);
      MySwal.fire({
        title: "Error",
        text: "Tidak bisa mengambil detail hasil ujian.",
        icon: "error",
        confirmButtonText: "OK",
      });
      navigate("/exam-submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamResult();
  }, [id]);

  if (loading) {
    return (
      <Sidebar>
        <div className="p-6 min-h-screen bg-white rounded shadow max-w-screen-md mx-auto">
          <p>Loading...</p>
        </div>
      </Sidebar>
    );
  }

  if (!result) {
    return (
      <Sidebar>
        <div className="p-6 min-h-screen bg-white rounded shadow max-w-screen-md mx-auto">
          <p>Data hasil ujian tidak ditemukan.</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6 min-h-screen bg-white rounded shadow max-w-screen-md mx-auto">
        <h3 className="font-bold mb-4">Detail Hasil Ujian</h3>

        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Judul Ujian:</strong> {result.exam?.title || "-"}
          </p>
          <p>
            <strong>Mata Pelajaran:</strong>{" "}
            {typeof result.exam?.subject === "object"
              ? result.exam?.subject?.name
              : result.exam?.subject || "-"}
          </p>
          <p>
            <strong>Tipe:</strong> {result.exam?.type || "-"}
          </p>
          <p>
            <strong>Tanggal Submit:</strong>{" "}
            {result.created_at ? formatDateOnly(result.created_at) : "-"}
          </p>
          <p>
            <strong>Skor:</strong> {result.score ?? "-"}
          </p>
        </div>

        <div className="mt-2 border rounded p-4 bg-gray-50">
          {Array.isArray(result.answers) && result.answers.length > 0 ? (
            result.answers.map((ans, idx) => {
              // Extract dengan fallback aman
              const questionText =
                typeof ans.question === "object"
                  ? ans.question?.question || "Pertanyaan tidak ditemukan"
                  : ans.question || "Pertanyaan tidak ditemukan";

              const options = Array.isArray(ans.question?.options)
                ? ans.question.options
                : [];

              return (
                <div
                  key={idx}
                  className="mb-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <p className="font-medium">
                    {idx + 1}. {questionText}
                  </p>

                  {/* Kalau ada opsi jawaban */}
                  {options.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2">
                      {options.map((opt, i) => (
                        <div key={i} className="text-center">
                          {opt.type === "image" ? (
                            <img
                              src={opt.value}
                              alt={`Opsi ${i + 1}`}
                              className={`w-24 h-24 object-cover border rounded ${
                                ans.answer === opt.value
                                  ? "border-green-500"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            <p
                              className={`p-2 border rounded ${
                                ans.answer === opt.value
                                  ? "bg-green-100 border-green-400"
                                  : "bg-white"
                              }`}
                            >
                              {opt.value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Jawaban user */}
                  <p className="ml-4">
                    <strong>Jawaban Anda:</strong>{" "}
                    {typeof ans.answer === "object"
                      ? JSON.stringify(ans.answer)
                      : ans.answer || "Tidak ada jawaban"}
                  </p>

                  {/* Jawaban benar */}
                  <p className="ml-4">
                    <strong>Jawaban Benar:</strong>{" "}
                    {typeof ans.question?.answer === "object"
                      ? JSON.stringify(ans.question.answer)
                      : ans.question?.answer || "-"}
                  </p>
                </div>
              );
            })
          ) : (
            <p>Tidak ada jawaban yang tersimpan.</p>
          )}
        </div>

      </div>
    </Sidebar>
  );
};

export default ExamResultDetail;
