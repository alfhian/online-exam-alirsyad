export type QuestionType = 'multiple_choice' | 'essay';

export class Question {
  id: string;
  questionText: string;
  type: QuestionType;
  points: number;

  exam_id: string;

  // Untuk multiple choice
  choices?: {
    id: string;
    question_id: string;
    text: string;
    is_correct: boolean;
  }[];

  created_at: Date;
  created_by: string;

  updated_at?: Date;
  updated_by?: string;

  deleted_at?: Date;
  deleted_by?: string;
}
