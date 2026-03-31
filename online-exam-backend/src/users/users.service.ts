import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabase: SupabaseClient) {}

  // CREATE USER
  async createUser(user: Partial<User>): Promise<User> {
    delete user.id;

    Object.keys(user).forEach((key) => {
      if (user[key] === '') user[key] = null;
    });

    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // PAGINATION
  async getUsersWithPagination(
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
  ) {
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (search.trim()) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // ALL USERS
  async getAllUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // USER BY NIS/NIK
  async getUserByNisNik(userid: string | number) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('userid', String(userid))
      .is('deleted_at', null)
      .single();

    console.log(error);
    

    if (error) return null;
    return data;
  }

  // USER BY ID
  async getUserById(id: string | number) {
    const { data } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', String(id))
      .is('deleted_at', null)
      .single();

    return data || null;
  }

  // UPDATE USER ACTIVE
  async updateUserStatus(
    id: string,
    isActive: boolean,
    updatedAt: Date,
    updatedBy: string,
  ) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        is_active: isActive,
        updated_at: updatedAt,
        updated_by: updatedBy,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // UPDATE USER
  async updateUser(id: string, update: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // RANDOM STRING
  private generateRandomString(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // RESET ALL SISWA PASSWORD
  async generateSamePasswordForAllSiswa() {
    const rawPassword = `SISWA-${this.generateRandomString(8)}`;
    const hashed = bcrypt.hashSync(rawPassword, 10);

    // UPDATE PASSWORDS
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ password: hashed })
      .eq('role', 'SISWA')
      .is('deleted_at', null);

    if (updateError) throw new InternalServerErrorException(updateError.message);

    // COUNT SISWA
    const { count, error: countError } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'SISWA')
      .is('deleted_at', null);

    if (countError) throw new InternalServerErrorException(countError.message);
    if (!count) throw new NotFoundException('No SISWA users found to update');

    this.logger.log(`Updated ${count} SISWA passwords to SAME new password`);

    return {
      updated: count,
      password: rawPassword,
    };
  }

  // USERS BY ROLE
  async getUsersByRole(
    role: string,
    search: string,
    sort: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
    examId?: string,
  ) {
    const offset = (page - 1) * limit;

    let classId: string | null = null;

    // FETCH CLASS ID FROM EXAM (FIXED)
    if (examId) {
      const { data: exam } = await this.supabase
        .from('exams')
        .select(
          `
          id,
          subjects (
            class_id
          )
        `,
        )
        .eq('id', examId)
        .single();

      classId = exam?.subjects?.[0]?.class_id ?? null;

    }

    let query = this.supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', role)
      .is('deleted_at', null);

    if (search.trim()) {
      query = query.ilike('name', `%${search}%`);
    }

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      data,
      total: count,
      page,
      limit,
    };
  }
}
