import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private available = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.available = true;
    } catch {
      this.available = false;
    }
  }

  async onModuleDestroy() {
    if (this.available) {
      await this.$disconnect();
    }
  }

  isAvailable() {
    return this.available;
  }
}
