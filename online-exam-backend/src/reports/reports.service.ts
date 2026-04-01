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

  async getExamPerformance(filter: ReportFilter) {
    try {
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
      if (filter.examType) query = query.eq('type', filter.examType.toUpperCase());

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      return data || [];
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubmissionList(filter: ReportFilter) {
    try {
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

  async getSubjectSummary(filter: ReportFilter) {
    const submissions = await this.getSubmissionList(filter);

    const grouped = submissions.reduce((acc: any, row: any) => {
      const subjectName = row?.exams?.subjects?.name || 'Tanpa Mapel';
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          class_id: row?.exams?.subjects?.class_id || '-',
          totalSubmissions: 0,
          totalScore: 0,
          averageScore: 0,
        };
      }

      acc[subjectName].totalSubmissions += 1;
      acc[subjectName].totalScore += Number(row?.score || 0);
      acc[subjectName].averageScore =
        acc[subjectName].totalScore / acc[subjectName].totalSubmissions;

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a: any, b: any) => Number(b.averageScore) - Number(a.averageScore),
    );
  }

  async getDashboardCharts() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;

    const years = Array.from({ length: 5 }, (_, idx) => startYear + idx);

    const [submissionsRes, usersRes] = await Promise.all([
      this.supabase
        .from('exam_submissions')
        .select('created_at,score')
        .gte('created_at', `${startYear}-01-01T00:00:00`)
        .lte('created_at', `${currentYear}-12-31T23:59:59`),
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

    const roleSummary = {
      siswa: users.filter((user: any) => user.role === 'SISWA').length,
      guru: users.filter((user: any) => user.role === 'GURU').length,
      admin: users.filter((user: any) => user.role === 'ADMIN').length,
    };

    return {
      submissionByYear,
      averageScoreByYear,
      roleSummary,
    };
  }
}
