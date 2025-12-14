import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class RecognizeDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'imageUrl 必须是合法的 URL' })
  imageUrl!: string;
}
