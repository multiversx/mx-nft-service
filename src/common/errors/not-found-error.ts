import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Error } from './error';

/**
 * Extension class for NotFoundException. We add the http status code too.
 */
export class NotFoundError extends NotFoundException {
  /**
   * Create a new object based on an Error received.
   * @param message
   * @param error
   */
  static fromError({ message, error }: Error) {
    return new NotFoundError({
      message,
      error,
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
