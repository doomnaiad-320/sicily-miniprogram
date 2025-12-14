import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class AuditPostDto {
  @IsEnum(AuditAction)
  action!: AuditAction;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;
}
