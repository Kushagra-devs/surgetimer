import { Body, Controller, Get, Inject, Ip, Post } from '@nestjs/common';
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

  @Post('login')
  login(
    @Body('code') code?: string,
    @Body('password') password?: string,
    @Body('name') name?: string,
    @Body('location') location?: unknown,
    @Body('device') device?: unknown,
    @Ip() ipAddress?: string,
  ) {
    return this.mobileAccessService.login({
      code,
      password,
      name,
      location: location as never,
      device: device as never,
      ipAddress,
    });
  }

  @Post('heartbeat')
  heartbeat(@Body('sessionToken') sessionToken?: string, @Body('location') location?: unknown) {
    return this.mobileAccessService.heartbeat(sessionToken, location as never);
  }

  @Post('logout')
  logout(@Body('sessionToken') sessionToken?: string) {
    return this.mobileAccessService.logout(sessionToken);
  }

  @Post('action')
  runAction(
    @Body('sessionToken') sessionToken?: string,
    @Body('action') action?: string,
    @Body('competitorEntryId') competitorEntryId?: string,
    @Body('reason') reason?: string,
  ) {
    return this.mobileAccessService.runAction(sessionToken, action ?? '', { competitorEntryId, reason });
  }
}
