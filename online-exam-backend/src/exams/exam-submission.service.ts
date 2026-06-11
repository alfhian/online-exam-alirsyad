import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  private hasSubmittedAnswers(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.some((answer) => {
        if (!answer || typeof answer !== 'object') return false;
        if (!('question_id' in answer)) return false;
        if (!('answer' in answer)) return false;
        return answer.answer !== undefined && answer.answer !== null;
      });
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return this.hasSubmittedAnswers(parsed);
      } catch {
        return value.trim().length > 0;
      }
    }

    return Boolean(value && typeof value === 'object' && Object.keys(value as object).length > 0);
  }

  private isUniqueSubmissionViolation(error: any): boolean {
    return (
      error?.code === '23505' &&
      String(error?.message || error?.details || '').includes('UQ_exam_submissions_exam_student')
    );
  }

  private toSubmissionResponse(submission: any) {
    return {
      id: submission.id,
      exam_id: submission.exam_id,
      student_id: submission.student_id,
      session_id: submission.session_id,
      score: submission.score ?? null,
    };
  }

  private async findExistingSubmission(examId: string, studentId: string) {
    const { data, error } = await this.supabase
      .from('exam_submissions')
      .select('id, exam_id, student_id, session_id, answers, score')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async handleDuplicateSubmission(examId: string, studentId: string, sessionId: string) {
    const submission = await this.findExistingSubmission(examId, studentId);

    if (submission?.session_id === sessionId && this.hasSubmittedAnswers(submission.answers)) {
      return this.toSubmissionResponse(submission);
    }

    throw new BadRequestException('Anda sudah mengirimkan jawaban untuk ujian ini.');
  }

  private async enqueueSubmissionPostProcessJob(submission: any, answers: any[], updatedBy: string) {
    const { error } = await this.supabase.from('exam_submission_jobs').insert({
      type: 'score_exam_submission',
      submission_id: submission.id,
      exam_id: submission.exam_id,
      session_id: submission.session_id,
      answers,
      updated_by: updatedBy,
    });

    if (error) {
      console.error('Failed to enqueue exam submission post-process job:', error.message);
    }
  }

  private normalizeClassIdentifier(value?: string | null) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/^KELAS/, '');
  }

  private fetchSubmitAccessData(examId: string, studentId: string) {
    return Promise.all([
      this.supabase
        .from('users')
        .select('id,class_id,class_name,role')
        .eq('id', studentId)
        .is('deleted_at', null)
        .single(),
      this.supabase
        .from('exams')
        .select('id, subject:subjects(id,class_id)')
        .eq('id', examId)
        .is('deleted_at', null)
        .single(),
    ]);
  }

  private assertStudentExamAccess(student: any, studentError: any, exam: any, examError: any) {
    if (studentError || !student) throw new NotFoundException('Siswa tidak ditemukan');
    if (examError || !exam) throw new NotFoundException('Ujian tidak ditemukan');
    if (String(student.role || '').toUpperCase() !== 'SISWA') {
      throw new ForbiddenException('Hanya siswa yang dapat mengerjakan ujian.');
    }

    const subject = Array.isArray(exam.subject) ? exam.subject[0] : exam.subject;
    const studentClasses = [
      this.normalizeClassIdentifier(student.class_id),
      this.normalizeClassIdentifier(student.class_name),
    ].filter(Boolean);
    const subjectClass = this.normalizeClassIdentifier(subject?.class_id);

    if (!subjectClass || !studentClasses.includes(subjectClass)) {
      throw new ForbiddenException('Ujian ini tidak tersedia untuk kelas Anda.');
    }
  }

  private async assertStudentCanSubmitExam(examId: string, studentId: string) {
    const [{ data: student, error: studentError }, { data: exam, error: examError }] =
      await this.fetchSubmitAccessData(examId, studentId);

    this.assertStudentExamAccess(student, studentError, exam, examError);
  }

  async getSubmittedExamsByStudent(
    studentId: string,
    search: string,
    sort: string = 'created_at',
    order: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;

    const query = this.supabase
      .from('exam_submissions')
      .select(
        `
        *,
        exam:exams(*, subject:subjects(*))
      `,
      )
      .eq('student_id', studentId);

    const keyword = search?.trim().toLowerCase();

    const { data, error } = await query.order(sort, { ascending: order === 'asc' });

    if (error) throw new InternalServerErrorException(error.message);

    const answeredSubmissions = (data || []).filter((submission: any) =>
      this.hasSubmittedAnswers(submission.answers),
    );

    const filteredData = keyword
      ? answeredSubmissions.filter((submission: any) =>
          [submission.exam?.title, submission.exam?.type].some((value) =>
            String(value ?? '').toLowerCase().includes(keyword),
          ),
        )
      : answeredSubmissions;

    const paginatedData = filteredData.slice(offset, offset + limit);

    return {
      data: paginatedData,
      meta: {
        total: filteredData.length,
        page,
        limit,
        totalPages: Math.ceil(filteredData.length / limit),
      },
    };
  }

  async getSubmissionDetail(submissionId: string, studentId?: string) {
    let query = this.supabase
      .from('exam_submissions')
      .select(
        `
        *,
        exam:exams(*, subject:subjects(*))
      `,
      )
      .eq('id', submissionId);

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query.single();

    if (error || !data) throw new NotFoundException('Submission tidak ditemukan');

    const answerList = Array.isArray(data.answers) ? data.answers : [];
    const answerByQuestionId = new Map<string, any>(
      answerList.map((answer) => [String(answer.question_id), answer]),
    );

    const { data: questions, error: qError } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('exam_id', data.exam_id)
      .is('deleted_at', null)
      .order('index', { ascending: true });

    if (qError) throw new InternalServerErrorException(qError.message);

    data.answers = (questions || []).map((question) => {
      const answer = answerByQuestionId.get(String(question.id));
      return {
        ...(answer || {}),
        question_id: question.id,
        answer: answer?.answer ?? '',
        is_correct: answer?.is_correct ?? (question.type === 'multiple_choice' ? false : null),
        question,
      };
    });

    return data;
  }

  async hasSubmitted(examId: string, studentId: string) {
    const { data, error } = await this.supabase
      .from('exam_submissions')
      .select('answers')
      .eq('exam_id', examId)
      .eq('student_id', studentId);

    if (error) throw new InternalServerErrorException(error.message);

    return { submitted: (data || []).some((submission) => this.hasSubmittedAnswers(submission.answers)) };
  }

  async submit(dto: CreateExamSubmissionDto) {
    const { exam_id, student_id, session_id, answers, created_by } = dto;

    if (!exam_id) throw new BadRequestException('exam_id is required');
    if (!student_id) throw new BadRequestException('student_id is required');
    if (!session_id) throw new BadRequestException('session_id is required');
    if (!Array.isArray(answers)) throw new BadRequestException('answers must be an array');

    const [accessResult, existingResult] = await Promise.all([
      this.fetchSubmitAccessData(exam_id, student_id),
      this.supabase
        .from('exam_submissions')
        .select('id, exam_id, student_id, session_id, answers, score')
        .eq('exam_id', exam_id)
        .eq('student_id', student_id)
        .limit(5),
    ]);

    const [{ data: student, error: studentError }, { data: exam, error: examError }] = accessResult;
    this.assertStudentExamAccess(student, studentError, exam, examError);

    const { data: existingRows, error: existingError } = existingResult;
    if (existingError) throw new InternalServerErrorException(existingError.message);

    const submittedRow = existingRows?.find((row) => this.hasSubmittedAnswers(row.answers));
    if (submittedRow) {
      if (submittedRow.session_id === session_id) {
        return this.toSubmissionResponse(submittedRow);
      }

      throw new BadRequestException('Anda sudah mengirimkan jawaban untuk ujian ini.');
    }

    const existingSubmission =
      existingRows?.find((row) => row.session_id === session_id) || existingRows?.[0] || null;

    const payload = {
      exam_id,
      student_id,
      session_id,
      answers,
      score: null,
      updated_at: new Date(),
      updated_by: created_by,
    };

    const query = existingSubmission
      ? this.supabase.from('exam_submissions').update(payload).eq('id', existingSubmission.id)
      : this.supabase.from('exam_submissions').insert({
          ...payload,
          created_by,
        });

    const { data, error } = await query.select('id, exam_id, student_id, session_id, score').single();

    if (error) {
      if (this.isUniqueSubmissionViolation(error)) {
        return this.handleDuplicateSubmission(exam_id, student_id, session_id);
      }

      throw new InternalServerErrorException(error.message);
    }

    void this.enqueueSubmissionPostProcessJob(data, answers, created_by);

    return data;
  }
}
