import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/posts.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreatePostDto, @Request() req: any) {
    return this.postsService.createPost(req.user.userId, dto);
  }

  @Get()
  findAll() {
    return this.postsService.getFeed();
  }

  // 👇 LIKE ROUTES 👇
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  like(@Param('id') postId: string, @Request() req: any) {
    return this.postsService.likePost(req.user.userId, postId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/like')
  unlike(@Param('id') postId: string, @Request() req: any) {
    return this.postsService.unlikePost(req.user.userId, postId);
  }

  // 👇 COMMENT ROUTE 👇
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comment')
  comment(@Param('id') postId: string, @Body('text') text: string, @Request() req: any) {
    return this.postsService.addComment(req.user.userId, postId, text);
  }
}