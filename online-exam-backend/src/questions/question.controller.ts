import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async create(@Body() dto: CreateQuestionDto) {
    return await this.questionService.create(dto);
  }

  @Get()
  async findAll(@Query('examId') examId?: string) {
    return await this.questionService.findAll(examId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.questionService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return await this.questionService.update(id, dto);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @Body('deletedBy') deletedBy: string) {
    return await this.questionService.softDelete(id, deletedBy);
  }
}
