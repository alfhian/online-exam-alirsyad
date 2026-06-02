import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ClassesService {
  constructor(private readonly supabase: SupabaseClient) {}

  private normalizeCode(value: string): string {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  async getAll(search = '', page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('classes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('grade', { ascending: true })
      .order('name', { ascending: true })
      .range(from, to);

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

  async getOptions() {
    const { data, error } = await this.supabase
      .from('classes')
      .select('*')
      .is('deleted_at', null)
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { data: data || [], meta: { total: data?.length || 0 } };
  }

  async create(body: any, createdBy: string) {
    const id = this.normalizeCode(body.id || body.code || body.name);
    const name = String(body.name || '').trim();
    const grade = Number(body.grade || String(id).match(/\d+/)?.[0] || 0);

    if (!id || !name) throw new BadRequestException('Kode dan nama kelas wajib diisi');

    const { data: existing, error: checkError } = await this.supabase
      .from('classes')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (checkError) throw new InternalServerErrorException(checkError.message);
    if (existing) throw new BadRequestException(`Kelas ${id} sudah ada`);

    const { data, error } = await this.supabase
      .from('classes')
      .insert({ id, name, grade, created_by: createdBy })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, body: any, updatedBy: string) {
    const payload = {
      ...(body.name ? { name: String(body.name).trim() } : {}),
      ...(body.grade !== undefined ? { grade: Number(body.grade) } : {}),
      updated_at: new Date(),
      updated_by: updatedBy,
    };

    const { data, error } = await this.supabase
      .from('classes')
      .update(payload)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Kelas ${id} tidak ditemukan`);
    return data;
  }

  async softDelete(id: string, deletedBy: string) {
    const { data: usedSubject, error: subjectError } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('class_id', id)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (subjectError) throw new InternalServerErrorException(subjectError.message);
    if (usedSubject) {
      throw new BadRequestException('Kelas masih dipakai oleh mata pelajaran aktif');
    }

    const { data, error } = await this.supabase
      .from('classes')
      .update({ deleted_at: new Date(), deleted_by: deletedBy })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Kelas ${id} tidak ditemukan`);
    return data;
  }
}
