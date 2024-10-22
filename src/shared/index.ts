import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Role } from '../account/guards/role.enum';

export const Roles = (...roles: Role[]): any => SetMetadata('roles', roles);

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);
