import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Controller('upload')
export class UploadController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = process.env.UPLOAD_DIR || 'uploads';
          const absolute = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
          if (!existsSync(absolute)) {
            mkdirSync(absolute, { recursive: true });
          }
          cb(null, absolute);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          cb(null, `${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const base = this.config.get<string>('UPLOAD_DIR') || 'uploads';
    const prefix = '/uploads';
    const filename = file.filename;
    const url = `${prefix}/${filename}`;
    return { url, filename };
  }
}
