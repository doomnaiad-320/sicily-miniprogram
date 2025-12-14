import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: '名称不能为空' })
  name!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number = 0;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
