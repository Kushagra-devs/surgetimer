import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { MobileAccessService } from './mobile-access.service';

@Controller('mobile-access')
export class MobileAccessController {
  constructor(@Inject(MobileAccessService) private readonly mobileAccessService: MobileAccessService) {}

  @Get('status')
  status() {
    return this.mobileAccessService.getStatus();
  }

  @Post('generate')
  generate(@Body('masterPassword') masterPassword?: string) {
    return this.mobileAccessService.generate(masterPassword);
  }

  @Post('validate')
  validate(@Body('code') code?: string) {
    return this.mobileAccessService.validate(code);
  }
}
