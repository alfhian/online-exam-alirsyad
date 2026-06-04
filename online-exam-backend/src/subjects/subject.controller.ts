import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('subjects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: Partial<Subject>, @Req() req: any): Promise<Subject> {
    const createdBy = req.user?.sub;

    if (!body.name) throw new BadRequestException('Missing required fields: name');
    if (!body.class_id) throw new BadRequestException('Missing required fields: class_id');

    return await this.subjectService.create({
      name: body.name,
      class_id: body.class_id,
      teacher_id: body.teacher_id,
      description: body.description,
      created_by: createdBy,
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  async getAll(
    @Query('search') search: string = '',
    @Query('sort') sort = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: any,
  ) {
    return await this.subjectService.getDataWithPagination(
      search,
      sort,
      order,
      Number(page),
      Number(limit),
      req.user,
    );
  }

  @Get('all')
  @Roles(Role.ADMIN, Role.GURU)
  async getAllData(@Req() req: any) {
    return await this.subjectService.getDataOnly(req.user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.GURU)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const data = await this.subjectService.findById(id, req.user);
    if (!data) throw new NotFoundException(`Subject with ID ${id} not found`);
    return data;
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() body: Partial<Subject>, @Req() req: any) {
    const updatedBy = req.user?.sub;
    const subject = await this.subjectService.findById(id);
    if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);

    return await this.subjectService.update(id, { ...body, updated_by: updatedBy });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const subject = await this.subjectService.findById(id);
    if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);

    return await this.subjectService.softDelete(id, req.user?.sub);
  }
}
