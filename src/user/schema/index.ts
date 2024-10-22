export class User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}
