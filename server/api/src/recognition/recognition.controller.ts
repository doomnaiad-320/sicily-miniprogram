import { Body, Controller, Post } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { RecognizeDto } from './dto/recognize.dto';

@Controller('recognize')
export class RecognitionController {
  constructor(private readonly service: RecognitionService) {}

  @Post()
  async recognize(@Body() dto: RecognizeDto) {
    return this.service.recognize(dto.imageUrl);
  }
}
