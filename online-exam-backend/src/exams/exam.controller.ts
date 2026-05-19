import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  InternalServerErrorException,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ExamService } from './exam.service';
import { ExamStudentsService } from './exam-student.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly examStudentsService: ExamStudentsService,
    private readonly supabase: SupabaseClient,
  ) {}

  private normalizeExamDate(date: string | Date): string {
    const raw = String(date ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00`;
    return raw;
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const createdBy = req.user?.sub;

    if (!body.title || !body.date || !body.duration || !body.subject_id || !body.type) {
      throw new BadRequestException(
        'Missing required fields: title, date, duration, subject, or type',
      );
    }

    const formattedDate = this.normalizeExamDate(body.date);

    const { data, error } = await this.supabase
      .from('exams')
      .insert({
        ...body,
        date: formattedDate,
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  @Get()
  async getAll(
    @Query('search') search = '',
    @Query('sort') sort = 'title',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.examService.getDataWithPagination(search, sort, order, Number(page), Number(limit));
  }

  @Get('today')
  async getToday(
    @Req() req: any,
    @Query('search') search = '',
    @Query('sort') sort = 'title',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('debug') debug = '0',
  ) {
    const userlogin = req.user?.sub;
    return this.examService.getTodayExamsWithPagination(
      userlogin,
      search,
      sort,
      order,
      Number(page),
      Number(limit),
      debug === '1',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { data, error } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new BadRequestException(`Exam ${id} not found`);
    return data;
  }

  @Get(':id/questions')
  async getExamQuestions(@Param('id') examId: string) {
    return this.examService.getExamQuestions(examId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const updatePayload = {
      ...dto,
      ...(dto.date ? { date: this.normalizeExamDate(dto.date) } : {}),
      updated_at: new Date(),
      updated_by: dto.updated_by,
    };

    const { data, error } = await this.supabase
      .from('exams')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @Body('deletedBy') deletedBy: string) {
    const { data, error } = await this.supabase
      .from('exams')
      .update({ deleted_at: new Date(), deleted_by: deletedBy })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  @Get(':id/students')
  async getStudents(@Param('id') examId: string) {
    return this.examStudentsService.getExamStudents(examId);
  }

  @Post(':id/students')
  async assignStudents(@Param('id') examId: string, @Body('studentIds') studentIds: string[], @Req() req: any) {
    const createdBy = req.user?.sub;
    if (!studentIds?.length) throw new BadRequestException('studentIds tidak boleh kosong');
    return this.examStudentsService.assignStudents(examId, studentIds, createdBy);
  }
}
