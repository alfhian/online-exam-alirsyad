import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private normalizePasswordInput(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private normalizeDefaultPassword(value: unknown): string {
    const normalized = this.normalizePasswordInput(value);
    if (!normalized) return '';

    // Handle env values like "123456" or '123456'
    const hasDoubleQuotes =
      normalized.startsWith('"') && normalized.endsWith('"');
    const hasSingleQuotes =
      normalized.startsWith("'") && normalized.endsWith("'");

    if ((hasDoubleQuotes || hasSingleQuotes) && normalized.length >= 2) {
      return normalized.slice(1, -1).trim();
    }

    return normalized;
  }

  // ============================
  // BULK UPLOAD
  // ============================
  @Post('bulk-upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah.');
    }
    const createdBy = (req as any)?.user?.sub ?? null;
    return this.usersService.bulkUploadUsers(file.buffer, createdBy);
  }

  // ============================
  // PAGINATION USERS
  // ============================
  @Get()
  @Roles(Role.ADMIN)
  async getUsers(
    @Query('search') search = '',
    @Query('sort') sort = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.usersService.getUsersWithPagination(
      search,
      sort,
      order,
      Number(page),
      Number(limit),
    );
  }

  // ============================
  // GET USERS BY ROLE
  // ============================
  @Get('role')
  async getUsersByRole(
    @Query('role') role: string,
    @Query('examId') examId?: string,
    @Query('search') search = '',
    @Query('sort') sort = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    if (!role) {
      throw new BadRequestException('role query param is required');
    }

    return this.usersService.getUsersByRole(
      role.toUpperCase(),
      search,
      sort,
      order,
      Number(page),
      Number(limit),
      examId,
    );
  }

  // ============================
  // GET USER BY ID
  // ============================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // ============================
  // CREATE USER
  // ============================
  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: Partial<User>, @Req() req: Request) {
    const createdBy = (req as any)?.user?.sub ?? null;
    const defaultPassword =
      this.normalizeDefaultPassword(process.env.DEFAULT_NEW_USER_PASSWORD) || '123456';

    if (!body.name || !body.userid || !body.role) {
      throw new BadRequestException('Missing required fields');
    }

    const requestedPassword = this.normalizeDefaultPassword(body.password);
    const passwordSource = requestedPassword || defaultPassword;
    const hashedPassword = bcrypt.hashSync(passwordSource, 10);

    return this.usersService.createUser({
      ...body,
      password: hashedPassword,
      created_by: createdBy,
    });
  }

  // ============================
  // UPDATE USER
  // ============================
  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() body: Partial<User>,
    @Req() req: Request,
  ) {
    const updatedBy = (req as any)?.user?.sub ?? null;

    const updateData: Partial<User> = { ...body, updated_by: updatedBy };

    if (body.password) {
      const requestedPassword = this.normalizeDefaultPassword(body.password);
      if (requestedPassword) {
        updateData.password = bcrypt.hashSync(requestedPassword, 10);
      } else {
        delete updateData.password;
      }
    }

    return this.usersService.updateUser(id, updateData);
  }

  // ============================
  // UPDATE USER STATUS
  // ============================
  @Put(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('is_active') isActive: boolean,
    @Body('updated_at') updatedAt: Date,
    @Req() req: Request,
  ) {
    const updatedBy = (req as any)?.user?.sub ?? null;

    return this.usersService.updateUserStatus(id, isActive, updatedAt, updatedBy);
  }

  // ============================
  // DELETE USER
  // ============================
  @Post(':id/delete')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const deletedBy = (req as any)?.user?.sub ?? null;
    return this.usersService.deleteUser(id, deletedBy);
  }

  // ============================
  // GENERATE NEW PASSWORD FOR ALL SISWA
  // ============================
  @Post('generate-password-siswa')
  @Roles(Role.ADMIN)
  async generatePasswordSiswa() {
    return this.usersService.generateSamePasswordForAllSiswa();
  }
}
