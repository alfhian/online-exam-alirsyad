import {
  Controller,
  Post,
  Param,
  UploadedFile,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ExamSessionService } from './exam-session.service';
import type { Request } from 'express';

@Controller('exam-sessions')
@UseGuards(AuthGuard('jwt'))
export class ExamSessionController {
  constructor(private readonly examSessionService: ExamSessionService) {}

  /**
   * Upload video ke Supabase Storage
   */
  @Post(':sessionId/upload-video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    if (!file) {
      throw new BadRequestException('File rekaman tidak ditemukan');
    }

    const user = (req as any).user;
    if (!user?.sub) {
      throw new BadRequestException('User tidak terautentikasi');
    }

    return this.examSessionService.uploadVideo(sessionId, file, user);
  }

  /**
   * Memulai sesi ujian (dibuat 1x per siswa per ujian)
   */
  @Post(':examId/start')
  async startSession(@Param('examId') examId: string, @Req() req: Request) {
    const user = (req as any).user;
    const studentId = user?.sub;

    if (!studentId) {
      throw new BadRequestException('User tidak terautentikasi');
    }

    return this.examSessionService.startSession(examId, studentId);
  }

  /**
   * Tambah counter tab-switch (diperoleh dari FE anti-cheat)
   */
  @Post(':sessionId/tab-switch')
  async incrementTabSwitch(@Param('sessionId') sessionId: string) {
    return this.examSessionService.incrementTabSwitch(sessionId);
  }

  /**
   * Menandai sesi sebagai selesai
   */
  @Post(':sessionId/finish')
  async finishSession(@Param('sessionId') sessionId: string) {
    return this.examSessionService.finishSession(sessionId);
  }
}
