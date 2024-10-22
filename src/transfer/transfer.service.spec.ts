import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/services/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
import { TransferDTO } from './dtos';

describe('TransferService', () => {
  let transferService: TransferService;
  // let prismaService: PrismaService;
  // let redisService: RedisService;
  // let cacheManager: Cache;

  const mockPrismaService = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transfer: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockRedisService = {
    delete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    transferService = module.get<TransferService>(TransferService);
    // prismaService = module.get<PrismaService>(PrismaService);
    // redisService = module.get<RedisService>(RedisService);
    // cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transferMoney', () => {
    const transferDto: TransferDTO = {
      senderUsername: 'sender',
      receiverUsername: 'receiver',
      amount: 100,
    };

    it('should successfully transfer money between users', async () => {
      const mockSender = { id: 1, username: 'sender', balance: 500 };
      const mockReceiver = { id: 2, username: 'receiver', balance: 200 };
      const mockTransfer = { id: 1, senderId: 1, receiverId: 2, amount: 100 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(mockSender)
          .mockResolvedValueOnce(mockReceiver);
        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.transfer.create.mockResolvedValue(mockTransfer);
        return callback(mockPrismaService);
      });

      const result = await transferService.transferMoney(transferDto);

      expect(result).toEqual(mockTransfer);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.transfer.create).toHaveBeenCalledTimes(1);
      expect(mockRedisService.delete).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if sender is not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 2, username: 'receiver', balance: 200 });
        return callback(mockPrismaService);
      });

      await expect(transferService.transferMoney(transferDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if receiver is not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce({ id: 1, username: 'sender', balance: 500 })
          .mockResolvedValueOnce(null);
        return callback(mockPrismaService);
      });

      await expect(transferService.transferMoney(transferDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if sender has insufficient funds', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce({ id: 1, username: 'sender', balance: 50 })
          .mockResolvedValueOnce({ id: 2, username: 'receiver', balance: 200 });
        return callback(mockPrismaService);
      });

      await expect(transferService.transferMoney(transferDto)).rejects.toThrow(
        'Insufficient funds',
      );
    });

    it('should update user balances correctly', async () => {
      const mockSender = { id: 1, username: 'sender', balance: 500 };
      const mockReceiver = { id: 2, username: 'receiver', balance: 200 };
      const mockTransfer = { id: 1, senderId: 1, receiverId: 2, amount: 100 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(mockSender)
          .mockResolvedValueOnce(mockReceiver);
        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.transfer.create.mockResolvedValue(mockTransfer);
        return callback(mockPrismaService);
      });

      await transferService.transferMoney(transferDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { username: 'sender' },
        data: { balance: { decrement: 100 } },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { username: 'receiver' },
        data: { balance: { increment: 100 } },
      });
    });

    it('should delete Redis cache for both users', async () => {
      const mockSender = { id: 1, username: 'sender', balance: 500 };
      const mockReceiver = { id: 2, username: 'receiver', balance: 200 };
      const mockTransfer = { id: 1, senderId: 1, receiverId: 2, amount: 100 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(mockSender)
          .mockResolvedValueOnce(mockReceiver);
        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.transfer.create.mockResolvedValue(mockTransfer);
        return callback(mockPrismaService);
      });

      await transferService.transferMoney(transferDto);

      expect(mockRedisService.delete).toHaveBeenCalledWith(
        'user:transfers:sender',
      );
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        'user:transfers:receiver',
      );
    });
  });

  describe('getTransfers', () => {
    const username = 'testuser';
    const page = 1;
    const limit = 10;

    it('should return cached transfers if available', async () => {
      const cachedTransfers = [{ id: 1, amount: 100 }];
      mockCacheManager.get.mockResolvedValue(JSON.stringify(cachedTransfers));

      const result = await transferService.getTransfers(username, page, limit);

      expect(result).toEqual(cachedTransfers);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `user:transfers:${username}:${page}:${limit}`,
      );
      expect(mockPrismaService.transfer.findMany).not.toHaveBeenCalled();
    });

    it('should fetch transfers from database if not cached', async () => {
      const dbTransfers = [
        { id: 1, amount: 100 },
        { id: 2, amount: 200 },
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transfer.findMany.mockResolvedValue(dbTransfers);

      const result = await transferService.getTransfers(username, page, limit);

      expect(result).toEqual(dbTransfers);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `user:transfers:${username}:${page}:${limit}`,
      );
      expect(mockPrismaService.transfer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ sender: { username } }, { receiver: { username } }],
        },
        skip: 0,
        take: 10,
      });
    });

    it('should cache fetched transfers', async () => {
      const dbTransfers = [
        { id: 1, amount: 100 },
        { id: 2, amount: 200 },
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transfer.findMany.mockResolvedValue(dbTransfers);

      await transferService.getTransfers(username, page, limit);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `user:transfers:${username}:${page}:${limit}`,
        JSON.stringify(dbTransfers),
        3600 * 24,
      );
    });

    it('should handle pagination correctly', async () => {
      const page = 2;
      const limit = 5;
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transfer.findMany.mockResolvedValue([]);

      await transferService.getTransfers(username, page, limit);

      expect(mockPrismaService.transfer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ sender: { username } }, { receiver: { username } }],
        },
        skip: 5,
        take: 5,
      });
    });

    it('should return an empty array if no transfers found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transfer.findMany.mockResolvedValue([]);

      const result = await transferService.getTransfers(username, page, limit);

      expect(result).toEqual([]);
    });
  });
});
