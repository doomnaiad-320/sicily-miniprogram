import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 微信登录：用 code 换 openid，保存/更新用户信息，返回 JWT
   */
  async wechatLogin(dto: WechatLoginDto) {
    const appid = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    if (!appid || !secret) {
      throw new BadRequestException('后台未配置微信登录参数');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${dto.code}&grant_type=authorization_code`;
    const { data } = await axios.get(url);

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败：${data.errmsg || data.errcode}`);
    }

    const openId = data.openid as string;
    const nickname = dto.nickname || '微信用户';
    const avatarUrl = dto.avatarUrl || '';

    const user = await this.prisma.user.upsert({
      where: { openId },
      update: {
        nickname,
        avatarUrl,
        lastLoginAt: new Date(),
      },
      create: {
        openId,
        nickname,
        avatarUrl,
        lastLoginAt: new Date(),
      },
    });

    const token = this.jwtService.sign(
      { sub: user.id, openId: user.openId },
      { secret: this.config.get<string>('JWT_USER_SECRET') || 'dev-user-secret' },
    );

    return {
      token,
      user,
    };
  }
}
