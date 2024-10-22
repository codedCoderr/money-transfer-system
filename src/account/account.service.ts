import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }
    return user;
  }
}
