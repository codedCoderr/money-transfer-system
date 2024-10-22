import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ResponseService } from '../util/response.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService, ResponseService],
})
export class UserModule {}
