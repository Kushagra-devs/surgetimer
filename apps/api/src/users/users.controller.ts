import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import type { AppUser } from '@horse-timer/types';

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.list();
  }

  @Post()
  create(@Body() body: Partial<AppUser>) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<AppUser>) {
    return this.usersService.update(id, body);
  }
}
