import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const username = this.config.get<string>('ADMIN_DEFAULT_USERNAME');
    const password = this.config.get<string>('ADMIN_DEFAULT_PASSWORD');
    if (!username || !password) {
      return;
    }
    const existing = await this.prisma.admin.findUnique({ where: { username } });
    if (!existing) {
      const hash = await bcrypt.hash(password, 10);
      await this.prisma.admin.create({
        data: {
          username,
          password: hash,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`已创建默认管理员：${username}`);
    }
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });
    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const ok = await bcrypt.compare(dto.password, admin.password);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.jwtService.sign(
      { sub: admin.id, username: admin.username },
      { secret: this.config.get<string>('JWT_ADMIN_SECRET') || 'dev-admin-secret' },
    );

    return { token, admin };
  }
}
