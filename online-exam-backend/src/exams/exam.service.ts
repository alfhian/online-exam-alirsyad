import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Exam } from './entities/exam.entity';
import type { Questionnaire } from '../questionnaires/entities/questionnaire.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(dto: CreateExamDto): Promise<Exam> {
    // Supabase row type untuk tabel exams
    type ExamRow = {
      id?: string;
      date: string;           // Supabase pakai string ISO untuk timestamp
      title: string;
      subject_id: string;
      type: string;
      duration: number;
      notes?: string | null;
      created_by: string;
      deleted_at?: string | null;
      deleted_by?: string | null;
    };

    const { data, error } = await this.supabase
    .from('exams') // string literal nama tabel
    .insert([{
      ...dto,
      date: new Date(dto.date).toISOString(), // convert ke string
      notes: dto.notes ?? null,
    }] as ExamRow[]) // paksa ke ExamRow[]
    .select('*')
    .single();

  if (error) throw new InternalServerErrorException(error.message);
  return data;
}


  async getDataWithPagination(
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number
  ): Promise<{ data: Exam[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('exams')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (search.trim()) query = query.ilike('title', `%${search}%`);

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

  async findById(id: string): Promise<Exam | null> {
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

    const { data, error } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapExamRow(data);
  }

  async update(id: string, dto: UpdateExamDto): Promise<Exam> {
    // Ambil dulu row lama
    const { data: oldData, error: fetchError } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !oldData) {
      throw new NotFoundException(`Exam ${id} not found`);
    }

    // Merge dto dengan data lama
    const updatedRow = {
      ...oldData,
      ...dto,
      date: dto.date ? dto.date : oldData.date, // tetap string
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


  async softDelete(id: string, deletedBy: string): Promise<Exam> {
    // Ambil dulu row lama
    const { data: oldData, error: fetchError } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !oldData) {
      throw new NotFoundException(`Exam ${id} not found`);
    }

    const updatedRow = {
      ...oldData,
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


  async getExamQuestions(examId: string): Promise<{ examId: string; questions: Questionnaire[] }> {
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
    limit: number
  ): Promise<{ data: Exam[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const offset = (page - 1) * limit;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 1. Ambil data student (untuk tahu kelasnya)
    const { data: student, error: stuError } = await this.supabase
      .from('users')
      .select('class_name')
      .eq('id', studentId)
      .single();

    if (stuError || !student) throw new NotFoundException('Student not found');

    // 2. Ambil ID subject yang sesuai dengan kelas student
    const { data: validSubjects } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('class_id', student.class_name)
      .is('deleted_at', null);

    const subjectIds = (validSubjects || []).map(s => s.id);
    if (subjectIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    // 3. Query exams yang filter by subjectIds dan date hari ini
    let query = this.supabase
      .from('exams')
      .select('*, subject:subjects(name, class_id)', { count: 'exact' })
      .is('deleted_at', null)
      .in('subject_id', subjectIds)
      .gte('date', startOfDay)
      .lte('date', endOfDay);

    if (search.trim()) query = query.ilike('title', `%${search}%`);

    const { data: exams, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    // 4. Cek mana saja yang sudah di-submit oleh student ini
    const examIdsFound = (exams || []).map(e => e.id);
    const { data: submissions } = await this.supabase
      .from('exam_submissions')
      .select('exam_id')
      .eq('student_id', studentId)
      .in('exam_id', examIdsFound);

    const submittedExamIds = new Set((submissions || []).map(s => s.exam_id));

    const finalData = (exams || []).map(e => ({
      ...e,
      is_submitted: submittedExamIds.has(e.id),
    }));

    return {
      data: finalData,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }
}
