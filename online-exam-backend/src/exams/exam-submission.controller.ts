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
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ExamSubmissionService } from './exam-submission.service';

@Controller('exam-submissions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SISWA)
export class ExamSubmissionController {
  constructor(private readonly examSubmissionService: ExamSubmissionService) {}

  @Get('me')
  async mySubmission(
    @Query('search') search = '',
    @Query('sort') sort = 'created_at',
    @Query('order') order: 'asc' | 'desc' = 'desc',
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
    @Body() body: { answers: any[]; sessionId: string },
    @Req() req: any,
  ) {
    const studentId = req.user?.sub;
    if (!Array.isArray(body.answers)) {
      throw new BadRequestException('answers must be an array');
    }

    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    return this.examSubmissionService.submit({
      exam_id: examId,
      student_id: studentId,
      session_id: body.sessionId,
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
