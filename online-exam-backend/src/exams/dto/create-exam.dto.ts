// create-exam.dto.ts
import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateExamDto {
  @IsString()
  title: string;

  @IsString()
  subject_id: string;

  @IsDateString()
  date: string;

  @IsString()
  type: string;

  @IsInt()
  duration: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  created_by: string;
}
