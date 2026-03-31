import { IsOptional, IsString, IsBoolean, IsUUID, Length } from 'class-validator';

export class UpdateChoiceDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  choiceText?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @IsOptional()
  @IsUUID()
  questionId?: string;
}
