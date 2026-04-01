import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly defaultPassword = '123456';
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private blacklistedTokens: Set<string> = new Set();

  blacklistToken(token: string) {
    this.blacklistedTokens.add(token);
    console.log('Token blacklisted:', token);
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /** ===========================
   * REGISTER
   * ===========================
   */
  async register(dto: RegisterDto) {
    const userid = String(dto.userid ?? '').trim();
    const rawPassword = String(dto.password ?? '').trim() || this.defaultPassword;
    if (!userid) {
      throw new BadRequestException('User ID tidak boleh kosong');
    }

    const hashed = bcrypt.hashSync(rawPassword, 10);
    const newUserId = randomUUID();
    const createdBy =
      dto.created_by && this.uuidRegex.test(dto.created_by)
        ? dto.created_by
        : newUserId;

    await this.usersService.createUser({
      id: newUserId,
      userid,
      password: hashed,
      name: dto.name,
      role: dto.role,
      is_active: dto.is_active ?? true,
      created_at: new Date(),
      created_by: createdBy,
    });

    const user = await this.usersService.getUserByNisNik(dto.userid);

    if (!user) {
      throw new InternalServerErrorException('User registration failed');
    }

    return {
      message: 'User berhasil didaftarkan',
      user: {
        userid: user.userid,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
    };
  }

  /** ===========================
   * VALIDASI USER
   * ===========================
   */
  async validateUser(id: string, password: string) {
    const userid = String(id ?? '').trim();
    const inputPassword = String(password ?? '').trim();
    const user = await this.usersService.getUserByNisNik(userid);

    if (!user) {
      throw new UnauthorizedException('User ID tidak terdaftar');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    if (!inputPassword) {
      throw new UnauthorizedException('Password tidak boleh kosong');
    }

    const isPasswordValid = bcrypt.compareSync(inputPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  /** ===========================
   * LOGIN
   * ===========================
   */
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.userid, dto.password);

    const payload = {
      sub: user.id,
      userid: user.userid,
      role: user.role,
      name: user.name,
      is_active: user.is_active,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /** ===========================
   * LOGOUT
   * ===========================
   */
  async logout(token: string) {
    if (!token) return { message: 'No token provided' };

    this.blacklistToken(token);
    return { message: 'Logged out successfully' };
  }
}
