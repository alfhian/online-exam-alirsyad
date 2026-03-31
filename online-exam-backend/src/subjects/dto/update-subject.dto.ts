import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectDto } from './create-subject.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {
  @IsOptional()
  @IsString()
  updated_by?: string;

  @IsString()
  class_id?: string;

  @IsOptional()
  @IsString()
  deletedBy?: string;
}
