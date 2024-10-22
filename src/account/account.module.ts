import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResponseService } from '../util/response.service';
import { UserService } from '../user/user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomRedisModule } from '../redis/redis.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    UserModule,
    CustomRedisModule,
    ConfigModule,
    CacheModule.register(),
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
    ResponseService,
    UserService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AccountModule {}
