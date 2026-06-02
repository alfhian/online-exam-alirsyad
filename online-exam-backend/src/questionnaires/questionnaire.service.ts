import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Questionnaire } from './entities/questionnaire.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly supabase: SupabaseClient) {}

  private async assertCanManageExam(examId: string, user?: any) {
    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return;

    if (role === 'GURU') {
      const { data: exam, error } = await this.supabase
        .from('exams')
        .select('id, subject:subjects(teacher_id)')
        .eq('id', examId)
        .is('deleted_at', null)
        .single();

      if (error || !exam) throw new NotFoundException('Exam not found');

      const subject = Array.isArray(exam.subject) ? exam.subject[0] : exam.subject;
      if (subject?.teacher_id === user?.sub) return;
    }

    throw new ForbiddenException('Anda tidak memiliki akses ke soal ujian ini');
  }

  private async assertCanManageQuestionnaire(questionnaireId: string, user?: any) {
    const questionnaire = await this.findById(questionnaireId);
    await this.assertCanManageExam(questionnaire.exam_id, user);
    return questionnaire;
  }

  async create(dto: CreateQuestionnaireDto & { created_by: string }, user?: any): Promise<Questionnaire> {
    if (!dto.exam_id) throw new NotFoundException('Exam not found');
    await this.assertCanManageExam(dto.exam_id, user);

    const { data, error } = await this.supabase
      .from('questionnaires')
      .insert({
        ...dto,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data!;
  }

  async getDataWithPagination(
    examId: string,
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
    user?: any,
  ): Promise<{ data: Questionnaire[]; meta: any }> {
    await this.assertCanManageExam(examId, user);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('questionnaires')
      .select('*', { count: 'exact' })
      .eq('exam_id', examId)
      .is('deleted_at', null);

    if (search) {
      query = query.or(`question.ilike.%${search}%,type.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: order === 'asc' }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findById(id: string, user?: any): Promise<Questionnaire> {
    const { data, error } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Questionnaire ${id} not found`);
    if (user) await this.assertCanManageExam(data.exam_id, user);
    return data;
  }

  async update(
    id: string,
    dto: UpdateQuestionnaireDto & { updated_by?: string },
    user?: any,
  ): Promise<Questionnaire> {
    await this.assertCanManageQuestionnaire(id, user);

    const { data, error } = await this.supabase
      .from('questionnaires')
      .update({
        ...dto,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data!;
  }

  async softDelete(id: string, deletedBy: string, user?: any): Promise<Questionnaire> {
    await this.assertCanManageQuestionnaire(id, user);

    const { data, error } = await this.supabase
      .from('questionnaires')
      .update({
        deleted_at: new Date(),
        deleted_by: deletedBy,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data!;
  }
}
