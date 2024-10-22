import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Res,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDTO } from './dtos/user.dto';
import { ResponseService } from '../util/response.service';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private responseService: ResponseService,
  ) {}

  @Post('users')
  async register(@Res() res: Response, @Body() body: CreateUserDTO) {
    try {
      const user = await this.userService.registerUser(body);
      return this.responseService.json(
        res,
        201,
        'User created successfully',
        user,
      );
    } catch (error) {
      if (
        error.name === 'PrismaClientKnownRequestError' &&
        error.code === 'P2002'
      ) {
        return this.responseService.json(
          res,
          new ConflictException('Username already exists'),
        );
      }
      return this.responseService.json(res, error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/id/:id')
  async getUserById(@Param('id') id: number, @Res() res: Response) {
    try {
      const user = await this.userService.getUserById(Number(id));
      return this.responseService.json(
        res,
        200,
        'User details fetched successfully',
        user,
      );
    } catch (error) {
      return this.responseService.json(res, error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/username/:username')
  async getUserByUsername(
    @Param('username') username: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.getUserByUsername(
        username.toLowerCase(),
      );
      return this.responseService.json(
        res,
        200,
        'User details fetched successfully',
        user,
      );
    } catch (error) {
      return this.responseService.json(res, error);
    }
  }
}
