import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}

export type TUser = {
  id: number;

  firstName: string;

  lastName: string;

  email: string;

  passwordHash: string;
};
