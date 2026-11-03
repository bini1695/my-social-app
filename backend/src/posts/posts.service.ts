import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: { caption: dto.caption, imageUrl: dto.imageUrl, authorId: userId },
    });
  }

  async getFeed() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        likes: true,
        comments: {
          include: { author: { select: { username: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
    });
  }

  async likePost(userId: string, postId: string) {
    try {
      return await this.prisma.like.create({
        data: { userId, postId },
      });
    } catch (error) {
      throw new ConflictException('You already liked this post');
    }
  }

  async unlikePost(userId: string, postId: string) {
    try {
      return await this.prisma.like.delete({
        where: { postId_userId: { postId, userId } },
      });
    } catch (error) {
      throw new NotFoundException('Like not found');
    }
  }

  async addComment(userId: string, postId: string, text: string) {
    return this.prisma.comment.create({
      data: { text, postId, authorId: userId },
      include: { author: { select: { username: true } } }
    });
  }
}