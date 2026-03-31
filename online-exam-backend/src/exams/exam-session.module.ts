import { Module } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';
import { ExamSessionController } from './exam-session.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ExamSessionService],
  controllers: [ExamSessionController],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
