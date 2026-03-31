import {
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString()
  @IsIn(['text', 'image'], { message: 'type must be either "text" or "image"' })
  type: 'text' | 'image';

  @IsString()
  value: string; // bisa teks atau URL gambar
}

export class UpdateQuestionnaireDto {
  @IsOptional()
  @IsUUID()
  exam_id?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsIn(['multiple_choice', 'essay'], {
    message: 'type must be either "multiple_choice" or "essay"',
  })
  type?: 'multiple_choice' | 'essay';

  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}
