import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AccountService } from './account.service';
import { ResponseService } from '../util/response.service';

import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dtos';

@Controller('auth')
export class AccountController {
  constructor(
    private accountService: AccountService,
    private responseService: ResponseService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    try {
      const user = await this.accountService.validateUser(
        body.username.toLowerCase(),
        body.password,
      );
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const payload = {
        id: user.id,
        username: user.username.toLowerCase(),
      };

      const token = await this.jwtService.sign(payload);

      return this.responseService.json(res, 201, 'Login was successful', {
        token,
      });
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }
}
