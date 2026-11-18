import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

const profileSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data = {
      ...(dto.username !== undefined && { username: dto.username.trim() }),
      ...(dto.displayName !== undefined && {
        displayName: dto.displayName?.trim() || null,
      }),
      ...(dto.bio !== undefined && { bio: dto.bio?.trim() || null }),
    };

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: profileSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('That username is already taken');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }

      throw error;
    }
  }
}