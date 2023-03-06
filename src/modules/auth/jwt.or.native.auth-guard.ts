import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ApiConfigService } from 'src/utils/api.config.service';
import { JwtAuthenticateGuard } from './jwt.auth-guard';
import { NativeAuthGuard } from './native.auth-guard';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.apiConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.apiConfigService);

    const guards = [jwtGuard, nativeAuthGuard];

    const canActivateResponses = await Promise.all(
      guards.map((guard) => {
        try {
          return guard.canActivate(context);
        } catch (error) {
          this.logger.error(`${JwtOrNativeAuthGuard.name}: `, error);
          return false;
        }
      }),
    );

    const canActivate = canActivateResponses.reduce(
      (result, value) => result || value,
      false,
    );
    return canActivate;
  }
}
