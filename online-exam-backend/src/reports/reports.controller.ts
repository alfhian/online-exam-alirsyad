import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
@Roles(Role.ADMIN, Role.GURU)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('exam-performance')
  getExamPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examType') examType?: string,
  ) {
    return this.reportsService.getExamPerformance({ from, to, subjectId, examType });
  }

  @Get('submission-list')
  getSubmissionList(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examType') examType?: string,
  ) {
    return this.reportsService.getSubmissionList({ from, to, subjectId, examType });
  }

  @Get('subject-summary')
  getSubjectSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examType') examType?: string,
  ) {
    return this.reportsService.getSubjectSummary({ from, to, subjectId, examType });
  }

  @Get('dashboard-charts')
  getDashboardCharts(@Req() req: any) {
    const user = req.user;
    return this.reportsService.getDashboardCharts(user);
  }
}
