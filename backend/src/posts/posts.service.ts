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
        likes: true, // <-- We added this so the frontend knows who liked the post
      },
    });
  }

  // 1. Add a like to a post
  async likePost(userId: string, postId: string) {
    return this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  // 2. Remove a like from a post
  async unlikePost(userId: string, postId: string) {
    return this.prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
  }
}