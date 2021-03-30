import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Error } from './error';

/**
 * Extension class for BadRequestException. We add the http status code too.
 */
export class BadRequest extends BadRequestException {
  /**
   * Create a new object based on an Error received.
   * @param message
   * @param error
   */
  static fromError({ message, error }: Error) {
    return new BadRequest({
      message,
      error,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
