import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PassportModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}