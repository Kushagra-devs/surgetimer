import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CsvService } from './csv.service';

@Controller('imports')
export class CsvController {
  constructor(@Inject(CsvService) private readonly csvService: CsvService) {}

  @Post('preview')
  preview(@Body('content') content: string) {
    return this.csvService.preview(content ?? '');
  }
}
