import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class OptionalUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) return true;
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_USER_SECRET') || 'dev-user-secret',
      }) as { sub: number; openId: string };
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && user.status === 'ACTIVE') {
        (request as any).user = user;
      }
    } catch (err) {
      // 忽略错误，让接口保持可用
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
