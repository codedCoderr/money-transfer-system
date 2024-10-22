import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ResponseService } from '../util/response.service';
import { CreateUserDTO } from './dtos/user.dto';
import { Response } from 'express';
import { ConflictException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let responseService: ResponseService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            registerUser: jest.fn(),
            getUserById: jest.fn(),
            getUserByUsername: jest.fn(),
          },
        },
        {
          provide: ResponseService,
          useValue: {
            json: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  describe('register', () => {
    const createUserDto: CreateUserDTO = {
      username: 'testuser',
      password: 'password123',
    };

    it('should register a user successfully', async () => {
      const createdUser = {
        id: 1,
        ...createUserDto,
        passwordHash: 'hashedPassword',
        balance: 0,
        createdAt: new Date(),
      };
      jest.spyOn(userService, 'registerUser').mockResolvedValue(createdUser);

      await userController.register(mockResponse, createUserDto);

      expect(userService.registerUser).toHaveBeenCalledWith(createUserDto);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'User created successfully',
        createdUser,
      );
    });

    it('should handle username conflict', async () => {
      const error: any = new Error('Username already exists');
      error.name = 'PrismaClientKnownRequestError';
      error.code = 'P2002';
      jest.spyOn(userService, 'registerUser').mockRejectedValue(error);

      await userController.register(mockResponse, createUserDto);

      expect(userService.registerUser).toHaveBeenCalledWith(createUserDto);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        new ConflictException('Username already exists'),
      );
    });

    it('should handle other errors', async () => {
      const error = new Error('Unknown error');
      jest.spyOn(userService, 'registerUser').mockRejectedValue(error);

      await userController.register(mockResponse, createUserDto);

      expect(userService.registerUser).toHaveBeenCalledWith(createUserDto);
      expect(responseService.json).toHaveBeenCalledWith(mockResponse, error);
    });
  });

  describe('getUserById', () => {
    const userId = 1;

    it('should get user by id successfully', async () => {
      const user = {
        id: userId,
        username: 'testuser',
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(user);

      await userController.getUserById(userId, mockResponse);

      expect(userService.getUserById).toHaveBeenCalledWith(userId);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'User details fetched successfully',
        user,
      );
    });

    it('should handle errors when getting user by id', async () => {
      const error = new Error('User not found');
      jest.spyOn(userService, 'getUserById').mockRejectedValue(error);

      await userController.getUserById(userId, mockResponse);

      expect(userService.getUserById).toHaveBeenCalledWith(userId);
      expect(responseService.json).toHaveBeenCalledWith(mockResponse, error);
    });

    it('should convert string id to number', async () => {
      const user = {
        id: userId,
        username: 'testuser',
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(user);

      await userController.getUserById('1' as any, mockResponse);

      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserByUsername', () => {
    const username = 'testuser';

    it('should get user by username successfully', async () => {
      const user = {
        id: 1,
        username,
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(userService, 'getUserByUsername').mockResolvedValue(user);

      await userController.getUserByUsername(username, mockResponse);

      expect(userService.getUserByUsername).toHaveBeenCalledWith(
        username.toLowerCase(),
      );
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'User details fetched successfully',
        user,
      );
    });

    it('should handle errors when getting user by username', async () => {
      const error = new Error('User not found');
      jest.spyOn(userService, 'getUserByUsername').mockRejectedValue(error);

      await userController.getUserByUsername(username, mockResponse);

      expect(userService.getUserByUsername).toHaveBeenCalledWith(
        username.toLowerCase(),
      );
      expect(responseService.json).toHaveBeenCalledWith(mockResponse, error);
    });

    it('should convert username to lowercase', async () => {
      const user = {
        id: 1,
        username: username.toLowerCase(),
        passwordHash: 'hashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(userService, 'getUserByUsername').mockResolvedValue(user);

      await userController.getUserByUsername('TestUser', mockResponse);

      expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser');
    });
  });
});
