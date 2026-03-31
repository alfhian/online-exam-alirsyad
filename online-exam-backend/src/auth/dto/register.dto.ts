import { IsString, IsBoolean, IsDate } from "class-validator";
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

  @IsBoolean()
  is_active: boolean;

  @Type(() => Date)
  @IsDate()
  created_at: Date;

  @IsString()
  created_by: string; // User ID of the creator
}