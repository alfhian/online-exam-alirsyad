import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  userid: string;

  @IsString()
  password: string;
}
