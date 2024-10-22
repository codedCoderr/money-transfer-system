import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: 'redis://localhost:6379',
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class CustomRedisModule {}
