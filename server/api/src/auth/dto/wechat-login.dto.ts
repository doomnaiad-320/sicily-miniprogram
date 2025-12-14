import { IsNotEmpty, IsString } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'code 不能为空' })
  code!: string;

  @IsString()
  nickname?: string;

  @IsString()
  avatarUrl?: string;
}
