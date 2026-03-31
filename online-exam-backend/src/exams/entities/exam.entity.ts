export class Exam {
  id: string;
  title: string;
  date: string; // tetap string, sesuai DB

  type: string;
  duration: number;
  notes?: string | null; // bisa null dari DB

  created_at: string; // atau Date kalau mau konversi manual
  created_by: string;

  updated_at?: string | null;
  updated_by?: string | null;

  deleted_at?: string | null;
  deleted_by?: string | null;

  subject_id: string;

  // Relasi manual (opsional)
  subject?: any;
  questionnaires?: any[];
}
