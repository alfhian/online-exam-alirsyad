export class Subject {
  id: string;
  name: string;
  description?: string;

  created_at: Date;
  created_by: string;

  updated_at?: Date;
  updated_by?: string;

  deleted_at?: Date;
  deleted_by?: string;

  class_id: string;
  teacher_id?: string;

  // Relasi manual (opsional)
  classes?: any;
  teacher?: any;
  exams?: any[];
}
