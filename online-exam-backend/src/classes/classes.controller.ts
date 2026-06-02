import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ClassesService } from './classes.service';

@Controller('classes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  async getAll(
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.classesService.getAll(search, Number(page), Number(limit));
  }

  @Get('all')
  @Roles(Role.ADMIN, Role.GURU)
  async getOptions() {
    return this.classesService.getOptions();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: any, @Req() req: any) {
    return this.classesService.create(body, req.user?.sub);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.classesService.update(id, body, req.user?.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.classesService.softDelete(id, req.user?.sub);
  }
}
