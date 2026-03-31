export class Questionnaire {
  id: string;

  exam_id: string;
  exam?: any; // relasi manual (opsional)

  question: string;

  type: 'multiple_choice' | 'essay';

  options?: {
    type: 'text' | 'image';
    value: string;
  }[];

  answer?: string;

  index: number;

  created_at: Date;
  created_by: string;

  updated_at?: Date;
  updated_by?: string;

  deleted_at?: Date;
  deleted_by?: string;
}
