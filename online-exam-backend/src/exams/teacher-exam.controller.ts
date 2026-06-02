import {
  Controller,
  Get,
  Query,
  InternalServerErrorException,
  HttpException,
  UseGuards,
  Param,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeacherExamsService } from './teacher-exam.service';

@Controller('teacher-exams')
@UseGuards(AuthGuard('jwt'))
export class TeacherExamsController {
  constructor(private readonly teacherExamService: TeacherExamsService) {}

  /**
   * 🔹 GET /teacher-exams
   * Daftar ujian yang sudah pernah dikerjakan siswa + unscored_count
   */
  @Get()
  async getSubmittedExams(
    @Query('search') search = '',
    @Query('sort') sort = 'created_at',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: any,
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    try {
      return await this.teacherExamService.getSubmittedExamsByTeacher(
        search,
        sort,
        order,
        pageNumber,
        limitNumber,
        req.user,
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 GET /teacher-exams/submission/:submissionId
   * Detail jawaban ujian siswa
   */
  @Get('submission/:submissionId')
  async getSubmissionDetail(@Param('submissionId') submissionId: string, @Req() req: any) {
    try {
      return await this.teacherExamService.getSubmissionDetail(submissionId, req.user);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 PATCH /teacher-exams/submission/:submissionId/scoring
   * Simpan hasil penilaian guru
   */
  @Patch('submission/:submissionId/scoring')
  async updateSubmissionScore(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      scores: { question_id: string; is_correct: boolean }[];
      totalScore?: number;
    },
    @Req() req: any,
  ) {
    try {
      return await this.teacherExamService.updateSubmissionScore(
        submissionId,
        body.scores,
        body.totalScore,
        req.user,
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * 🔹 GET /teacher-exams/:examId/students
   * Ambil daftar siswa yang mengerjakan ujian tertentu
   */
  @Get(':examId/students')
  async getStudentsByExam(
    @Param('examId') examId: string,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: any,
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    try {
      return await this.teacherExamService.getStudentsByExam(
        examId,
        search,
        pageNumber,
        limitNumber,
        req.user,
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }
}
