import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    try {
      // CHECK DUPLICATE
      const { data: existing } = await this.supabase
        .from('subjects')
        .select('id')
        .eq('name', dto.name)
        .eq('class_id', dto.class_id)
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new InternalServerErrorException(`Mata pelajaran ${dto.name} untuk kelas tersebut sudah ada!`);
      }

      const { data, error } = await this.supabase
        .from('subjects')
        .insert([{ ...dto }])
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return data!;
    } catch (err: any) {
      if (err.status === 404) {
        // This is fine, means no duplicate found by single()
      } else {
        throw new InternalServerErrorException(err.message);
      }

      // Re-try insert after 404 (no duplicate)
      const { data, error } = await this.supabase
        .from('subjects')
        .insert([{ ...dto }])
        .select()
        .single();
      if (error) throw new InternalServerErrorException(error.message);
      return data!;
    }
  }

  async getDataWithPagination(
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number
  ): Promise<{ data: Subject[]; meta: any }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let query = this.supabase
        .from('subjects')
        .select('*, teacher:teacher_id(name)', { count: 'exact' })
        .is('deleted_at', null);

      if (search?.trim()) {
        const keyword = search.trim().toLowerCase();
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
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
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getDataOnly(): Promise<{ data: Subject[]; meta: any }> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .select('*, teacher:teacher_id(name)')
        .is('deleted_at', null)
        .order('class_id', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw new InternalServerErrorException(error.message);

      return {
        data: data || [],
        meta: { total: data?.length || 0 },
      };
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findById(id: string): Promise<Subject> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .select('*')
        .is('deleted_at', null)
        .eq('id', id)
        .single();

      if (error || !data) throw new NotFoundException(`Subject ${id} not found`);

      return data;
    } catch (err: any) {
      throw new NotFoundException(err.message);
    }
  }

  async update(id: string, dto: UpdateSubjectDto & { updated_by?: string }): Promise<Subject> {
    try {
      // CHECK DUPLICATE
      if (dto.name && dto.class_id) {
        const { data: existing } = await this.supabase
          .from('subjects')
          .select('id')
          .eq('name', dto.name)
          .eq('class_id', dto.class_id)
          .is('deleted_at', null)
          .neq('id', id)
          .single();

        if (existing) {
          throw new InternalServerErrorException(`Mata pelajaran ${dto.name} untuk kelas tersebut sudah ada!`);
        }
      }

      const { data, error } = await this.supabase
        .from('subjects')
        .update({ ...dto, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw new NotFoundException(`Subject ${id} not found`);
      return data;
    } catch (err: any) {
      if (err.status === 404) {
        // This is fine, means no duplicate found
      } else {
        throw new InternalServerErrorException(err.message);
      }

      // Re-try update after 404 (no duplicate)
      const { data, error } = await this.supabase
        .from('subjects')
        .update({ ...dto, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) throw new NotFoundException(`Subject ${id} not found`);
      return data;
    }
  }

  async softDelete(id: string, deletedBy: string): Promise<Subject> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .update({ deleted_at: new Date(), deleted_by: deletedBy })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw new NotFoundException(`Subject ${id} not found`);
      return data;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
