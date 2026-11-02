import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaMariaDb({
      host: '127.0.0.1',
      port: 8889, // 👈 Make sure this matches MAMP (8889 or 3306)
      user: 'root',
      password: 'pass123', // 👈 Your MAMP password
      database: 'socialdb',
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
    });
    
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Successfully connected to the MySQL database!');
    } catch (error) {
      this.logger.error('❌ Failed to connect to the database', error);
      throw error;
    }
  }
}