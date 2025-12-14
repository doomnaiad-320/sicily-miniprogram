import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '留言不能为空' })
  @MinLength(2)
  @MaxLength(200)
  content!: string;
}
