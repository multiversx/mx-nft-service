import { HttpStatus, NotImplementedException } from '@nestjs/common';
import { Error } from './error';

/**
 * Extension class for NotImplementedException. We add the http status code too.
 */
export class NotImplementedError extends NotImplementedException {
  /**
   * Create a new object based on an Error received.
   * @param message
   * @param error
   */
  static fromError({ message, error }: Error) {
    return new NotImplementedError({
      message,
      error,
      statusCode: HttpStatus.NOT_IMPLEMENTED,
    });
  }
}
