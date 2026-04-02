export class ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  session_id: string;

  // JSON berisi array jawaban
  answers: {
    question_id: string;
    answer: string;
    is_correct?: boolean;
  }[];

  score?: number;

  created_at: Date;
  updated_at?: Date;

  created_by?: string;
  updated_by?: string;

  file_name?: string;
  file_path?: string;
  file_url?: string;

  // Relasi manual (opsional)
  exam?: any;
  student?: any;
}
