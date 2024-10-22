import {
  Body,
  Controller,
  Post,
  UseGuards,
  Res,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import { Response } from 'express';

import { TransferService } from './transfer.service';
import { TransferDTO } from './dtos';
import { AuthGuard } from '@nestjs/passport';
import { ResponseService } from '../util/response.service';
import { CurrentUser } from '../shared';
import { User } from '../user/schema';

@Controller('transfers')
export class TransferController {
  constructor(
    private transferService: TransferService,
    private responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createTransfer(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() body: TransferDTO,
  ) {
    try {
      body.senderUsername = user.username.toLowerCase();
      const transfer = await this.transferService.transferMoney({
        ...body,
        receiverUsername: body.receiverUsername.toLowerCase(),
      });
      return this.responseService.json(
        res,
        200,
        'Money transferred successfully',
        transfer,
      );
    } catch (error) {
      return this.responseService.json(res, error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getTransfers(
    @Res() res: Response,
    @Query('username') username: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    try {
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

      const transfer = await this.transferService.getTransfers(
        username?.toLowerCase(),
        parsedPage,
        parsedLimit,
      );
      return this.responseService.json(
        res,
        200,
        'User transfers fetched successfully',
        transfer,
      );
    } catch (error) {
      return this.responseService.json(res, error);
    }
  }

  @Get('balance/:username')
  async getUserBalance(
    @Res() res: Response,
    @Param('username') username: string,
  ): Promise<void> {
    try {
      const lowercaseUsername = username ? username.toLowerCase() : username;
      const balance =
        await this.transferService.getUserBalance(lowercaseUsername);
      this.responseService.json(
        res,
        200,
        'Users balance fetched successfully',
        { balance },
      );
    } catch (error) {
      this.responseService.json(res, error);
    }
  }
}
