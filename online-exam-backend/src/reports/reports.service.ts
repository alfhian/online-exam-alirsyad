import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

type ReportFilter = {
  from?: string;
  to?: string;
  subjectId?: string;
  examType?: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseClient) {}

  private getNumericScore(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const score = Number(value);
    return Number.isFinite(score) ? score : null;
  }

  private normalizeScoreWeight(value: unknown, fallback: number) {
    const weight = Number(value);
    if (!Number.isFinite(weight)) return fallback;
    return Math.max(0, Math.min(100, Math.round(weight)));
  }

  private firstRelation<T = any>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
  }

  private normalizeClassIdentifier(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, '');
  }

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
        return this.hasSubmittedAnswers(JSON.parse(value));
      } catch {
        return value.trim().length > 0;
      }
    }

    return Boolean(value && typeof value === 'object' && Object.keys(value as object).length > 0);
  }

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

  private getMultipleChoicePreviewScore(answersValue: unknown, questions: any[]) {
    const multipleChoiceQuestions = (questions || []).filter(
      (question) => question.type === 'multiple_choice',
    );
    if (multipleChoiceQuestions.length === 0) return null;

    const answers = this.normalizeAnswers(answersValue);
    const correctCount = multipleChoiceQuestions.filter((question) => {
      const answer = answers.find((item) => String(item?.question_id) === String(question.id));
      return String(answer?.answer ?? '').trim().toLowerCase() === String(question.answer ?? '').trim().toLowerCase();
    }).length;

    return Math.round((correctCount / multipleChoiceQuestions.length) * 100);
  }

  private getWeightedMultipleChoicePreviewScore(
    answersValue: unknown,
    questions: any[],
    multipleChoiceWeight: unknown,
  ) {
    const rawScore = this.getMultipleChoicePreviewScore(answersValue, questions);
    if (rawScore === null) return null;
    return Math.round((rawScore * this.normalizeScoreWeight(multipleChoiceWeight, 50)) / 100);
  }

  private async attachMultipleChoicePreview(rows: any[]) {
    const examIds = [...new Set(rows.map((row: any) => row.exam_id).filter(Boolean))];
    if (examIds.length === 0) return rows;

    const { data: questions, error } = await this.supabase
      .from('questionnaires')
      .select('id,exam_id,type,answer')
      .in('exam_id', examIds)
      .is('deleted_at', null);

    if (error) throw new InternalServerErrorException(error.message);

    const questionsByExamId = (questions || []).reduce((acc: Record<string, any[]>, question: any) => {
      const examId = String(question.exam_id);
      if (!acc[examId]) acc[examId] = [];
      acc[examId].push(question);
      return acc;
    }, {});

    return rows.map((row: any) => {
      const examQuestions = questionsByExamId[String(row.exam_id)] || [];
      const hasEssay = examQuestions.some((question: any) => question.type !== 'multiple_choice');
      const finalScoreMissing = row.score === null || row.score === undefined;

      return {
        ...row,
        multiple_choice_score: hasEssay
          ? this.getWeightedMultipleChoicePreviewScore(
              row.answers,
              examQuestions,
              row.exam?.multiple_choice_weight || row.exams?.multiple_choice_weight,
            )
          : this.getMultipleChoicePreviewScore(row.answers, examQuestions),
        is_multiple_choice_only_score: finalScoreMissing,
        essay_pending: hasEssay && finalScoreMissing,
      };
    });
  }

  private normalizeSubmissionRow(row: any) {
    const exam = this.firstRelation(row?.exams);
    const subject = this.firstRelation(exam?.subjects);

    return {
      ...row,
      exam,
      subject,
      exams: {
        ...(exam || {}),
        subjects: subject,
      },
      users: this.firstRelation(row?.users) || row?.users || null,
    };
  }

  private async getAllowedSubjectIds(user?: any) {
    if (String(user?.role || '').toUpperCase() !== 'GURU') return null;

    const { data, error } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('teacher_id', user.sub)
      .is('deleted_at', null);

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map((row: any) => row.id);
  }

  private async getReportSubjects(filter: ReportFilter, user?: any) {
    const allowedSubjectIds = await this.getAllowedSubjectIds(user);
    if (allowedSubjectIds && allowedSubjectIds.length === 0) return [];
    if (allowedSubjectIds && filter.subjectId && !allowedSubjectIds.includes(filter.subjectId)) return [];

    let query = this.supabase
      .from('subjects')
      .select('id,name,class_id,teacher_id')
      .is('deleted_at', null);

    if (filter.subjectId) query = query.eq('id', filter.subjectId);
    if (allowedSubjectIds) query = query.in('id', allowedSubjectIds);

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  private async getReportStudents(filter: ReportFilter, user?: any) {
    const subjects = await this.getReportSubjects(filter, user);
    const allowedClasses = new Set(
      subjects.map((subject: any) => this.normalizeClassIdentifier(subject.class_id)).filter(Boolean),
    );

    const { data, error } = await this.supabase
      .from('users')
      .select('id,name,userid,class_id,class_name')
      .eq('role', 'SISWA')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);

    if (String(user?.role || '').toUpperCase() !== 'GURU' && !filter.subjectId) {
      return data || [];
    }

    return (data || []).filter((student: any) => {
      if (allowedClasses.size === 0) return false;
      return [student.class_id, student.class_name]
        .map((value) => this.normalizeClassIdentifier(value))
        .some((value) => allowedClasses.has(value));
      });
  }

  private async getReportExams(filter: ReportFilter, user?: any) {
    const allowedSubjectIds = await this.getAllowedSubjectIds(user);
    if (allowedSubjectIds && allowedSubjectIds.length === 0) return [];
    if (allowedSubjectIds && filter.subjectId && !allowedSubjectIds.includes(filter.subjectId)) return [];

    let query = this.supabase.from('exams').select(
      `
        id,
        title,
        type,
        date,
        duration,
        subject_id,
        multiple_choice_weight,
        essay_weight,
        subjects (
          id,
          name,
          class_id
        )
      `,
    ).is('deleted_at', null);

    if (filter.from) query = query.gte('date', filter.from);
    if (filter.to) query = query.lte('date', filter.to);
    if (filter.subjectId) query = query.eq('subject_id', filter.subjectId);
    if (allowedSubjectIds) query = query.in('subject_id', allowedSubjectIds);
    if (filter.examType) query = query.eq('type', filter.examType.toUpperCase());

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);

    return (data || []).map((row: any) => ({
      ...row,
      subjects: this.firstRelation(row.subjects),
    }));
  }

  private async getSubmittedRowsByExamIds(examIds: string[]) {
    if (examIds.length === 0) return [];

    const { data, error } = await this.supabase.from('exam_submissions').select(
      `
        id,
        score,
        answers,
        created_at,
        exam_id,
        student_id,
        exams (
          id,
          title,
          type,
          date,
          subject_id,
          multiple_choice_weight,
          essay_weight,
          subjects (
            id,
            name,
            class_id
          )
        )
      `,
    ).in('exam_id', examIds);

    if (error) throw new InternalServerErrorException(error.message);

    const rows = (data || [])
      .filter((row: any) => this.hasSubmittedAnswers(row.answers))
      .map((row: any) => this.normalizeSubmissionRow(row));

    const studentIds = [...new Set(rows.map((row: any) => row.student_id).filter(Boolean))];
    if (studentIds.length === 0) return rows;

    const { data: users, error: userError } = await this.supabase
      .from('users')
      .select('id,name,userid')
      .in('id', studentIds);

    if (userError) throw new InternalServerErrorException(userError.message);

    const usersById = (users || []).reduce((acc: Record<string, any>, user: any) => {
      acc[user.id] = user;
      return acc;
    }, {});

    return rows.map((row: any) => ({
      ...row,
      users: usersById[row.student_id] || null,
      student: usersById[row.student_id] || null,
    }));
  }

  async getExamPerformance(filter: ReportFilter, user?: any) {
    try {
      return this.getReportExams(filter, user);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubmissionList(filter: ReportFilter, user?: any) {
    try {
      const allowedSubjectIds = await this.getAllowedSubjectIds(user);
      if (allowedSubjectIds && allowedSubjectIds.length === 0) return [];
      if (allowedSubjectIds && filter.subjectId && !allowedSubjectIds.includes(filter.subjectId)) return [];

      let query = this.supabase.from('exam_submissions').select(
        `
          id,
          score,
          answers,
          created_at,
          exam_id,
          student_id,
          exams (
            id,
            title,
            type,
            date,
            subject_id,
            multiple_choice_weight,
            essay_weight,
            subjects (
              id,
              name,
              class_id
            )
          )
        `,
      );

      if (filter.from) query = query.gte('created_at', `${filter.from}T00:00:00`);
      if (filter.to) query = query.lte('created_at', `${filter.to}T23:59:59`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      let rows = (data || [])
        .filter((row: any) => this.hasSubmittedAnswers(row.answers))
        .map((row: any) => this.normalizeSubmissionRow(row));

      if (filter.subjectId) {
        rows = rows.filter((row: any) => row?.exam?.subject_id === filter.subjectId);
      }
      if (allowedSubjectIds) {
        rows = rows.filter((row: any) => allowedSubjectIds.includes(row?.exam?.subject_id));
      }
      if (filter.examType) {
        rows = rows.filter(
          (row: any) => row?.exam?.type?.toUpperCase() === filter.examType?.toUpperCase(),
        );
      }

      const studentIds = [...new Set(rows.map((row: any) => row.student_id).filter(Boolean))];
      let usersById: Record<string, any> = {};

      if (studentIds.length) {
        const { data: users, error: userError } = await this.supabase
          .from('users')
          .select('id,name,userid')
          .in('id', studentIds);

        if (userError) throw userError;
        usersById = (users || []).reduce((acc: Record<string, any>, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      const rowsWithStudents = rows.map((row: any) => ({
        ...row,
        users: usersById[row.student_id] || null,
        student: usersById[row.student_id] || null,
      }));

      return this.attachMultipleChoicePreview(rowsWithStudents);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubjectSummary(filter: ReportFilter, user?: any) {
    const [subjects, exams] = await Promise.all([
      this.getReportSubjects(filter, user),
      this.getReportExams(filter, user),
    ]);
    const submissions = await this.getSubmittedRowsByExamIds(exams.map((exam: any) => exam.id).filter(Boolean));

    const grouped = subjects.reduce((acc: any, subject: any) => {
      acc[subject.id] = {
        subjectId: subject.id,
        subject: subject.name || 'Tanpa Mapel',
        class_id: subject.class_id || '-',
        totalSubmissions: 0,
        scoredSubmissions: 0,
        unscoredSubmissions: 0,
        totalStudents: new Set<string>(),
        totalExams: new Set<string>(),
        totalScore: 0,
        averageScore: 0,
        highestScore: null,
        lowestScore: null,
        passedCount: 0,
        failedCount: 0,
      };
      return acc;
    }, {});

    exams.forEach((exam: any) => {
      const subject = exam?.subjects || null;
      const subjectId = subject?.id || exam?.subject_id || 'unknown';
      const subjectName = subject?.name || 'Tanpa Mapel';

      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          subjectId,
          subject: subjectName,
          class_id: subject?.class_id || '-',
          totalSubmissions: 0,
          scoredSubmissions: 0,
          unscoredSubmissions: 0,
          totalStudents: new Set<string>(),
          totalExams: new Set<string>(),
          totalScore: 0,
          averageScore: 0,
          highestScore: null,
          lowestScore: null,
          passedCount: 0,
          failedCount: 0,
        };
      }

      if (exam?.id) grouped[subjectId].totalExams.add(exam.id);
    });

    submissions.forEach((row: any) => {
      const subject = row?.subject || row?.exams?.subjects || null;
      const subjectId = subject?.id || row?.exam?.subject_id || row?.exams?.subject_id || 'unknown';
      const subjectName = subject?.name || 'Tanpa Mapel';
      const score = this.getNumericScore(row?.score);

      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          subjectId,
          subject: subjectName,
          class_id: subject?.class_id || '-',
          totalSubmissions: 0,
          scoredSubmissions: 0,
          unscoredSubmissions: 0,
          totalStudents: new Set<string>(),
          totalExams: new Set<string>(),
          totalScore: 0,
          averageScore: 0,
          highestScore: null,
          lowestScore: null,
          passedCount: 0,
          failedCount: 0,
        };
      }

      grouped[subjectId].totalSubmissions += 1;
      if (row?.student_id) grouped[subjectId].totalStudents.add(row.student_id);

      if (score === null) {
        grouped[subjectId].unscoredSubmissions += 1;
        return;
      }

      grouped[subjectId].scoredSubmissions += 1;
      grouped[subjectId].totalScore += score;
      grouped[subjectId].averageScore =
        grouped[subjectId].totalScore / grouped[subjectId].scoredSubmissions;
      grouped[subjectId].highestScore =
        grouped[subjectId].highestScore === null ? score : Math.max(grouped[subjectId].highestScore, score);
      grouped[subjectId].lowestScore =
        grouped[subjectId].lowestScore === null ? score : Math.min(grouped[subjectId].lowestScore, score);
      if (score >= 75) grouped[subjectId].passedCount += 1;
      else grouped[subjectId].failedCount += 1;
    });

    return Object.values(grouped)
      .map((row: any) => ({
        ...row,
        totalStudents: row.totalStudents.size,
        totalExams: row.totalExams.size,
        averageScore: row.scoredSubmissions
          ? Number(row.averageScore.toFixed(2))
          : null,
      }))
      .sort((a: any, b: any) => Number(b.averageScore ?? -1) - Number(a.averageScore ?? -1));
  }

  async getStudentScoreSummary(filter: ReportFilter, user?: any) {
    const [students, exams] = await Promise.all([
      this.getReportStudents(filter, user),
      this.getReportExams(filter, user),
    ]);
    const submissions = await this.getSubmittedRowsByExamIds(exams.map((exam: any) => exam.id).filter(Boolean));

    const grouped = students.reduce((acc: any, student: any) => {
      acc[student.id] = {
        studentId: student.id,
        student: student.name || 'Tanpa Nama',
        userid: student.userid || '-',
        class_id: student.class_id || student.class_name || '-',
        totalSubmissions: 0,
        scoredSubmissions: 0,
        unscoredSubmissions: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: null,
        lowestScore: null,
        passedCount: 0,
        failedCount: 0,
        subjects: new Set<string>(),
        exams: new Set<string>(),
      };
      return acc;
    }, {});

    submissions.forEach((row: any) => {
      const studentId = row?.student_id || 'unknown';
      const score = this.getNumericScore(row?.score);

      if (!grouped[studentId]) {
        grouped[studentId] = {
          studentId,
          student: row?.users?.name || 'Tanpa Nama',
          userid: row?.users?.userid || '-',
          class_id: '-',
          totalSubmissions: 0,
          scoredSubmissions: 0,
          unscoredSubmissions: 0,
          totalScore: 0,
          averageScore: 0,
          highestScore: null,
          lowestScore: null,
          passedCount: 0,
          failedCount: 0,
          subjects: new Set<string>(),
          exams: new Set<string>(),
        };
      }

      grouped[studentId].totalSubmissions += 1;
      if (row?.subject?.name || row?.exams?.subjects?.name) {
        grouped[studentId].subjects.add(row?.subject?.name || row.exams.subjects.name);
      }
      if (row?.exam_id) grouped[studentId].exams.add(row.exam_id);

      if (score === null) {
        grouped[studentId].unscoredSubmissions += 1;
        return;
      }

      grouped[studentId].scoredSubmissions += 1;
      grouped[studentId].totalScore += score;
      grouped[studentId].averageScore =
        grouped[studentId].totalScore / grouped[studentId].scoredSubmissions;
      grouped[studentId].highestScore =
        grouped[studentId].highestScore === null ? score : Math.max(grouped[studentId].highestScore, score);
      grouped[studentId].lowestScore =
        grouped[studentId].lowestScore === null ? score : Math.min(grouped[studentId].lowestScore, score);
      if (score >= 75) grouped[studentId].passedCount += 1;
      else grouped[studentId].failedCount += 1;
    });

    return Object.values(grouped)
      .map((row: any) => ({
        ...row,
        totalSubjects: row.subjects.size,
        totalExams: row.exams.size,
        subjects: Array.from(row.subjects).join(', '),
        averageScore: row.scoredSubmissions
          ? Number(row.averageScore.toFixed(2))
          : null,
      }))
      .sort((a: any, b: any) => Number(b.averageScore ?? -1) - Number(a.averageScore ?? -1));
  }

  async getDashboardCharts(user: any) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;

    const years = Array.from({ length: 5 }, (_, idx) => startYear + idx);

    const allowedSubjectIds = await this.getAllowedSubjectIds(user);

    let submissionsQuery = this.supabase
      .from('exam_submissions')
      .select('created_at,score,student_id,exams!inner(subject_id)')
      .gte('created_at', `${startYear}-01-01T00:00:00`)
      .lte('created_at', `${currentYear}-12-31T23:59:59`);

    if (allowedSubjectIds) {
      if (allowedSubjectIds.length === 0) {
        return {
          submissionByYear: years.map((year) => ({ year, total: 0 })),
          averageScoreByYear: years.map((year) => ({ year, average: 0 })),
          roleSummary: { siswa: 0, guru: 0, admin: 0 },
        };
      }
      submissionsQuery = submissionsQuery.in('exams.subject_id', allowedSubjectIds);
    }

    const [submissionsRes, usersRes] = await Promise.all([
      submissionsQuery,
      this.supabase.from('users').select('role').is('deleted_at', null),
    ]);

    if (submissionsRes.error) {
      throw new InternalServerErrorException(submissionsRes.error.message);
    }
    if (usersRes.error) {
      throw new InternalServerErrorException(usersRes.error.message);
    }

    const submissions = submissionsRes.data || [];
    const users = usersRes.data || [];

    const submissionByYear = years.map((year) => ({
      year,
      total: submissions.filter((item: any) => new Date(item.created_at).getFullYear() === year)
        .length,
    }));

    const averageScoreByYear = years.map((year) => {
      const rows = submissions.filter(
        (item: any) =>
          new Date(item.created_at).getFullYear() === year && item.score !== null && item.score !== undefined,
      );
      const total = rows.reduce((acc: number, row: any) => acc + Number(row.score || 0), 0);
      return {
        year,
        average: rows.length ? Number((total / rows.length).toFixed(2)) : 0,
      };
    });

    const normalizedRoles = users.map((row: any) => String(row.role || '').toUpperCase());
    const roleSummary = String(user?.role || '').toUpperCase() === 'GURU'
      ? {
          siswa: new Set(submissions.map((row: any) => row.student_id).filter(Boolean)).size,
          guru: 1,
          admin: 0,
        }
      : {
          siswa: normalizedRoles.filter((role) => role === 'SISWA').length,
          guru: normalizedRoles.filter((role) => role === 'GURU').length,
          admin: normalizedRoles.filter((role) => role === 'ADMIN').length,
        };

    return {
      submissionByYear,
      averageScoreByYear,
      roleSummary,
    };
  }
}
