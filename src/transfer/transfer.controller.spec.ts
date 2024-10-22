import { Test, TestingModule } from '@nestjs/testing';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { ResponseService } from '../util/response.service';
import { TransferDTO } from './dtos';
import { Response } from 'express';
import { User } from '../user/schema';

describe('TransferController', () => {
  let transferController: TransferController;
  let transferService: TransferService;
  let responseService: ResponseService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: {
            transferMoney: jest.fn(),
            getTransfers: jest.fn(),
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

    transferController = module.get<TransferController>(TransferController);
    transferService = module.get<TransferService>(TransferService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  describe('createTransfer', () => {
    const transferDto: TransferDTO = {
      senderUsername: 'sender',
      receiverUsername: 'receiver',
      amount: 100,
    };

    it('should create a transfer successfully', async () => {
      const createdTransfer = { id: 1, ...transferDto };
      jest
        .spyOn(transferService, 'transferMoney')
        .mockResolvedValue(createdTransfer);

      await transferController.createTransfer(
        mockResponse,
        { username: 'SENDER' } as User,
        transferDto,
      );

      expect(transferService.transferMoney).toHaveBeenCalledWith({
        ...transferDto,
        senderUsername: 'sender',
        receiverUsername: 'receiver',
      });
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Money transferred successfully',
        createdTransfer,
      );
    });

    it('should handle errors during transfer creation', async () => {
      const error = new Error('Transfer failed');
      jest.spyOn(transferService, 'transferMoney').mockRejectedValue(error);

      await transferController.createTransfer(
        mockResponse,
        { username: 'sender' } as User,
        transferDto,
      );

      expect(transferService.transferMoney).toHaveBeenCalledWith({
        ...transferDto,
        senderUsername: 'sender',
        receiverUsername: 'receiver',
      });
      expect(responseService.json).toHaveBeenCalledWith(mockResponse, error);
    });

    it('should convert usernames to lowercase', async () => {
      const upperCaseDto: TransferDTO = {
        senderUsername: 'SENDER',
        receiverUsername: 'RECEIVER',
        amount: 100,
      };
      const createdTransfer = { id: 1, ...upperCaseDto };
      jest
        .spyOn(transferService, 'transferMoney')
        .mockResolvedValue(createdTransfer);

      await transferController.createTransfer(
        mockResponse,
        { username: 'SENDER' } as User,
        upperCaseDto,
      );

      expect(transferService.transferMoney).toHaveBeenCalledWith({
        senderUsername: 'sender',
        receiverUsername: 'receiver',
        amount: 100,
      });
    });
  });

  describe('getTransfers', () => {
    const username = 'testuser';
    const page = 1;
    const limit = 10;

    it('should fetch transfers successfully', async () => {
      const transfers = [
        {
          id: 1,
          senderUsername: username,
          receiverUsername: 'user2',
          amount: 50,
        },
        {
          id: 2,
          senderUsername: 'user3',
          receiverUsername: username,
          amount: 75,
        },
      ];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(
        mockResponse,
        username,
        page.toString(),
        limit.toString(),
      );

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        username,
        page,
        limit,
      );
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'User transfers fetched successfully',
        transfers,
      );
    });

    it('should use default page and limit values if not provided', async () => {
      const transfers = [];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(
        mockResponse,
        username,
        undefined,
        undefined,
      );

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        username,
        1,
        10,
      );
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'User transfers fetched successfully',
        transfers,
      );
    });

    it('should handle errors during transfer fetching', async () => {
      const error = new Error('Failed to fetch transfers');
      jest.spyOn(transferService, 'getTransfers').mockRejectedValue(error);

      await transferController.getTransfers(
        mockResponse,
        username,
        page.toString(),
        limit.toString(),
      );

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        username,
        page,
        limit,
      );
      expect(responseService.json).toHaveBeenCalledWith(mockResponse, error);
    });

    it('should handle invalid page and limit values', async () => {
      const transfers = [];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(mockResponse, username, '-1', '0');

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        username,
        1,
        10,
      );
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        200,
        'User transfers fetched successfully',
        transfers,
      );
    });

    it('should convert username to lowercase', async () => {
      const transfers = [];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(
        mockResponse,
        'TestUser',
        '1',
        '10',
      );

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        'testuser',
        1,
        10,
      );
    });

    it('should handle undefined username', async () => {
      const transfers = [];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(mockResponse, undefined, '1', '10');

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        undefined,
        1,
        10,
      );
    });

    it('should handle string values for page and limit', async () => {
      const transfers = [];
      jest.spyOn(transferService, 'getTransfers').mockResolvedValue(transfers);

      await transferController.getTransfers(
        mockResponse,
        username,
        '2' as any,
        '20' as any,
      );

      expect(transferService.getTransfers).toHaveBeenCalledWith(
        username,
        2,
        20,
      );
    });
  });
});
