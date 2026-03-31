import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [SubjectService],
  exports: [SubjectService],
  controllers: [SubjectController],
})
export class SubjectModule {}
