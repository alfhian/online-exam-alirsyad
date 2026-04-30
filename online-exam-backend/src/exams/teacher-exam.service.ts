import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ExamSubmission } from './entities/exam-submission.entity';
import { Exam } from './entities/exam.entity';
import { Questionnaire } from 'src/questionnaires/entities/questionnaire.entity';

@Injectable()
export class TeacherExamsService {
  constructor(private readonly supabase: SupabaseClient) {}

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

      // Ambil daftar ujian + subject info
      let query = this.supabase
        .from('exams')
        .select('*, subject:subjects(name, class_id)', { count: 'exact' })
        .in('id', examIds);

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
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      // 1️⃣ Ambil semua submissions untuk exam tertentu
      const { data: submissions, error: subError } = await this.supabase
        .from('exam_submissions')
        .select('*')
        .eq('exam_id', examId);

      if (subError) throw new InternalServerErrorException(subError.message);
      if (!submissions || !submissions.length)
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

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
        },
      };
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 Ambil detail ujian yang disubmit siswa
   */
  async getSubmissionDetail(submissionId: string) {
    try {
      // ambil submission dulu
      const { data: submission, error } = await this.supabase
        .from('exam_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) throw new NotFoundException(`Submission not found`);

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

      // ambil questions manual
      const questionIds = [...new Set((submission.answers || []).map(a => a.question_id))];

      const { data: questions } = await this.supabase
        .from('questionnaires')
        .select('*')
        .in('id', questionIds);

      const mappedQuestions = (questions || []).map(q => {
        const ans = submission.answers.find(a => a.question_id === q.id);
        return {
          ...q,
          student_answer: ans?.answer ?? null,
          is_correct: ans?.is_correct ?? null,
        };
      });

      return {
        ...submission,
        exam,
        student,
        questions: mappedQuestions,
      };

    } catch (err: any) {
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
  ) {
    try {
      const { data: submission, error } = await this.supabase
        .from('exam_submissions')
        .select('answers, score')
        .eq('id', submissionId)
        .single();

      if (error || !submission) throw new NotFoundException('Submission not found');

      const updatedAnswers = (submission.answers || []).map(a => {
        const match = scores.find(s => s.question_id === a.question_id);
        return match ? { ...a, is_correct: match.is_correct } : a;
      });

      const { data, error: updateError } = await this.supabase
        .from('exam_submissions')
        .update({
          answers: updatedAnswers,
          score: typeof totalScore === 'number' ? totalScore : submission.score,
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
      throw new InternalServerErrorException(err.message);
    }
  }
}
