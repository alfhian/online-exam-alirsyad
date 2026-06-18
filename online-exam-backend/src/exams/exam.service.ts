import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Exam } from './entities/exam.entity';
import type { Questionnaire } from '../questionnaires/entities/questionnaire.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(private readonly supabase: SupabaseClient) {}

  private normalizeExamDate(date: string | Date): string {
    const raw = String(date ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00`;
    return raw;
  }

  private normalizeClassIdentifier(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, '');
  }

  private getDatePart(value: unknown): string {
    return String(value ?? '').trim().slice(0, 10);
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
        const parsed = JSON.parse(value);
        return this.hasSubmittedAnswers(parsed);
      } catch {
        return value.trim().length > 0;
      }
    }

    return Boolean(value && typeof value === 'object' && Object.keys(value as object).length > 0);
  }

  private normalizeScoreWeights(
    multipleChoiceWeight?: unknown,
    essayWeight?: unknown,
    fallback = { multiple_choice_weight: 50, essay_weight: 50 },
  ) {
    const mcWeight = Number(multipleChoiceWeight);
    const esWeight = Number(essayWeight);

    if (
      Number.isInteger(mcWeight) &&
      Number.isInteger(esWeight) &&
      mcWeight >= 0 &&
      esWeight >= 0 &&
      mcWeight <= 100 &&
      esWeight <= 100 &&
      mcWeight + esWeight === 100
    ) {
      return {
        multiple_choice_weight: mcWeight,
        essay_weight: esWeight,
      };
    }

    return fallback;
  }

  private isMissingExamWeightColumn(error: any): boolean {
    const message = String(`${error?.message || ''} ${error?.details || ''}`).toLowerCase();
    return (
      (message.includes('essay_weight') || message.includes('multiple_choice_weight')) &&
      (message.includes('schema cache') || message.includes('could not find'))
    );
  }

  private omitExamWeightColumns<T extends Record<string, any>>(payload: T) {
    const { multiple_choice_weight, essay_weight, ...rest } = payload;
    return rest;
  }

  private sortExamRows(exams: any[], sort: string, order: 'asc' | 'desc'): any[] {
    const direction = order === 'asc' ? 1 : -1;

    return exams.sort((left, right) => {
      const leftValue = left?.[sort];
      const rightValue = right?.[sort];

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

  private getRole(user?: any): string {
    return String(user?.role || '').toUpperCase();
  }

  private async getExamWithSubject(examId: string) {
    const { data, error } = await this.supabase
      .from('exams')
      .select('*, subject:subjects(id,name,class_id,teacher_id)')
      .eq('id', examId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Exam ${examId} not found`);
    return data;
  }

  async assertCanAccessExam(examId: string, user?: any) {
    const role = this.getRole(user);
    const exam = await this.getExamWithSubject(examId);
    const subject = Array.isArray(exam.subject) ? exam.subject[0] : exam.subject;

    if (role === 'ADMIN') return exam;

    if (role === 'GURU') {
      if (subject?.teacher_id === user?.sub) return exam;
      throw new ForbiddenException('Anda tidak memiliki akses ke ujian ini');
    }

    if (role === 'SISWA') {
      const { data: student, error } = await this.supabase
        .from('users')
        .select('class_id, class_name')
        .eq('id', user?.sub)
        .is('deleted_at', null)
        .single();

      if (error || !student) throw new ForbiddenException('Data siswa tidak ditemukan');

      const studentClasses = [student.class_id, student.class_name]
        .filter(Boolean)
        .map((value) => this.normalizeClassIdentifier(value));
      const subjectClass = this.normalizeClassIdentifier(subject?.class_id);

      if (studentClasses.includes(subjectClass)) return exam;
      throw new ForbiddenException('Ujian ini tidak tersedia untuk kelas Anda');
    }

    throw new ForbiddenException('Role tidak memiliki akses ke ujian ini');
  }

  async create(dto: CreateExamDto, user?: any): Promise<Exam> {
    // Supabase row type untuk tabel exams
    type ExamRow = {
      id?: string;
      date: string;           // Supabase pakai string ISO untuk timestamp
      title: string;
      subject_id: string;
      type: string;
      duration: number;
      multiple_choice_weight: number;
      essay_weight: number;
      notes?: string | null;
      created_by: string;
      deleted_at?: string | null;
      deleted_by?: string | null;
    };

    if (this.getRole(user) === 'GURU') {
      const { data: subject, error: subjectError } = await this.supabase
        .from('subjects')
        .select('id, teacher_id')
        .eq('id', dto.subject_id)
        .is('deleted_at', null)
        .single();

      if (subjectError || !subject) throw new NotFoundException('Mata pelajaran tidak ditemukan');
      if (subject.teacher_id !== user?.sub) {
        throw new ForbiddenException('Guru hanya dapat membuat ujian untuk mata pelajaran yang diampu');
      }
    }

    const payload = {
      ...dto,
      date: this.normalizeExamDate(dto.date),
      ...this.normalizeScoreWeights(dto.multiple_choice_weight, dto.essay_weight),
      notes: dto.notes ?? null,
    } as ExamRow;

    const { data, error } = await this.supabase
    .from('exams') // string literal nama tabel
    .insert([payload] as ExamRow[]) // paksa ke ExamRow[]
    .select('*')
    .single();

  if (error) {
    if (this.isMissingExamWeightColumn(error)) {
      console.error(
        'Kolom bobot nilai exam belum tersedia di schema cache. Jalankan migration AddExamScoreWeights1768100000000 di VPS.',
      );

      const { data: fallbackData, error: fallbackError } = await this.supabase
        .from('exams')
        .insert([this.omitExamWeightColumns(payload)])
        .select('*')
        .single();

      if (fallbackError) throw new InternalServerErrorException(fallbackError.message);
      return fallbackData;
    }

    throw new InternalServerErrorException(error.message);
  }
  return data;
}


  async getDataWithPagination(
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
    user?: any,
  ): Promise<{ data: Exam[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('exams')
      .select('*, subject:subjects(id,name,class_id,teacher_id)', { count: 'exact' })
      .is('deleted_at', null);

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%`);
    }

    if (String(user?.role || '').toUpperCase() === 'GURU') {
      const { data: subjects, error: subjectError } = await this.supabase
        .from('subjects')
        .select('id')
        .eq('teacher_id', user.sub)
        .is('deleted_at', null);

      if (subjectError) throw new InternalServerErrorException(subjectError.message);

      const subjectIds = (subjects || []).map((subject) => subject.id);
      if (subjectIds.length === 0) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }

      query = query.in('subject_id', subjectIds);
    }

    const { data, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      data: data || [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async findById(id: string, user?: any): Promise<Exam | null> {
  // helper untuk map row Supabase ke entity Exam
    function mapExamRow(row: any): Exam {
      return {
        ...row,
        date: row.date,              // tetap string sesuai entity
        notes: row.notes ?? null,    // nullable
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
        deleted_at: row.deleted_at ?? null,
        deleted_by: row.deleted_by ?? null,
        updated_by: row.updated_by ?? null,
      };
    }

    return mapExamRow(await this.assertCanAccessExam(id, user));
  }

  async update(id: string, dto: UpdateExamDto, user?: any): Promise<Exam> {
    // Ambil dulu row lama
    const oldData = await this.assertCanAccessExam(id, user);

    if (this.getRole(user) === 'GURU' && dto.subject_id && dto.subject_id !== oldData.subject_id) {
      const { data: subject, error: subjectError } = await this.supabase
        .from('subjects')
        .select('id, teacher_id')
        .eq('id', dto.subject_id)
        .is('deleted_at', null)
        .single();

      if (subjectError || !subject) throw new NotFoundException('Mata pelajaran tidak ditemukan');
      if (subject.teacher_id !== user?.sub) {
        throw new ForbiddenException('Guru hanya dapat memilih mata pelajaran yang diampu');
      }
    }

    const scoreWeights = this.normalizeScoreWeights(
      dto.multiple_choice_weight,
      dto.essay_weight,
      {
        multiple_choice_weight: oldData.multiple_choice_weight ?? 50,
        essay_weight: oldData.essay_weight ?? 50,
      },
    );

    const updatedRow = {
      title: dto.title ?? oldData.title,
      subject_id: dto.subject_id ?? oldData.subject_id,
      type: dto.type ?? oldData.type,
      duration: dto.duration ?? oldData.duration,
      ...scoreWeights,
      notes: dto.notes ?? oldData.notes ?? null,
      date: dto.date ? this.normalizeExamDate(dto.date) : oldData.date,
      updated_by: (dto as any).updated_by ?? oldData.updated_by ?? null,
      updated_at: new Date(),
    };

    // Update di Supabase
    const { data: newData, error: updateError } = await this.supabase
      .from('exams')
      .update(updatedRow)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !newData) {
      if (updateError && this.isMissingExamWeightColumn(updateError)) {
        console.error(
          'Kolom bobot nilai exam belum tersedia di schema cache. Jalankan migration AddExamScoreWeights1768100000000 di VPS.',
        );

        const { data: fallbackData, error: fallbackUpdateError } = await this.supabase
          .from('exams')
          .update(this.omitExamWeightColumns(updatedRow))
          .eq('id', id)
          .select()
          .single();

        if (fallbackUpdateError || !fallbackData) {
          throw new InternalServerErrorException(fallbackUpdateError?.message || 'Failed to update exam');
        }

        return mapExamRow(fallbackData);
      }

      throw new InternalServerErrorException(updateError?.message || 'Failed to update exam');
    }

    // Mapping ke entity Exam
    function mapExamRow(row: any): Exam {
      return {
        ...row,
        notes: row.notes ?? null,
        updated_at: row.updated_at ?? null,
        updated_by: row.updated_by ?? null,
        deleted_at: row.deleted_at ?? null,
        deleted_by: row.deleted_by ?? null,
      };
    }

    return mapExamRow(newData);
  }


  async softDelete(id: string, deletedBy: string, user?: any): Promise<Exam> {
    // Ambil dulu row lama
    await this.assertCanAccessExam(id, user);

    const updatedRow = {
      deleted_at: new Date(),
      deleted_by: deletedBy,
    };

    const { data: newData, error: updateError } = await this.supabase
      .from('exams')
      .update(updatedRow)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !newData) {
      throw new InternalServerErrorException(updateError?.message || 'Failed to soft delete exam');
    }

    // Mapping ke entity Exam
    function mapExamRow(row: any): Exam {
      return {
        ...row,
        notes: row.notes ?? null,
        updated_at: row.updated_at ?? null,
        updated_by: row.updated_by ?? null,
        deleted_at: row.deleted_at ?? null,
        deleted_by: row.deleted_by ?? null,
      };
    }

    return mapExamRow(newData);
  }


  async getExamQuestions(examId: string, user?: any): Promise<{ examId: string; questions: Questionnaire[] }> {
    await this.assertCanAccessExam(examId, user);

    const { data: rawQuestions, error } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('exam_id', examId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const questions: Questionnaire[] = (rawQuestions || []).map(q => ({
      ...q,
      notes: q.notes ?? null,
      created_at: q.created_at,
      updated_at: q.updated_at ?? null,
      deleted_at: q.deleted_at ?? null,
    }));

    return { examId, questions };
  }

  async getTodayExamsWithPagination(
    studentId: string,
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
    debug = false,
  ): Promise<{ data: Exam[]; meta: { total: number; page: number; limit: number; totalPages: number; debug?: any } }> {
    const offset = (page - 1) * limit;
    
    // Get "Today" string in YYYY-MM-DD format for Asia/Jakarta (GMT+7)
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    // 1. Ambil data student (untuk tahu kelasnya)
    const { data: student, error: stuError } = await this.supabase
      .from('users')
      .select('id, userid, name, role, class_id, class_name, deleted_at')
      .eq('id', studentId)
      .is('deleted_at', null)
      .single();

    if (stuError || !student) throw new NotFoundException('Student not found');

    const rawClassIdentifiers = [student.class_id, student.class_name].filter(Boolean);
    const classIdentifiers = new Set(
      rawClassIdentifiers.map((value) => this.normalizeClassIdentifier(value)).filter(Boolean),
    );

    if (classIdentifiers.size === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          ...(debug ? {
            debug: {
              reason: 'student_class_empty',
              today: todayStr,
              authStudentId: studentId,
              student,
            },
          } : {}),
        },
      };
    }

    // 2. Ambil subject, lalu cocokkan kelas secara ternormalisasi agar beda case/spasi tidak membuat kosong.
    const { data: subjects, error: subjectError } = await this.supabase
      .from('subjects')
      .select('id, name, class_id')
      .is('deleted_at', null);

    if (subjectError) throw new InternalServerErrorException(subjectError.message);

    const validSubjects = (subjects || []).filter((subject) =>
      classIdentifiers.has(this.normalizeClassIdentifier(subject.class_id)),
    );

    const subjectIds = validSubjects.map(s => s.id);
    if (subjectIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          ...(debug ? {
            debug: {
              reason: 'no_matching_subjects_for_student_class',
              today: todayStr,
              authStudentId: studentId,
              student,
              normalizedClassIdentifiers: Array.from(classIdentifiers),
              subjectsRead: subjects?.length ?? 0,
              sampleSubjects: (subjects || []).slice(0, 10),
            },
          } : {}),
        },
      };
    }

    const subjectById = new Map(validSubjects.map((subject) => [subject.id, subject]));

    // 3. Ambil kandidat exams dari subject yang sesuai. Tanggal difilter di aplikasi
    // supaya aman untuk format Supabase "YYYY-MM-DD 00:00:00" maupun ISO string.
    const { data: candidateExams, error } = await this.supabase
      .from('exams')
      .select('*')
      .is('deleted_at', null)
      .in('subject_id', subjectIds);

    if (error) throw new InternalServerErrorException(error.message);

    const searchTerm = search.trim().toLowerCase();
    const todayExams = (candidateExams || []).filter((exam) => {
      const isToday = this.getDatePart(exam.date) === todayStr;
      if (!isToday) return false;
      if (!searchTerm) return true;

      return [exam.title, exam.type]
        .some((value) => String(value ?? '').toLowerCase().includes(searchTerm));
    });

    const sortedExams = this.sortExamRows(todayExams, sort, order);
    const exams = sortedExams.slice(offset, offset + limit);
    const total = sortedExams.length;

    // 4. Cek mana saja yang sudah di-submit oleh student ini
    const examIdsFound = (exams || []).map(e => e.id);
    let submittedExamIds = new Set<string>();

    if (examIdsFound.length > 0) {
      const { data: submissions, error: submissionsError } = await this.supabase
        .from('exam_submissions')
        .select('exam_id, answers')
        .eq('student_id', studentId)
        .in('exam_id', examIdsFound);

      if (submissionsError) throw new InternalServerErrorException(submissionsError.message);
      submittedExamIds = new Set(
        (submissions || [])
          .filter((submission) => this.hasSubmittedAnswers(submission.answers))
          .map(s => s.exam_id),
      );
    }

    const finalData = (exams || []).map(e => ({
      ...e,
      subject: subjectById.get(e.subject_id) || null,
      is_submitted: submittedExamIds.has(e.id),
    }));

    return {
      data: finalData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...(debug ? {
          debug: {
            reason: total > 0 ? 'ok' : 'no_exam_with_today_date',
            today: todayStr,
            authStudentId: studentId,
            student,
            normalizedClassIdentifiers: Array.from(classIdentifiers),
            matchingSubjects: validSubjects,
            candidateExamCount: candidateExams?.length ?? 0,
            candidateExams: (candidateExams || []).map((exam) => ({
              id: exam.id,
              title: exam.title,
              date: exam.date,
              datePart: this.getDatePart(exam.date),
              subject_id: exam.subject_id,
            })),
          },
        } : {}),
      },
    };
  }
}
