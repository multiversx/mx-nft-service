import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AccessErrors } from 'src/common/models/errors/AccessErrorsEnum';
import { UnauthorizedError } from 'src/common/models/errors/unauthorized-error';
import { ForbiddenError } from 'src/common/models/errors/forbidden-error';

@Injectable()
export class GqlAdminAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return super.canActivate(new ExecutionContextHost([req]));
  }

  handleRequest(err: any, user: any, info: any) {
    const admins: string[] = process.env.ADMINS.split(',').map((entry) => {
      return entry.toLowerCase().trim();
    });

    if (!err && !!user) {
      if (admins.includes(user.publicKey)) {
        return user;
      } else {
        throw ForbiddenError.fromError({
          name: 'Forbidden Error',
          message: AccessErrors.forbidden,
        });
      }
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
