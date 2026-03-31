import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamSubmissionService } from './exam-submission.service';

@Controller('exam-submissions')
@UseGuards(AuthGuard('jwt'))
export class ExamSubmissionController {
  constructor(private readonly examSubmissionService: ExamSubmissionService) {}

  @Get('me')
  async mySubmission(
    @Query('search') search = '',
    @Query('sort') sort = 'title',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: any,
  ) {
    const studentId = req.user?.sub;
    if (!studentId) throw new BadRequestException('User not authenticated');

    return this.examSubmissionService.getSubmittedExamsByStudent(
      studentId,
      search,
      sort,
      order,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async getSubmissionDetail(@Param('id') id: string, @Req() req: any) {
    const studentId = req.user?.sub;
    return this.examSubmissionService.getSubmissionDetail(id, studentId);
  }

  @Post(':examId')
  async submitExam(
    @Param('examId') examId: string,
    @Body() body: { answers: any[] },
    @Req() req: any,
  ) {
    const studentId = req.user?.sub;
    if (!Array.isArray(body.answers)) {
      throw new BadRequestException('answers must be an array');
    }

    return this.examSubmissionService.submit({
      exam_id: examId,
      student_id: studentId,
      answers: body.answers,
      created_by: studentId,
    });
  }

  @Get(':examId/me')
  async checkMySubmission(@Param('examId') examId: string, @Req() req: any) {
    const studentId = req.user?.sub;
    if (!studentId) throw new BadRequestException('User not authenticated');

    return this.examSubmissionService.hasSubmitted(examId, studentId);
  }
}
