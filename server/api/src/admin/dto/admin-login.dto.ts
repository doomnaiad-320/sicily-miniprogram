import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password!: string;
}
