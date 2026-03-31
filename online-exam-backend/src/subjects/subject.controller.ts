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
  InternalServerErrorException,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('subjects')
@UseGuards(AuthGuard('jwt'))
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  async create(@Body() body: Partial<Subject>, @Req() req: any): Promise<Subject> {
    const createdBy = req.user?.sub;

    if (!body.name) throw new BadRequestException('Missing required fields: name');
    if (!body.class_id) throw new BadRequestException('Missing required fields: class_id');

    try {
      return await this.subjectService.create({
        name: body.name,
        class_id: body.class_id,
        description: body.description,
        created_by: createdBy,
      });
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get()
  async getAll(
    @Query('search') search: string = '',
    @Query('sort') sort = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    try {
      return await this.subjectService.getDataWithPagination(
        search,
        sort,
        order,
        Number(page),
        Number(limit),
      );
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('all')
  async getAllData() {
    try {
      return await this.subjectService.getDataOnly();
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.subjectService.findById(id);
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
  async softDelete(@Param('id') id: string, @Body('deletedBy') deletedBy: string) {
    const subject = await this.subjectService.findById(id);
    if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);

    return await this.subjectService.softDelete(id, deletedBy);
  }
}
