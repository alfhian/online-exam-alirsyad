import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateExamSubmissionDto {
  exam_id: string;
  student_id: string;
  session_id: string;
  answers: any[];
  created_by: string;
}

@Injectable()
export class ExamSubmissionService {
  constructor(private readonly supabase: SupabaseClient) {}

  // ================================
  // GET SUBMISSIONS BY STUDENT
  // ================================
  async getSubmittedExamsByStudent(
    studentId: string,
    search: string,
    sort: string = 'created_at',
    order: 'asc' | 'desc' = 'asc',
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('exam_submissions')
      .select(
        `
        *,
        exam:exams(*, subject:subjects(*))
      `,
        { count: 'exact' },
      )
      .eq('student_id', studentId);

    if (search?.trim()) {
      query = query.ilike('exam.title', `%${search}%`);
    }

    const { data, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // ================================
  // GET SINGLE SUBMISSION DETAIL
  // ================================
  async getSubmissionDetail(submissionId: string, studentId?: string) {
    let query = this.supabase
      .from('exam_submissions')
      .select(
        `
        *,
        exam:exams(*, subject:subjects(*))
      `
      )
      .eq('id', submissionId);

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query.single();

    if (error || !data) throw new NotFoundException('Submission tidak ditemukan');

    const answerList = data.answers || [];

    if (!answerList.length) return data;

    // Ambil semua question_id unik
    const questionIds = Array.from(new Set(answerList.map((a) => a.question_id)));

    if (questionIds.length === 0) return data;

    // Ambil pertanyaan terkait dari tabel questionnaire
    const { data: questions, error: qError } = await this.supabase
      .from('questionnaires')
      .select('*')
      .in('id', questionIds);

    if (qError) throw new InternalServerErrorException(qError.message);

    // Gabungkan jawaban dengan pertanyaan
    data.answers = answerList.map((a) => ({
      ...a,
      question: questions.find((q) => q.id === a.question_id) || null,
    }));

    return data;
  }

  // ================================
  // CHECK IF SUBMITTED
  // ================================
  async hasSubmitted(examId: string, studentId: string) {
    const { count, error } = await this.supabase
      .from('exam_submissions')
      .select('id')
      .eq('exam_id', examId)
      .eq('student_id', studentId);

    if (error) throw new InternalServerErrorException(error.message);
    
    return { submitted: (count || 0) > 0 };
  }

  // ================================
  // SUBMIT EXAM
  // ================================
  async submit(dto: CreateExamSubmissionDto) {
    const { exam_id, student_id, session_id, answers, created_by } = dto;

    if (!exam_id) throw new BadRequestException('exam_id is required');
    if (!student_id) throw new BadRequestException('student_id is required');
    if (!session_id) throw new BadRequestException('session_id is required');
    if (!Array.isArray(answers)) throw new BadRequestException('answers must be an array');

    // Check existing submission
    const { count, error: existingError } = await this.supabase
      .from('exam_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)

    console.log(existingError);
    

    if (existingError) throw new InternalServerErrorException(existingError.message);
    if (count && count > 0)
      throw new BadRequestException('Anda sudah mengirimkan jawaban untuk ujian ini.');

    // Insert new submission
    const { data, error } = await this.supabase
      .from('exam_submissions')
      .insert({ exam_id, student_id, session_id, answers, created_by })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return data;
  }
}
