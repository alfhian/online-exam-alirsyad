import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    // CHECK DUPLICATE
    const { data: existing, error: checkError } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('name', dto.name)
      .eq('class_id', dto.class_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (checkError) throw new InternalServerErrorException(checkError.message);
    if (existing) {
      throw new BadRequestException(`Mata pelajaran ${dto.name} untuk kelas tersebut sudah ada!`);
    }

    const { data, error } = await this.supabase
      .from('subjects')
      .insert([{ ...dto }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data!;
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
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,class_id.ilike.%${keyword}%`);
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
    // Get existing to merge and check
    const { data: current, error: fetchError } = await this.supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) throw new NotFoundException(`Subject ${id} not found`);

    const newName = dto.name || current.name;
    const newClassId = dto.class_id || current.class_id;

    // CHECK DUPLICATE if name or class_id changed
    if (dto.name || dto.class_id) {
      const { data: existing, error: checkError } = await this.supabase
        .from('subjects')
        .select('id')
        .eq('name', newName)
        .eq('class_id', newClassId)
        .is('deleted_at', null)
        .neq('id', id)
        .maybeSingle();

      if (checkError) throw new InternalServerErrorException(checkError.message);
      if (existing) {
        throw new BadRequestException(`Mata pelajaran ${newName} untuk kelas tersebut sudah ada!`);
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
