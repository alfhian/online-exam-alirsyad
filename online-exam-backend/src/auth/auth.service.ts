import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
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
    const hashed = bcrypt.hashSync(dto.password, 10);

    await this.usersService.createUser({
      userid: dto.userid,
      password: hashed,
      name: dto.name,
      role: dto.role,
      is_active: true,
      created_at: new Date(),
      created_by: dto.created_by,
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
    const user = await this.usersService.getUserByNisNik(id);

    if (!user) {
      throw new UnauthorizedException('User ID tidak terdaftar');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    if (!password) {
      throw new UnauthorizedException('Password tidak boleh kosong');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
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
