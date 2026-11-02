import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/posts.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt')) // <-- This protects the route
  @Post()
  create(@Body() dto: CreatePostDto, @Request() req: any) {
    return this.postsService.createPost(req.user.userId, dto);
  }

  @Get()
  findAll() {
    return this.postsService.getFeed();
  }
}