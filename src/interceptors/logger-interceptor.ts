import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { catchError, tap } from 'rxjs/internal/operators';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  /**
   * Inject contextService so we can add relevant header info to the Winston logger
   * @param logger: winstonModule
   */
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Generic intercept method.
   * @param context
   * @param next
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    this.logger.defaultMeta = {
      tag: randomStringGenerator(),
    };

    return next.handle().pipe(
      tap(() =>
        setTimeout(() => {
          this.logHttp(context);
        }, 0),
      ),
      catchError(
        (err): Observable<any> => {
          if (!err.status || err.status === 500) {
            setTimeout(() => {
              this.logException(err, context);
            }, 0);
          }

          return throwError(err);
        },
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logHttp(context: ExecutionContext) {}

  logException(err: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    this.logger.error('HTTP_REQUEST', {
      method: request.method,
      url: request.url,
      route: request.route.path,
      user: request.user,
      network: request.networkHeader,
      response: response.statusCode,
      exception: err.toString(),
    });
  }
}
