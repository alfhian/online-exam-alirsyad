// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // ⚠️ wajib export biar bisa di-import module lain
})
export class UsersModule {}
