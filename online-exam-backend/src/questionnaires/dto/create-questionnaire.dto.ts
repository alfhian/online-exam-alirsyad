import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsArray,
  IsInt,
  Min,
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

  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  })
  @IsInt()
  @Min(1)
  index: number;

  @IsOptional()
  @IsString()
  created_by?: string;
}
