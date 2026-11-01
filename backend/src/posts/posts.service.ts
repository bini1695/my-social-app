import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        caption: dto.caption,
        imageUrl: dto.imageUrl,
        authorId: userId,
      },
    });
  }

  async getFeed() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }
}