import { IsString, IsNotEmpty, IsPositive } from 'class-validator';

export class TransferDTO {
  senderUsername?: string;

  @IsString()
  @IsNotEmpty()
  receiverUsername: string;

  @IsPositive()
  amount: number;
}
