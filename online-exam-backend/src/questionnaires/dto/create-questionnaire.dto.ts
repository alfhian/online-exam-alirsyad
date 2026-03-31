import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsArray,
  IsInt,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

class OptionDto {
  @IsString()
  @IsIn(['text', 'image'])
  type: 'text' | 'image' = 'text';

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateQuestionnaireDto {
  @IsUUID()
  @IsOptional()
  exam_id?: string; // ✅ optional karena diambil dari @Param di controller

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsIn(['multiple_choice', 'essay'])
  type: 'multiple_choice' | 'essay';

  // ✅ hanya divalidasi bila type === 'multiple_choice'
  @ValidateIf((o) => o.type === 'multiple_choice')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  // ✅ hanya divalidasi bila type === 'multiple_choice'
  @ValidateIf((o) => o.type === 'multiple_choice')
  @IsString()
  @IsOptional()
  answer?: string;

  @Type(() => Number)
  @IsInt()
  index: number;

  @IsOptional()
  @IsString()
  created_by?: string;
}
