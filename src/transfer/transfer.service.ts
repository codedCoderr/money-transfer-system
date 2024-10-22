import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferDTO } from './dtos';
import { RedisService } from '../redis/services/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TransferService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async transferMoney(transferDto: TransferDTO): Promise<any> {
    const { senderUsername, receiverUsername, amount } = transferDto;

    return this.prisma.$transaction(async (prisma) => {
      const sender = await prisma.user.findUnique({
        where: { username: senderUsername },
      });
      const receiver = await prisma.user.findUnique({
        where: { username: receiverUsername },
      });

      if (!sender || !receiver) throw new Error('User not found');
      if (sender.balance < amount) throw new Error('Insufficient funds');

      await prisma.user.update({
        where: { username: senderUsername },
        data: { balance: { decrement: amount } },
      });
      await prisma.user.update({
        where: { username: receiverUsername },
        data: { balance: { increment: amount } },
      });

      const transfer = await prisma.transfer.create({
        data: {
          sender: { connect: { id: sender.id } },
          receiver: { connect: { id: receiver.id } },
          amount,
        },
      });

      await this.redisService.delete(`user:transfers:${senderUsername}`);
      await this.redisService.delete(`user:transfers:${receiverUsername}`);

      await this.cacheManager.set(
        `user:balance:${senderUsername}`,
        sender.balance - amount,
        3600 * 24,
      );
      await this.cacheManager.set(
        `user:balance:${receiverUsername}`,
        receiver.balance + amount,
        3600 * 24,
      );

      return transfer;
    });
  }

  async getUserBalance(username: string): Promise<number> {
    const cacheKey = `user:balance:${username}`;
    const cachedBalance = await this.cacheManager.get<number>(cacheKey);

    if (cachedBalance !== undefined) {
      return cachedBalance;
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { balance: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.cacheManager.set(cacheKey, user.balance, 3600 * 24);
    return user.balance;
  }

  async getTransfers(username: string, page: number, limit: number) {
    const cacheKey = `user:transfers:${username}:${page}:${limit}`;
    const cachedTransfers = await this.cacheManager.get(cacheKey);

    if (cachedTransfers) {
      return JSON.parse(cachedTransfers as string);
    }

    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [{ sender: { username } }, { receiver: { username } }],
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    await this.cacheManager.set(cacheKey, JSON.stringify(transfers), 3600 * 24);

    return transfers;
  }
}
