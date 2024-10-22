import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ResponseService } from '../util/response.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dtos';
import { Response } from 'express';

describe('AccountController', () => {
  let accountController: AccountController;
  let accountService: AccountService;
  let responseService: ResponseService;
  let jwtService: JwtService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
        {
          provide: ResponseService,
          useValue: {
            json: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    accountController = module.get<AccountController>(AccountController);
    accountService = module.get<AccountService>(AccountService);
    responseService = module.get<ResponseService>(ResponseService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDTO = {
      username: 'testuser',
      password: 'password123',
    };

    it('should login successfully and return a token', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        passwordHash: 'hashedPassword',
        balance: 0,
        createdAt: new Date(),
      };
      const token = 'jwt_token';

      jest.spyOn(accountService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockResolvedValue(token as never);

      await accountController.login(mockResponse, loginDto);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        loginDto.username.toLowerCase(),
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        username: user.username.toLowerCase(),
      });
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Login was successful',
        { token },
      );
    });

    it('should return 400 for invalid credentials', async () => {
      jest.spyOn(accountService, 'validateUser').mockResolvedValue(null);

      await accountController.login(mockResponse, loginDto);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        loginDto.username.toLowerCase(),
        loginDto.password,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
    });

    it('should handle errors during login', async () => {
      const error = new Error('Test error');
      jest.spyOn(accountService, 'validateUser').mockRejectedValue(error);

      await accountController.login(mockResponse, loginDto);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        loginDto.username.toLowerCase(),
        loginDto.password,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Test error' });
    });

    it('should convert username to lowercase', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        passwordHash: 'hashedPassword',
        balance: 0,
        createdAt: new Date(),
      };
      const token = 'jwt_token';

      jest.spyOn(accountService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockResolvedValue(token as never);

      await accountController.login(mockResponse, {
        ...loginDto,
        username: 'TestUser',
      });

      expect(accountService.validateUser).toHaveBeenCalledWith(
        'testuser',
        loginDto.password,
      );
    });

    it('should handle empty username', async () => {
      await accountController.login(mockResponse, {
        ...loginDto,
        username: '',
      });

      expect(accountService.validateUser).toHaveBeenCalledWith(
        '',
        loginDto.password,
      );
    });

    it('should handle empty password', async () => {
      await accountController.login(mockResponse, {
        ...loginDto,
        password: '',
      });

      expect(accountService.validateUser).toHaveBeenCalledWith(
        loginDto.username.toLowerCase(),
        '',
      );
    });

    it('should handle JWT sign errors', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        passwordHash: 'hashedPassword',
        balance: 0,
        createdAt: new Date(),
      };
      const error = new Error('JWT sign error');

      jest.spyOn(accountService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockRejectedValue(error as never);

      await accountController.login(mockResponse, loginDto);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        loginDto.username.toLowerCase(),
        loginDto.password,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: 'JWT sign error',
      });
    });

    it('should handle very long usernames and passwords', async () => {
      const longString = 'a'.repeat(1000);
      const longLoginDto: LoginDTO = {
        username: longString,
        password: longString,
      };

      jest.spyOn(accountService, 'validateUser').mockResolvedValue(null);

      await accountController.login(mockResponse, longLoginDto);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        longString.toLowerCase(),
        longString,
      );
    });
  });
});
