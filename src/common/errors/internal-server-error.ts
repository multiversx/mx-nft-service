import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Error } from './error';

/**
 * Extension class for InternalServerErrorException. We add the http status code too.
 */
export class InternalServerError extends InternalServerErrorException {
  /**
   * Create a new object based on an Error received.
   * @param message
   * @param error
   */
  static fromError({ message, error }: Error) {
    return new InternalServerError({
      message,
      error,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
