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

  async getExamPerformance(filter: ReportFilter, user?: any) {
    try {
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
          subjects (
            id,
            name,
            class_id
          )
        `,
      );

      if (filter.from) query = query.gte('date', filter.from);
      if (filter.to) query = query.lte('date', filter.to);
      if (filter.subjectId) query = query.eq('subject_id', filter.subjectId);
      if (allowedSubjectIds) query = query.in('subject_id', allowedSubjectIds);
      if (filter.examType) query = query.eq('type', filter.examType.toUpperCase());

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      return data || [];
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
          created_at,
          exam_id,
          student_id,
          exams (
            id,
            title,
            type,
            date,
            subject_id,
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

      let rows = data || [];

      if (filter.subjectId) {
        rows = rows.filter((row: any) => row?.exams?.subject_id === filter.subjectId);
      }
      if (allowedSubjectIds) {
        rows = rows.filter((row: any) => allowedSubjectIds.includes(row?.exams?.subject_id));
      }
      if (filter.examType) {
        rows = rows.filter(
          (row: any) => row?.exams?.type?.toUpperCase() === filter.examType?.toUpperCase(),
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

      rows = rows.map((row: any) => ({
        ...row,
        users: usersById[row.student_id] || null,
      }));

      return rows;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubjectSummary(filter: ReportFilter, user?: any) {
    const submissions = await this.getSubmissionList(filter, user);

    const grouped = submissions.reduce((acc: any, row: any) => {
      const subjectId = row?.exams?.subjects?.id || row?.exams?.subject_id || 'unknown';
      const subjectName = row?.exams?.subjects?.name || 'Tanpa Mapel';
      const score = this.getNumericScore(row?.score);

      if (!acc[subjectId]) {
        acc[subjectId] = {
          subjectId,
          subject: subjectName,
          class_id: row?.exams?.subjects?.class_id || '-',
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

      acc[subjectId].totalSubmissions += 1;
      if (row?.student_id) acc[subjectId].totalStudents.add(row.student_id);
      if (row?.exam_id) acc[subjectId].totalExams.add(row.exam_id);

      if (score === null) {
        acc[subjectId].unscoredSubmissions += 1;
        return acc;
      }

      acc[subjectId].scoredSubmissions += 1;
      acc[subjectId].totalScore += score;
      acc[subjectId].averageScore =
        acc[subjectId].totalScore / acc[subjectId].scoredSubmissions;
      acc[subjectId].highestScore =
        acc[subjectId].highestScore === null ? score : Math.max(acc[subjectId].highestScore, score);
      acc[subjectId].lowestScore =
        acc[subjectId].lowestScore === null ? score : Math.min(acc[subjectId].lowestScore, score);
      if (score >= 75) acc[subjectId].passedCount += 1;
      else acc[subjectId].failedCount += 1;

      return acc;
    }, {});

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
    const submissions = await this.getSubmissionList(filter, user);

    const grouped = submissions.reduce((acc: any, row: any) => {
      const studentId = row?.student_id || 'unknown';
      const score = this.getNumericScore(row?.score);

      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          student: row?.users?.name || 'Tanpa Nama',
          userid: row?.users?.userid || '-',
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

      acc[studentId].totalSubmissions += 1;
      if (row?.exams?.subjects?.name) acc[studentId].subjects.add(row.exams.subjects.name);
      if (row?.exam_id) acc[studentId].exams.add(row.exam_id);

      if (score === null) {
        acc[studentId].unscoredSubmissions += 1;
        return acc;
      }

      acc[studentId].scoredSubmissions += 1;
      acc[studentId].totalScore += score;
      acc[studentId].averageScore =
        acc[studentId].totalScore / acc[studentId].scoredSubmissions;
      acc[studentId].highestScore =
        acc[studentId].highestScore === null ? score : Math.max(acc[studentId].highestScore, score);
      acc[studentId].lowestScore =
        acc[studentId].lowestScore === null ? score : Math.min(acc[studentId].lowestScore, score);
      if (score >= 75) acc[studentId].passedCount += 1;
      else acc[studentId].failedCount += 1;

      return acc;
    }, {});

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
