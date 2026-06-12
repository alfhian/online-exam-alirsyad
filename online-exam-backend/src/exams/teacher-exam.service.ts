import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ExamSubmission } from './entities/exam-submission.entity';
import { Exam } from './entities/exam.entity';
import { Questionnaire } from 'src/questionnaires/entities/questionnaire.entity';

@Injectable()
export class TeacherExamsService {
  constructor(private readonly supabase: SupabaseClient) {}

  private normalizeAnswers(value: unknown): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  private normalizeRelation<T = any>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
  }

  private getStoredEssayScores(answers: any[], essayQuestionIds: string[]) {
    const scores = new Map<string, number>();

    for (const answer of answers) {
      const questionId = String(answer?.question_id);
      if (!essayQuestionIds.includes(questionId)) continue;

      const score = this.clampScore(answer?.essay_score);
      if (score !== null) scores.set(questionId, score);
    }

    // Backward compatibility for the previous single essay-score draft.
    const meta = answers.find((answer) => String(answer?.question_id) === '__essay_score__');
    const legacyScore = this.clampScore(meta?.answer);
    if (legacyScore !== null) {
      for (const questionId of essayQuestionIds) {
        if (!scores.has(questionId)) scores.set(questionId, legacyScore);
      }
    }

    return scores;
  }

  private clampScore(value: unknown) {
    const score = Number(value);
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private sortRows(rows: any[], sort: string, order: 'asc' | 'desc') {
    const direction = order === 'asc' ? 1 : -1;

    return rows.sort((left, right) => {
      const leftValue = this.getSortValue(left, sort);
      const rightValue = this.getSortValue(right, sort);

      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return -1 * direction;
      if (rightValue == null) return 1 * direction;

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), 'id', {
        numeric: true,
        sensitivity: 'base',
      }) * direction;
    });
  }

  private getSortValue(row: any, sort: string) {
    if (sort === 'subject') return row.subject?.name;
    if (sort === 'created_at' || sort === 'submitted_at') return row.latest_submission_at;
    return row?.[sort];
  }

  private async assertTeacherCanAccessExam(examId: string, user?: any) {
    const { data: exam, error } = await this.supabase
      .from('exams')
      .select('id, title, subject_id, subject:subjects(id, name, class_id, teacher_id)')
      .eq('id', examId)
      .is('deleted_at', null)
      .single();

    if (error || !exam) throw new NotFoundException('Exam not found');
    if (String(user?.role || '').toUpperCase() !== 'GURU') return exam;

    const subject = Array.isArray(exam.subject) ? exam.subject[0] : exam.subject;
    if (subject?.teacher_id !== user.sub) {
      throw new ForbiddenException('Anda tidak memiliki akses ke ujian ini');
    }

    return exam;
  }

  /**
   * 🔹 Ambil daftar ujian yang sudah pernah dikerjakan siswa
   * ✅ Tambahkan jumlah submission yang belum di-scoring (unscored_count)
   */
  async getSubmittedExamsByTeacher(
    search = '',
    sort = 'created_at',
    order: 'asc' | 'desc' = 'desc',
    page = 1,
    limit = 10,
    user?: any,
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let allowedSubjectIds: string[] | null = null;
      if (String(user?.role || '').toUpperCase() === 'GURU') {
        const { data: subjects, error: subjectError } = await this.supabase
          .from('subjects')
          .select('id')
          .eq('teacher_id', user.sub)
          .is('deleted_at', null);

        if (subjectError) throw new InternalServerErrorException(subjectError.message);

        allowedSubjectIds = (subjects || []).map((subject) => subject.id);
        if (!allowedSubjectIds.length) {
          return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
        }
      }

      let query = this.supabase
        .from('exam_submissions')
        .select(`
          id,
          exam_id,
          score,
          created_at,
          exams!inner(
            id,
            title,
            type,
            date,
            duration,
            subject_id,
            deleted_at,
            subjects(id, name, class_id, teacher_id)
          )
        `);

      if (allowedSubjectIds) {
        query = query.in('exams.subject_id', allowedSubjectIds);
      }

      const { data: submissions, error } = await query.order('created_at', { ascending: false });
      if (error) throw new InternalServerErrorException(error.message);

      const grouped = (submissions || []).reduce((acc: Record<string, any>, submission: any) => {
        const exam = this.normalizeRelation(submission.exams);
        if (!exam || exam.deleted_at) return acc;

        const subject = this.normalizeRelation(exam.subjects);
        if (!acc[exam.id]) {
          acc[exam.id] = {
            ...exam,
            subject,
            submission_count: 0,
            unscored_count: 0,
            latest_submission_at: submission.created_at,
          };
        }

        acc[exam.id].submission_count += 1;
        if (submission.score === null || submission.score === undefined) {
          acc[exam.id].unscored_count += 1;
        }
        if (new Date(submission.created_at).getTime() > new Date(acc[exam.id].latest_submission_at).getTime()) {
          acc[exam.id].latest_submission_at = submission.created_at;
        }

        return acc;
      }, {});

      const keyword = search.trim().toLowerCase();
      const filtered = Object.values(grouped).filter((exam: any) => {
        if (!keyword) return true;
        return [exam.title, exam.type, exam.subject?.name, exam.subject?.class_id].some((value) =>
          String(value ?? '').toLowerCase().includes(keyword),
        );
      });

      const sorted = this.sortRows(filtered, sort, order);
      const paginated = sorted.slice(from, to + 1);

      return {
        data: paginated,
        meta: {
          total: sorted.length,
          page,
          limit,
          totalPages: Math.ceil(sorted.length / limit),
        },
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 Ambil daftar siswa yang sudah submit ujian tertentu
   * ✅ Urutkan submission belum di-scoring (score null) ke atas
   */
  async getStudentsByExam(
    examId: string,
    search = '',
    page = 1,
    limit = 10,
    user?: any,
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const exam = await this.assertTeacherCanAccessExam(examId, user);

      // 1️⃣ Ambil semua submissions untuk exam tertentu
      const { data: submissions, error: subError } = await this.supabase
        .from('exam_submissions')
        .select('*')
        .eq('exam_id', examId);

      if (subError) throw new InternalServerErrorException(subError.message);
      if (!submissions || !submissions.length)
        return { data: [], meta: { total: 0, page, limit, totalPages: 0, exam } };

      // 2️⃣ Ambil semua student terkait
      const studentIds = submissions.map(s => s.student_id);
      const { data: students, error: stuError } = await this.supabase
        .from('users')
        .select('*')
        .in('id', studentIds);

      if (stuError) throw new InternalServerErrorException(stuError.message);

      // 3️⃣ Gabungkan submissions dengan student
      let combined = submissions.map(sub => ({
        ...sub,
        exam,
        student: students.find(s => s.id === sub.student_id) || null,
      }));

      // 4️⃣ Filter berdasarkan nama student / userid jika ada search
      if (search.trim()) {
        const keyword = search.toLowerCase();
        combined = combined.filter(c =>
          c.student?.name.toLowerCase().includes(keyword) ||
          (c.student?.userid && String(c.student.userid).toLowerCase().includes(keyword)),
        );
      }

      // 5️⃣ Urutkan: score null pertama, lalu score ascending, lalu created_at descending
      combined.sort((a, b) => {
        if (a.score === null && b.score !== null) return -1;
        if (a.score !== null && b.score === null) return 1;
        if (a.score !== null && b.score !== null) {
          if (a.score !== b.score) return a.score - b.score;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // 6️⃣ Pagination
      const total = combined.length;
      const paginated = combined.slice(from, to + 1);

      return {
        data: paginated,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          exam,
        },
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 Ambil detail ujian yang disubmit siswa
   */
  async getSubmissionDetail(submissionId: string, user?: any) {
    try {
      // ambil submission dulu
      const { data: submission, error } = await this.supabase
        .from('exam_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) throw new NotFoundException(`Submission not found`);
      await this.assertTeacherCanAccessExam(submission.exam_id, user);

      // ambil student manual
      const { data: student } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', submission.student_id)
        .single();

      // ambil exam manual + subject
      const { data: examRaw } = await this.supabase
        .from('exams')
        .select('*')
        .eq('id', submission.exam_id)
        .single();

      let subject = null;

      if (examRaw?.subject_id) {
        const { data: subj } = await this.supabase
          .from('subjects') // <- ubah jika nama tabel beda
          .select('*')
          .eq('id', examRaw.subject_id)
          .single();
        
        subject = subj;
      }

      const exam = {
        ...examRaw,
        subject,
      };

      const submissionAnswers = this.normalizeAnswers(submission.answers);
      const answerByQuestionId = new Map(
        submissionAnswers.map((answer) => [String(answer.question_id), answer]),
      );

      const { data: questions, error: questionError } = await this.supabase
        .from('questionnaires')
        .select('*')
        .eq('exam_id', submission.exam_id)
        .is('deleted_at', null)
        .order('index', { ascending: true });

      if (questionError) throw new InternalServerErrorException(questionError.message);

      const essayQuestionIds = (questions || [])
        .filter((question) => question.type !== 'multiple_choice')
        .map((question) => String(question.id));
      const essayScoreByQuestionId = this.getStoredEssayScores(submissionAnswers, essayQuestionIds);

      const mappedQuestions = (questions || []).map(q => {
        const ans = answerByQuestionId.get(String(q.id));
        return {
          ...q,
          student_answer: ans?.answer ?? '',
          is_correct: ans?.is_correct ?? (q.type === 'multiple_choice' ? false : null),
          essay_score: q.type !== 'multiple_choice' ? (essayScoreByQuestionId.get(String(q.id)) ?? null) : null,
        };
      });

      return {
        ...submission,
        exam,
        student,
        questions: mappedQuestions,
      };

    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async cancelSubmission(submissionId: string, user?: any) {
    try {
      const { data: submission, error } = await this.supabase
        .from('exam_submissions')
        .select('id, exam_id, student_id, session_id')
        .eq('id', submissionId)
        .single();

      if (error || !submission) throw new NotFoundException('Submission not found');
      await this.assertTeacherCanAccessExam(submission.exam_id, user);

      if (submission.session_id) {
        const { error: sessionDeleteError } = await this.supabase
          .from('exam_sessions')
          .delete()
          .eq('id', submission.session_id);

        if (sessionDeleteError) throw new InternalServerErrorException(sessionDeleteError.message);
      }

      const { error: jobDeleteError } = await this.supabase
        .from('exam_submission_jobs')
        .delete()
        .eq('submission_id', submissionId);

      if (jobDeleteError) throw new InternalServerErrorException(jobDeleteError.message);

      const { error: submissionDeleteError } = await this.supabase
        .from('exam_submissions')
        .delete()
        .eq('id', submissionId);

      if (submissionDeleteError) throw new InternalServerErrorException(submissionDeleteError.message);

      return {
        message: 'Submission canceled successfully',
        submission_id: submissionId,
        exam_id: submission.exam_id,
        student_id: submission.student_id,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }


  /**
   * ✅ Simpan hasil penilaian guru + total skor
   */
  async updateSubmissionScore(
    submissionId: string,
    scores: { question_id: string; is_correct?: boolean | null; essay_score?: number | null }[],
    totalScore?: number,
    essayScores?: { question_id: string; score: number | null }[],
    user?: any,
  ) {
    try {
      if (!Array.isArray(scores) || scores.length === 0) {
        throw new BadRequestException('Data penilaian tidak boleh kosong');
      }

      const { data: submission, error } = await this.supabase
        .from('exam_submissions')
        .select('answers, score, exam_id')
        .eq('id', submissionId)
        .single();

      if (error || !submission) throw new NotFoundException('Submission not found');
      await this.assertTeacherCanAccessExam(submission.exam_id, user);

      const existingAnswers = this.normalizeAnswers(submission.answers);

      const scoreByQuestionId = new Map(
        scores.map((score) => [
          String(score.question_id),
          score.is_correct === null || score.is_correct === undefined ? null : Boolean(score.is_correct),
        ]),
      );
      const essayScoreByQuestionId = new Map<string, number | null>();

      for (const item of essayScores || []) {
        essayScoreByQuestionId.set(String(item.question_id), this.clampScore(item.score));
      }

      for (const item of scores || []) {
        if (item.essay_score !== undefined) {
          essayScoreByQuestionId.set(String(item.question_id), this.clampScore(item.essay_score));
        }
      }

      const updatedAnswers = existingAnswers.map(a => {
        const questionId = String(a.question_id);
        return {
          ...a,
          ...(scoreByQuestionId.has(questionId) ? { is_correct: scoreByQuestionId.get(questionId) } : {}),
          ...(essayScoreByQuestionId.has(questionId) ? { essay_score: essayScoreByQuestionId.get(questionId) } : {}),
        };
      });
      const existingQuestionIds = new Set(existingAnswers.map((answer) => String(answer.question_id)));

      for (const [questionId, isCorrect] of scoreByQuestionId.entries()) {
        if (!existingQuestionIds.has(questionId)) {
          updatedAnswers.push({
            question_id: questionId,
            answer: '',
            is_correct: isCorrect,
          });
        }
      }

      const { data: questions, error: questionError } = await this.supabase
        .from('questionnaires')
        .select('id, type')
        .eq('exam_id', submission.exam_id)
        .is('deleted_at', null);

      if (questionError) throw new InternalServerErrorException(questionError.message);

      const multipleChoiceIds = (questions || [])
        .filter((question) => question.type === 'multiple_choice')
        .map((question) => String(question.id));
      const essayQuestionIds = (questions || [])
        .filter((question) => question.type !== 'multiple_choice')
        .map((question) => String(question.id));
      const correctMultipleChoiceCount = multipleChoiceIds.filter((questionId) => {
        const answer = updatedAnswers.find((item) => String(item.question_id) === questionId);
        return answer?.is_correct === true;
      }).length;

      const multipleChoiceScore = multipleChoiceIds.length
        ? Math.round((correctMultipleChoiceCount / multipleChoiceIds.length) * 100)
        : null;

      const essayQuestionScores = essayQuestionIds.map((questionId) => {
        const answer = updatedAnswers.find((item) => String(item.question_id) === questionId);
        return this.clampScore(answer?.essay_score);
      });

      if (essayQuestionScores.some((score) => score === null)) {
        throw new BadRequestException('Setiap jawaban essay wajib diberi nilai 0 sampai 100');
      }

      const validEssayQuestionScores = essayQuestionScores as number[];
      const totalEssayScore = validEssayQuestionScores.reduce((sum, score) => sum + score, 0);
      const essayScore = validEssayQuestionScores.length
        ? Math.round(totalEssayScore / validEssayQuestionScores.length)
        : null;

      const scoreComponents = [
        multipleChoiceScore,
        essayScore,
      ].filter((score): score is number => score !== null);
      const calculatedScore = scoreComponents.length
        ? Math.round(scoreComponents.reduce((sum, score) => sum + score, 0) / scoreComponents.length)
        : Math.max(0, Math.min(100, Math.round(Number(totalScore || 0))));

      const answersForStorage = updatedAnswers.filter(
        (answer) => String(answer?.question_id) !== '__essay_score__',
      );

      const { data, error: updateError } = await this.supabase
        .from('exam_submissions')
        .update({
          answers: answersForStorage,
          score: calculatedScore,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) throw new InternalServerErrorException(updateError.message);

      return {
        message: 'Scoring updated successfully',
        submission_id: submissionId,
        score: data?.score,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }
}
