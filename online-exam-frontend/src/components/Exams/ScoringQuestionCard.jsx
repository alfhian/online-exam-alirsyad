import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import RichTextRenderer from "../RichTextRenderer";

const ScoringQuestionCard = ({
  question,
  index,
  isCorrect,
  essayScore,
  onSetScore,
  onSetEssayScore,
}) => {
  const { id, text, type, options, correctAnswer, studentAnswer } = question;
  const isMultipleChoice = type === "multiple_choice";
  const isManualScore = !isMultipleChoice;

  /** 🔹 Helper: render opsi jawaban (untuk multiple choice) */
  const renderOptions = () => {
    if (!options || !Array.isArray(options)) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mt-2">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className={`border rounded-md p-2 flex items-center justify-center text-sm text-gray-700 ${
              opt.value === studentAnswer
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {opt.type === "image" && /^https?:|^data:image\//.test(opt.value) ? (
              <img src={opt.value} alt={`Option ${idx + 1}`} className="h-16 object-contain" />
            ) : (
              <RichTextRenderer content={opt.value} />
            )}
          </div>
        ))}
      </div>
    );
  };

  /** 🔹 Helper: render jawaban siswa (untuk essay) */
  const renderStudentAnswer = () => {
    if (isManualScore) {
      return (
        <div className="bg-gray-50 p-3 rounded-md mt-2 text-gray-800">
          {studentAnswer ? <RichTextRenderer content={studentAnswer} /> : "-"}
        </div>
      );
    }
    return null;
  };

  /** 🔹 Helper: render jawaban benar */
  const renderCorrectAnswer = () => {
    if (!correctAnswer) return null;
    if (isManualScore) return null; // essay/manual tidak punya jawaban baku

    return (
      <div className="mt-2 text-sm text-gray-600">
        <span className="font-medium">Jawaban Benar:</span>{" "}
        {/^(https?:|data:image\/)/.test(correctAnswer) ? (
          <img
            src={correctAnswer}
            alt="Jawaban benar"
            className="h-16 mt-1 rounded-md border"
          />
        ) : (
          <RichTextRenderer content={correctAnswer} />
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      {/* 🔹 Header & Tombol Penilaian */}
      <div className="flex justify-between items-start mb-3 gap-4">
        <div className="font-semibold text-gray-800 flex gap-2 flex-1">
          <span>{index + 1}.</span>
          <div className="flex-1">
            <RichTextRenderer content={text} />
          </div>
        </div>
        {isMultipleChoice ? (
          <div className="flex gap-2">
            <button
              onClick={() => onSetScore(id, true)}
              className={`p-2 rounded-full transition ${
                isCorrect === true
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400 hover:text-green-500"
              }`}
              title="Jawaban Benar"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onSetScore(id, false)}
              className={`p-2 rounded-full transition ${
                isCorrect === false
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-400 hover:text-red-500"
              }`}
              title="Jawaban Salah"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <label className="shrink-0 text-xs font-semibold text-slate-600" htmlFor={`essay-score-${id}`}>
            <span className="mb-1 block text-right">Poin Essay</span>
            <input
              id={`essay-score-${id}`}
              type="number"
              min="0"
              max="100"
              value={essayScore ?? ""}
              onChange={(event) => onSetEssayScore(id, event.target.value)}
              className="w-28 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="0-100"
            />
          </label>
        )}
      </div>

      {/* 🔹 Konten Soal */}
      <div className="ml-1 text-gray-700">
        {isMultipleChoice ? (
          <>
            <p className="text-sm text-gray-600">Pilihan:</p>
            {renderOptions()}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Jawaban Siswa:</p>
            {renderStudentAnswer()}
          </>
        )}

        {/* Jawaban Benar (jika bukan essay) */}
        {renderCorrectAnswer()}
      </div>
    </div>
  );
};

export default ScoringQuestionCard;
