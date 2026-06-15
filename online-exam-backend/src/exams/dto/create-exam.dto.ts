// create-exam.dto.ts
import { IsString, IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

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
  @IsInt()
  @Min(0)
  @Max(100)
  multiple_choice_weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  essay_weight?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  created_by: string;
}
