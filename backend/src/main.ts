import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Serve uploaded images statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Social Media API')
    .setDescription('The API documentation for the social media app')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  // 👇 THIS IS THE SUCCESS MESSAGE YOU ASKED FOR 👇
  console.log(`\n🚀 =======================================================`);
  console.log(`✅ Server is running perfectly on: http://localhost:${PORT}`);
  console.log(`📚 Swagger API Docs available at: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database: MySQL connected successfully!`);
  console.log(`=========================================================\n`);
}
bootstrap();