import { BadRequestException, HttpStatus } from '@nestjs/common';

export class BadRequestError extends BadRequestException {
  static fromError({ message }: Error) {
    return new BadRequestError({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
