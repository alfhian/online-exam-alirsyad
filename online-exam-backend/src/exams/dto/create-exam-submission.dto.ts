import { IsNotEmpty, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsUUID()
  @IsNotEmpty()
  question_id: string;

  @IsNotEmpty()
  answer: string;
}

export class CreateExamSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  exam_id: string;

  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsUUID()
  @IsNotEmpty()
  created_by: string;
}
