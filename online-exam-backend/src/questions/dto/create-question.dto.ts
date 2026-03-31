import { IsString, IsInt } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsString()
  type: string;

  @IsInt()
  points: number;

  @IsString()
  examId: string;

  @IsString()
  createdBy: string;
}
