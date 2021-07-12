import { HttpStatus, UnauthorizedException } from '@nestjs/common';

/**
 * Extension class for UnauthorizedException. We add the http status code too.
 */
export class UnauthorizedError extends UnauthorizedException {
  /**
   * Create a new object based on an Error received.
   * @param message
   */
  static fromError({ message }: Error) {
    return new UnauthorizedError({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}
