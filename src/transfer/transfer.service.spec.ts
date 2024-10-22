import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/services/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TransferDTO } from './dtos';

describe('TransferService', () => {
  let transferService: TransferService;

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

    it('should update cache with new balances', async () => {
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

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:balance:sender',
        400,
        3600 * 24,
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:balance:receiver',
        300,
        3600 * 24,
      );
    });

    it('should handle decimal amounts correctly', async () => {
      const decimalTransferDto: TransferDTO = {
        senderUsername: 'sender',
        receiverUsername: 'receiver',
        amount: 100.5,
      };

      const mockSender = { id: 1, username: 'sender', balance: 500.75 };
      const mockReceiver = { id: 2, username: 'receiver', balance: 200.25 };
      const mockTransfer = { id: 1, senderId: 1, receiverId: 2, amount: 100.5 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(mockSender)
          .mockResolvedValueOnce(mockReceiver);
        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.transfer.create.mockResolvedValue(mockTransfer);
        return callback(mockPrismaService);
      });

      const result = await transferService.transferMoney(decimalTransferDto);

      expect(result).toEqual(mockTransfer);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { username: 'sender' },
        data: { balance: { decrement: 100.5 } },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { username: 'receiver' },
        data: { balance: { increment: 100.5 } },
      });
    });
  });

  describe('getUserBalance', () => {
    const username = 'testuser';

    it('should return cached balance if available', async () => {
      const cachedBalance = 1000;
      mockCacheManager.get.mockResolvedValue(cachedBalance);

      const result = await transferService.getUserBalance(username);

      expect(result).toEqual(cachedBalance);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `user:balance:${username}`,
      );
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch balance from database if not cached', async () => {
      const dbBalance = 1500;
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue({
        balance: dbBalance,
      });

      const result = await transferService.getUserBalance(username);

      expect(result).toEqual(dbBalance);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `user:balance:${username}`,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
        select: { balance: true },
      });
    });

    it('should cache fetched balance', async () => {
      const dbBalance = 1500;
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue({
        balance: dbBalance,
      });

      await transferService.getUserBalance(username);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `user:balance:${username}`,
        dbBalance,
        3600 * 24,
      );
    });

    it('should throw an error if user is not found', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(transferService.getUserBalance(username)).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle zero balance correctly', async () => {
      const zeroBalance = 0;
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue({
        balance: zeroBalance,
      });

      const result = await transferService.getUserBalance(username);

      expect(result).toEqual(zeroBalance);
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

    it('should handle large page numbers correctly', async () => {
      const largePage = 1000;
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transfer.findMany.mockResolvedValue([]);

      await transferService.getTransfers(username, largePage, limit);

      expect(mockPrismaService.transfer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ sender: { username } }, { receiver: { username } }],
        },
        skip: 9990,
        take: 10,
      });
    });
  });
});
