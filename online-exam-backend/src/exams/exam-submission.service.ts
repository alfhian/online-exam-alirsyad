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
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.length > 0 : Boolean(parsed);
      } catch {
        return value.trim().length > 0;
      }
    }

    return Boolean(value && typeof value === 'object' && Object.keys(value as object).length > 0);
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
        { count: 'exact' },
      )
      .eq('student_id', studentId);

    const keyword = search?.trim().toLowerCase();

    const { data, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    const filteredData = keyword
      ? (data || []).filter((submission: any) =>
          [submission.exam?.title, submission.exam?.type].some((value) =>
            String(value ?? '').toLowerCase().includes(keyword),
          ),
        )
      : (data || []);

    return {
      data: filteredData,
      meta: {
        total: keyword ? filteredData.length : count || 0,
        page,
        limit,
        totalPages: Math.ceil((keyword ? filteredData.length : count || 0) / limit),
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

    const answerList = data.answers || [];
    if (!answerList.length) return data;

    const questionIds = Array.from(new Set(answerList.map((answer) => answer.question_id)));
    if (questionIds.length === 0) return data;

    const { data: questions, error: qError } = await this.supabase
      .from('questionnaires')
      .select('*')
      .in('id', questionIds);

    if (qError) throw new InternalServerErrorException(qError.message);

    const questionById = new Map((questions || []).map((question) => [question.id, question]));
    data.answers = answerList.map((answer) => ({
      ...answer,
      question: questionById.get(answer.question_id) || null,
    }));

    return data;
  }

  async hasSubmitted(examId: string, studentId: string) {
    const { count, error } = await this.supabase
      .from('exam_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId)
      .eq('student_id', studentId);

    if (error) throw new InternalServerErrorException(error.message);

    return { submitted: (count || 0) > 0 };
  }

  async submit(dto: CreateExamSubmissionDto) {
    const { exam_id, student_id, session_id, answers, created_by } = dto;

    if (!exam_id) throw new BadRequestException('exam_id is required');
    if (!student_id) throw new BadRequestException('student_id is required');
    if (!session_id) throw new BadRequestException('session_id is required');
    if (!Array.isArray(answers)) throw new BadRequestException('answers must be an array');

    const [accessResult, existingResult, questionsResult] = await Promise.all([
      this.fetchSubmitAccessData(exam_id, student_id),
      this.supabase
        .from('exam_submissions')
        .select('id, session_id, answers')
        .eq('exam_id', exam_id)
        .eq('student_id', student_id)
        .limit(5),
      this.supabase
        .from('questionnaires')
        .select('id, type, answer')
        .eq('exam_id', exam_id)
        .is('deleted_at', null),
    ]);

    const [{ data: student, error: studentError }, { data: exam, error: examError }] = accessResult;
    this.assertStudentExamAccess(student, studentError, exam, examError);

    const { data: existingRows, error: existingError } = existingResult;
    if (existingError) throw new InternalServerErrorException(existingError.message);

    const submittedRow = existingRows?.find((row) => this.hasSubmittedAnswers(row.answers));
    if (submittedRow) {
      throw new BadRequestException('Anda sudah mengirimkan jawaban untuk ujian ini.');
    }

    const existingSubmission =
      existingRows?.find((row) => row.session_id === session_id) || existingRows?.[0] || null;

    const { data: questions, error: qError } = questionsResult;
    if (qError) throw new InternalServerErrorException(qError.message);

    const questionById = new Map((questions || []).map((question) => [String(question.id), question]));
    const mcQuestions = (questions || []).filter((question) => question.type === 'multiple_choice');
    const essayQuestions = (questions || []).filter((question) => question.type === 'essay');
    const multipleChoiceIds = new Set(mcQuestions.map((question) => String(question.id)));

    const scoredAnswers = answers.map((answer) => {
      const question = questionById.get(String(answer.question_id));
      const isCorrect =
        question?.type === 'multiple_choice'
          ? String(answer.answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase()
          : null;

      return { ...answer, is_correct: isCorrect };
    });

    const totalScore =
      mcQuestions.length > 0 && essayQuestions.length === 0
        ? Math.round(
            (scoredAnswers.filter(
              (answer) => multipleChoiceIds.has(String(answer.question_id)) && answer.is_correct === true,
            ).length /
              mcQuestions.length) *
              100,
          )
        : null;

    const payload = {
      exam_id,
      student_id,
      session_id,
      answers: scoredAnswers,
      score: totalScore,
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

    if (error) throw new InternalServerErrorException(error.message);

    this.supabase
      .from('exam_sessions')
      .update({ finished: true })
      .eq('id', session_id)
      .then(({ error: finishError }) => {
        if (finishError) console.error('Failed to mark exam session finished:', finishError.message);
      });

    return data;
  }
}
