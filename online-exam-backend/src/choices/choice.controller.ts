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
import { ChoiceService } from './choice.service';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { UpdateChoiceDto } from './dto/update-choice.dto';

@Controller('choices')
export class ChoiceController {
  constructor(private readonly choiceService: ChoiceService) {}

  @Post()
  create(@Body() dto: CreateChoiceDto) {
    return this.choiceService.create(dto);
  }

  @Get()
  findAll(@Query('questionId') questionId?: string) {
    return this.choiceService.findAll(questionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.choiceService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChoiceDto) {
    return this.choiceService.update(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Body('deletedBy') deletedBy: string) {
    return this.choiceService.softDelete(id, deletedBy);
  }
}
