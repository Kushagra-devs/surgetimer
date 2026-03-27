import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('events/:eventId/classes')
export class ClassesController {
  constructor(@Inject(ClassesService) private readonly classesService: ClassesService) {}

  @Get()
  list(@Param('eventId') eventId: string) {
    return this.classesService.list(eventId);
  }

  @Post()
  create(@Param('eventId') eventId: string, @Body() body: Record<string, string>) {
    return this.classesService.create(eventId, body);
  }
}
