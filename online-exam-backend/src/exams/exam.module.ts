import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamStudentsService } from './exam-student.service';
import { ExamSubmissionService } from './exam-submission.service';
import { ExamSessionService } from './exam-session.service';
import { TeacherExamsService } from './teacher-exam.service';
import { ExamController } from './exam.controller';
import { ExamSubmissionController } from './exam-submission.controller';
import { ExamSessionController } from './exam-session.controller';
import { TeacherExamsController } from './teacher-exam.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [
    ExamService,
    ExamStudentsService,
    ExamSubmissionService,
    ExamSessionService,
    TeacherExamsService,
  ],
  exports: [
    ExamService,
    ExamStudentsService,
    ExamSubmissionService,
    ExamSessionService,
    TeacherExamsService,
  ],
  controllers: [
    ExamController,
    ExamSubmissionController,
    ExamSessionController,
    TeacherExamsController,
  ],
})
export class ExamModule {}
