import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Makes Prisma available everywhere without importing it manually
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}