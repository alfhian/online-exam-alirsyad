import { Module, Global } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExamSubmissionService } from './exam-submission.service';
import { ExamSubmissionController } from './exam-submission.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: SupabaseClient,
      useValue: createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
      ),
    },
    ExamSubmissionService,
  ],
  controllers: [ExamSubmissionController],
  exports: [ExamSubmissionService, SupabaseClient],
})
export class ExamSubmissionModule {}
