import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async create(@Body() dto: CreateQuestionDto) {
    try {
      return await this.questionService.create(dto);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get()
  async findAll(@Query('examId') examId?: string) {
    try {
      return await this.questionService.findAll(examId);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.questionService.findById(id);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    try {
      return await this.questionService.update(id, dto);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @Body('deletedBy') deletedBy: string) {
    try {
      return await this.questionService.softDelete(id, deletedBy);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
