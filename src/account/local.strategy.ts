import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UtilService } from '../util/util.service';
import { AccountService } from './account.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private accountService: AccountService,
    private utilService: UtilService,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.accountService.validateUser(
      this.utilService.trimAndLowerCase(username),
      password,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
