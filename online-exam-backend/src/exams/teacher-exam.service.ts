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
      // Ambil semua exam_submissions untuk hitung unscored_count
      const { data: submissions } = await this.supabase
        .from('exam_submissions')
        .select('exam_id,score');

      const examIds = [...new Set(submissions?.map(s => s.exam_id) || [])];
      if (!examIds.length) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

      const unscoredMap: Record<string, number> = {};
      (submissions || []).forEach(s => {
        if (!unscoredMap[s.exam_id]) unscoredMap[s.exam_id] = 0;
        if (s.score === null || s.score === undefined) unscoredMap[s.exam_id]++;
      });

      let allowedExamIds = examIds;
      if (String(user?.role || '').toUpperCase() === 'GURU') {
        const { data: subjects, error: subjectError } = await this.supabase
          .from('subjects')
          .select('id')
          .eq('teacher_id', user.sub)
          .is('deleted_at', null);

        if (subjectError) throw new InternalServerErrorException(subjectError.message);

        const subjectIds = (subjects || []).map((subject) => subject.id);
        if (!subjectIds.length) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

        const { data: exams, error: examError } = await this.supabase
          .from('exams')
          .select('id')
          .in('id', examIds)
          .in('subject_id', subjectIds)
          .is('deleted_at', null);

        if (examError) throw new InternalServerErrorException(examError.message);
        allowedExamIds = (exams || []).map((exam) => exam.id);
        if (!allowedExamIds.length) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      // Ambil daftar ujian + subject info
      let query = this.supabase
        .from('exams')
        .select('*, subject:subjects(name, class_id)', { count: 'exact' })
        .in('id', allowedExamIds)
        .is('deleted_at', null);

      if (search) {
        query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%`);
      }

      query = query.order(sort, { ascending: order === 'asc' }).range(from, to);

      const { data: exams, count, error } = await query;
      if (error) throw new InternalServerErrorException(error.message);

      const examsWithUnscored = (exams || []).map(e => ({
        ...e,
        unscored_count: unscoredMap[e.id] || 0,
      }));

      return {
        data: examsWithUnscored,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (err: any) {
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

      const { data: questions } = await this.supabase
        .from('questionnaires')
        .select('*')
        .eq('exam_id', submission.exam_id)
        .is('deleted_at', null)
        .order('index', { ascending: true });

      const mappedQuestions = (questions || []).map(q => {
        const ans = answerByQuestionId.get(String(q.id));
        return {
          ...q,
          student_answer: ans?.answer ?? '',
          is_correct: ans?.is_correct ?? (q.type === 'multiple_choice' ? false : null),
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

      if (submission.session_id) {
        const { error: sessionDeleteError } = await this.supabase
          .from('exam_sessions')
          .delete()
          .eq('id', submission.session_id);

        if (sessionDeleteError) throw new InternalServerErrorException(sessionDeleteError.message);
      }

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
    scores: { question_id: string; is_correct: boolean }[],
    totalScore?: number,
    user?: any,
  ) {
    try {
      if (!Array.isArray(scores) || scores.length === 0) {
        throw new BadRequestException('Data penilaian tidak boleh kosong');
      }

      const normalizedScore = Number(totalScore);
      if (!Number.isFinite(normalizedScore)) {
        throw new BadRequestException('Total nilai tidak valid');
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

      const updatedAnswers = existingAnswers.map(a => {
        const questionId = String(a.question_id);
        return scoreByQuestionId.has(questionId)
          ? { ...a, is_correct: scoreByQuestionId.get(questionId) }
          : a;
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

      const { data, error: updateError } = await this.supabase
        .from('exam_submissions')
        .update({
          answers: updatedAnswers,
          score: Math.max(0, Math.min(100, Math.round(normalizedScore))),
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
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }
}
