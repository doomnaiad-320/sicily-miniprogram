import { PostType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsEnum(PostType)
  type!: PostType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsNotEmpty({ message: '描述不能为空' })
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  categoryId!: number;

  @IsArray()
  @ArrayMinSize(2, { message: '至少上传 2 张图片' })
  @ArrayMaxSize(9, { message: '最多 9 张图片' })
  images!: string[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  locationLng?: number;

  @IsString()
  @IsNotEmpty({ message: '位置描述不能为空' })
  @MaxLength(100)
  locationText!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
