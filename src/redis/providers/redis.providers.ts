import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SUBSCRIBER_CLIENT } from '../constant';
import { RedisClient } from '../types';

export const redisProviders: Provider[] = [
  {
    useFactory: (): RedisClient =>
      new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        keyPrefix: `money-transfer-3000`,
      }),
    provide: REDIS_SUBSCRIBER_CLIENT,
  },
];
