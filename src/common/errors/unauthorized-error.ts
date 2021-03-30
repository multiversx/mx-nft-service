import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Error } from './error';

/**
 * Extension class for UnauthorizedException. We add the http status code too.
 */
export class UnauthorizedError extends UnauthorizedException {
  /**
   * Create a new object based on an Error received.
   * @param message
   * @param error
   */
  static fromError({ message, error }: Error) {
    return new UnauthorizedError({
      message,
      error,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}
