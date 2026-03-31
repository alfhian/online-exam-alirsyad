export class ExamStudent {
  id: string;
  exam_id: string;
  student_id: string;
  created_at: Date;
  created_by?: string;
  deleted_at?: Date;
  deleted_by?: string;

  // Relasi ManyToOne TIDAK digunakan di Supabase/JS Client
  exam?: any;
  student?: any;
}
