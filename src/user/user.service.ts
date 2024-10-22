import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './schema';
import * as bcrypt from 'bcryptjs';
import { CreateUserDTO } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async registerUser(body: CreateUserDTO) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const createdUser = await this.prisma.user.create({
      data: {
        username: body.username.toLowerCase(),
        passwordHash: hashedPassword,
      },
    });
    delete createdUser.passwordHash;
    return createdUser;
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    delete user.passwordHash;

    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new Error('User not found');
    }
    delete user.passwordHash;

    return user;
  }
}
