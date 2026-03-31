import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name: string;

  @IsString()
  class_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must be at most 255 characters long' })
  description?: string;

  @IsString()
  created_by: string;
}
