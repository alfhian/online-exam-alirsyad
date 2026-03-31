import { IsString, IsBoolean, IsDate, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class RegisterDto {
  @IsString()
  userid: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  role: string; // e.g., 'student', 'teacher', 'admin'

  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  created_at: Date;

  @IsOptional()
  @IsString()
  created_by: string; // User ID of the creator
}
