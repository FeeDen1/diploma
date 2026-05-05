import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception';
import { TokenPayload } from '../interfaces/token-payload.interface';

type AuthenticatedRequest = Request & { user?: TokenPayload };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Нет доступа');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Нет доступа');
    }

    return true;
  }
}
