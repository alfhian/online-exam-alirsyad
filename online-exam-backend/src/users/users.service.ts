import { Injectable, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(private readonly supabase: SupabaseClient) {}

  // BULK UPLOAD USERS
  async bulkUploadUsers(fileBuffer: Buffer, createdBy: string) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      throw new BadRequestException('File Excel kosong atau format tidak valid.');
    }

    const defaultPassword = process.env.DEFAULT_NEW_USER_PASSWORD || '123456';
    const usersToInsert: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const {
        userid,
        name,
        nisn,
        gender,
        role,
        class_id,
        class_name,
        password,
        description,
      } = row;

      if (!userid || !name || !role) {
        errors.push(`Baris ${i + 2}: NIS/NIK, Nama, dan Role wajib diisi.`);
        continue;
      }

      // Check duplicate in current batch
      if (usersToInsert.some((u) => u.userid === String(userid))) {
        errors.push(`Baris ${i + 2}: Duplikat NIS/NIK ${userid} dalam file.`);
        continue;
      }

      const passwordSource = password || defaultPassword;
      const hashedPassword = bcrypt.hashSync(String(passwordSource), 10);

      usersToInsert.push({
        id: randomUUID(),
        userid: String(userid),
        name: String(name),
        nisn: nisn ? String(nisn) : '',
        gender: gender ? String(gender).toUpperCase() : 'L',
        role: String(role).toUpperCase(),
        class_id: class_id || null,
        class_name: class_name ? String(class_name) : '',
        password: hashedPassword,
        description: description ? String(description) : '',
        created_by: createdBy,
        is_active: true,
      });
    }

    if (errors.length > 0 && usersToInsert.length === 0) {
      throw new BadRequestException(errors.join('\n'));
    }

    // Insert to Supabase in batches of 50
    const batchSize = 50;
    for (let i = 0; i < usersToInsert.length; i += batchSize) {
      const batch = usersToInsert.slice(i, i + batchSize);
      const { error } = await this.supabase.from('users').insert(batch);
      if (error) {
        this.logger.error(`Error inserting batch ${i}: ${error.message}`);
        throw new InternalServerErrorException(`Gagal mengimpor batch ${i}: ${error.message}`);
      }
    }

    return {
      success: true,
      count: usersToInsert.length,
      errors: errors,
      message: `Berhasil mengimpor ${usersToInsert.length} user.${errors.length > 0 ? ` Terjadi ${errors.length} kesalahan.` : ''}`,
    };
  }

  // CREATE USER
  async createUser(user: Partial<User>): Promise<User> {
    Object.keys(user).forEach((key) => {
      if (user[key] === '') user[key] = null;
    });

    if (!user.id) {
      user.id = randomUUID();
    }

    if (user.created_by && !this.uuidRegex.test(String(user.created_by))) {
      user.created_by = user.id;
    }

    if (!user.created_by) {
      user.created_by = user.id;
    }

    // CHECK DUPLICATE NIK/NIS (USERID)
    if (user.userid) {
      const existingUser = await this.getUserByNisNik(user.userid);
      if (existingUser) {
        throw new BadRequestException(`User dengan NIK/NIS ${user.userid} sudah terdaftar!`);
      }
    }

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
      query = query.or(`name.ilike.%${search}%,userid.ilike.%${search}%,role.ilike.%${search}%,class_name.ilike.%${search}%`);
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

  // DELETE USER (SOFT DELETE)
  async deleteUser(id: string, deletedBy: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        deleted_at: new Date(),
        deleted_by: deletedBy,
        is_active: false,
      })
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

  // RESET ALL SISWA PASSWORD (UNIQUE FOR EACH)
  async generateSamePasswordForAllSiswa() {
    // FETCH ALL ACTIVE SISWA
    const { data: siswaList, error: fetchError } = await this.supabase
      .from('users')
      .select('id')
      .eq('role', 'SISWA')
      .is('deleted_at', null);

    if (fetchError) throw new InternalServerErrorException(fetchError.message);
    if (!siswaList || siswaList.length === 0) {
      throw new NotFoundException('No SISWA users found to update');
    }

    // UPDATE EACH SISWA WITH A UNIQUE PASSWORD
    const updates = siswaList.map((siswa) => {
      const rawPassword = `SISWA-${this.generateRandomString(8)}`;
      const hashed = bcrypt.hashSync(rawPassword, 10);
      return this.supabase
        .from('users')
        .update({ password: hashed })
        .eq('id', siswa.id);
    });

    await Promise.all(updates);

    this.logger.log(`Updated ${siswaList.length} SISWA with unique passwords`);

    return {
      updated: siswaList.length,
      message: 'Password seluruh siswa berhasil diperbarui dengan token unik.',
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
      query = query.or(`name.ilike.%${search}%,userid.ilike.%${search}%,role.ilike.%${search}%,class_name.ilike.%${search}%`);
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
