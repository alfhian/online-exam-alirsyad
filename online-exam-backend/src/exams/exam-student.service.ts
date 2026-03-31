import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ExamStudentsService {
  constructor(private readonly supabase: SupabaseClient) {}

  /* -------------------------------------------------------
   * GET EXAM STUDENTS
   * -----------------------------------------------------*/
  async getExamStudents(examId: string) {
    if (!examId) throw new Error('examId wajib diisi');

    const { data, error } = await this.supabase
      .from('exam_students')
      .select(`
        *,
        student:users (*)
      `)
      .eq('exam_id', examId)
      .is('deleted_at', null);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /* -------------------------------------------------------
   * ASSIGN STUDENTS (INSERT + RESTORE + SOFT-DELETE)
   * -----------------------------------------------------*/
  async assignStudents(examId: string, studentIds: string[], createdBy: string) {
    if (!examId) throw new Error('examId wajib diisi');
    if (!Array.isArray(studentIds)) studentIds = [];

    const uniqStudentIds = Array.from(new Set(studentIds.map((s) => String(s))));

    /* ======================================================
     * 1. Get ALL existing rows (INCLUDING deleted)
     * ====================================================*/
    const { data: existingAll, error: getErr } = await this.supabase
      .from('exam_students')
      .select('*')
      .eq('exam_id', examId); // supabase already returns soft-deleted

    if (getErr) throw new InternalServerErrorException(getErr.message);

    const existingByStudent = new Map(existingAll.map((e) => [String(e.student_id), e]));
    const existingActive = existingAll.filter((e) => !e.deleted_at);

    /* ======================================================
     * 2. INSERT NEW STUDENTS
     * ====================================================*/
    const toInsert = uniqStudentIds.filter((id) => !existingByStudent.has(id));

    if (toInsert.length > 0) {
      const insertPayload = toInsert.map((sid) => ({
        exam_id: examId,
        student_id: sid,
        created_by: createdBy,
      }));

      const { error: insertErr } = await this.supabase
        .from('exam_students')
        .insert(insertPayload);

      if (insertErr) throw new InternalServerErrorException(insertErr.message);
    }

    /* ======================================================
     * 3. RESTORE SOFT-DELETED
     * ====================================================*/
    const toRestore = existingAll.filter(
      (e) => e.deleted_at && uniqStudentIds.includes(String(e.student_id)),
    );

    for (const row of toRestore) {
      const { error: restoreErr } = await this.supabase
        .from('exam_students')
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', row.id);

      if (restoreErr) throw new InternalServerErrorException(restoreErr.message);
    }

    /* ======================================================
     * 4. SOFT DELETE REMOVED STUDENTS
     * ====================================================*/
    const toSoftDelete = existingActive.filter(
      (e) => !uniqStudentIds.includes(String(e.student_id)),
    );

    for (const row of toSoftDelete) {
      const { error: delErr } = await this.supabase
        .from('exam_students')
        .update({
          deleted_at: new Date(),
          deleted_by: createdBy,
        })
        .eq('id', row.id);

      if (delErr) throw new InternalServerErrorException(delErr.message);
    }

    /* ======================================================
     * 5. RETURN FRESH ACTIVE LIST
     * ====================================================*/
    const { data: finalList, error: listErr } = await this.supabase
      .from('exam_students')
      .select(`
        *,
        student:users (*)
      `)
      .eq('exam_id', examId)
      .is('deleted_at', null);

    if (listErr) throw new InternalServerErrorException(listErr.message);

    return finalList;
  }
}
