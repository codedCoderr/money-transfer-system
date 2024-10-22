import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AccountService', () => {
  let accountService: AccountService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    accountService = module.get<AccountService>(AccountService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const username = 'testuser';
    const password = 'password123';
    const hashedPassword = 'hashedPassword123';

    it('should return user when credentials are valid', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: hashedPassword,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await accountService.validateUser(username, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await accountService.validateUser(username, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: hashedPassword,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await accountService.validateUser(username, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBeNull();
    });

    it('should handle database query errors', async () => {
      const error = new Error('Database query failed');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(
        accountService.validateUser(username, password),
      ).rejects.toThrow('Database query failed');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare errors', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: hashedPassword,
      };
      const error = new Error('Bcrypt compare failed');

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(
        accountService.validateUser(username, password),
      ).rejects.toThrow('Bcrypt compare failed');
    });

    it('should work with empty password', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: hashedPassword,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await accountService.validateUser(username, '');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('', hashedPassword);
      expect(result).toBeNull();
    });

    it('should work with very long passwords', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: hashedPassword,
      };
      const longPassword = 'a'.repeat(1000);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await accountService.validateUser(username, longPassword);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, hashedPassword);
      expect(result).toEqual(user);
    });

    it('should be case-sensitive for usernames', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await accountService.validateUser('TestUser', password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'TestUser' },
      });
      expect(result).toBeNull();
    });
  });
});
