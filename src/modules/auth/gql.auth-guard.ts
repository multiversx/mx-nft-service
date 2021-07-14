import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { UnauthorizedError } from 'src/models/errors/unauthorized-error';
import { AccessErrors } from 'src/models/errors/AccessErrorsEnum';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return super.canActivate(new ExecutionContextHost([req]));
  }

  handleRequest(err: any, user: any, info: any) {
    if (!err && !!user) {
      return user;
    }

    if (info?.name === 'TokenExpiredError') {
      throw UnauthorizedError.fromError({
        name: info.name,
        message: AccessErrors.tokenExpired,
      });
    }

    if (info?.name === 'JsonWebTokenError') {
      throw UnauthorizedError.fromError({
        name: info.name,
        message: AccessErrors.invalidToken,
      });
    }

    throw UnauthorizedError.fromError({
      message: 'You are not authorized to make this request',
      name: AccessErrors.notAuthorized,
    });
  }
}
