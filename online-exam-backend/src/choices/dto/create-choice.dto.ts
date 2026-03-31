import { IsString, IsBoolean, IsUUID, Length } from 'class-validator';

export class CreateChoiceDto {
  @IsString()
  @Length(1, 255)
  choiceText: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsUUID()
  questionId: string;
}
