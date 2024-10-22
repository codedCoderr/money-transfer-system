import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { ResponseService } from '../util/response.service';
import { CustomRedisModule } from 'redis/redis.module';

@Module({
  imports: [PrismaModule, CustomRedisModule, CacheModule.register()],
  controllers: [TransferController],
  providers: [TransferService, ConfigService, ResponseService],
})
export class TransferModule {}
