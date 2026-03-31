import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(dto: CreateQuestionDto): Promise<Question> {
    try {
      const { data, error } = await this.supabase
        .from('questions')
        .insert({ ...dto, type: dto.type, created_at: new Date() })
        .select()
        .single();

      if (error || !data) throw new InternalServerErrorException(error?.message || 'Failed to create question');

      return data;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findAll(examId?: string): Promise<Question[]> {
    try {
      let query = this.supabase
        .from('questions')
        .select('*')
        .is('deleted_at', null);

      if (examId) query = query.eq('exam_id', examId);

      const { data, error } = await query;

      if (error) throw new InternalServerErrorException(error.message);

      return data || [];
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findById(id: string): Promise<Question | null> {
    try {
      const { data, error } = await this.supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) return null;
      return data;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<Question> {
    try {
      const { data, error } = await this.supabase
        .from('questions')
        .update({ ...dto, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw new NotFoundException(`Question ${id} not found`);

      return data;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async softDelete(id: string, deletedBy: string): Promise<Question> {
    try {
      const { data, error } = await this.supabase
        .from('questions')
        .update({ deleted_at: new Date(), deleted_by: deletedBy })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw new NotFoundException(`Question ${id} not found`);

      return data;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
