import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My first post from Swagger! 🚀', required: false })
  @IsString()
  @IsOptional()
  caption!: string;

  @ApiProperty({ example: 'http://localhost:3000/uploads/test-image.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;
}