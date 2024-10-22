import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dtos/user.dto';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const createUserDto: CreateUserDTO = {
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        username: createUserDto.username.toLowerCase(),
        passwordHash: hashedPassword,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await userService.registerUser(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: createUserDto.username.toLowerCase(),
          passwordHash: hashedPassword,
        },
      });
      expect(result).toEqual({
        id: 1,
        username: createUserDto.username.toLowerCase(),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should convert username to lowercase', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      await userService.registerUser({
        ...createUserDto,
        username: 'TestUser',
      });

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          passwordHash: hashedPassword,
        },
      });
    });

    it('should throw an error if bcrypt.hash fails', async () => {
      const error = new Error('Hashing failed');
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(userService.registerUser(createUserDto)).rejects.toThrow(
        'Hashing failed',
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw an error if user creation fails', async () => {
      const hashedPassword = 'hashedPassword123';
      const error = new Error('User creation failed');

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockRejectedValue(error);

      await expect(userService.registerUser(createUserDto)).rejects.toThrow(
        'User creation failed',
      );
    });
  });

  describe('getUserById', () => {
    const userId = 1;

    it('should return a user when found', async () => {
      const user = {
        id: userId,
        username: 'testuser',
        passwordHash: 'hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await userService.getUserById(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({ id: userId, username: 'testuser' });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw an error when user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if database query fails', async () => {
      const error = new Error('Database query failed');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('getUserByUsername', () => {
    const username = 'testuser';

    it('should return a user when found', async () => {
      const user = {
        id: 1,
        username: username,
        passwordHash: 'hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await userService.getUserByUsername(username);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toEqual({ id: 1, username: username });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw an error when user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserByUsername(username)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if database query fails', async () => {
      const error = new Error('Database query failed');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(userService.getUserByUsername(username)).rejects.toThrow(
        'Database query failed',
      );
    });

    it('should use the provided username without modification', async () => {
      const mixedCaseUsername = 'TestUser';
      const user = {
        id: 1,
        username: mixedCaseUsername,
        passwordHash: 'hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      await userService.getUserByUsername(mixedCaseUsername);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mixedCaseUsername },
      });
    });
  });
});
