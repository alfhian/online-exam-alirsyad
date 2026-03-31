import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Questionnaire } from './entities/questionnaire.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(dto: CreateQuestionnaireDto & { created_by: string }): Promise<Questionnaire> {
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
  ): Promise<{ data: Questionnaire[]; meta: any }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('questionnaires')
      .select('*', { count: 'exact' })
      .eq('exam_id', examId)
      .is('deleted_at', null);

    if (search) {
      query = query.ilike('question', `%${search}%`).or(`type.ilike.%${search}%`);
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

  async findById(id: string): Promise<Questionnaire> {
    const { data, error } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Questionnaire ${id} not found`);
    return data;
  }

  async update(
    id: string,
    dto: UpdateQuestionnaireDto & { updated_by?: string },
  ): Promise<Questionnaire> {
    const { data: existing, error: findError } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (findError || !existing) throw new NotFoundException(`Questionnaire ${id} not found`);

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

  async softDelete(id: string, deletedBy: string): Promise<Questionnaire> {
    const { data: existing, error: findError } = await this.supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (findError || !existing) throw new NotFoundException(`Questionnaire ${id} not found`);

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
