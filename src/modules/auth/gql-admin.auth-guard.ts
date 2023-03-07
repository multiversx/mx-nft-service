import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiConfigService } from '../common/api-config/api.config.service';

@Injectable()
export class GqlAdminAuthGuard implements CanActivate {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    let request = context.switchToHttp().getRequest();
    if (!request) {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    const auth = request.auth;
    const admins = this.apiConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    return admins.includes(auth.address);
  }
}
