import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamModule } from './exams/exam.module';
import { SubjectModule } from './subjects/subject.module';
import { QuestionnaireModule } from './questionnaires/questionnaire.module';
import { getDatabaseConfig } from './config/database.config';
import { ReportsModule } from './reports/reports.module';

const shouldEnableTypeOrm = process.env.ENABLE_TYPEORM === 'true';

@Module({
  imports: [
    SupabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...(shouldEnableTypeOrm
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: getDatabaseConfig,
            inject: [ConfigService],
          }),
        ]
      : []),
    AuthModule,
    UsersModule,
    ExamModule,
    QuestionnaireModule,
    SubjectModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
