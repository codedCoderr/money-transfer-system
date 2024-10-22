export class Transfer {
  id: number;
  senderUsername: string;
  receiverUsername: string;
  amount: number;
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}
