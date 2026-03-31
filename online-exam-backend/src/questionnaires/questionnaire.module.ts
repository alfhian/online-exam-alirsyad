import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [QuestionnaireService],
  exports: [QuestionnaireService],
  controllers: [QuestionnaireController],
})
export class QuestionnaireModule {}
