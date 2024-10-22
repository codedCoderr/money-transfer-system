import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { UtilModule } from './util/util.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransferModule } from './transfer/transfer.module';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AccountModule,
    UserModule,
    UtilModule,
    PrismaModule,
    TransferModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
