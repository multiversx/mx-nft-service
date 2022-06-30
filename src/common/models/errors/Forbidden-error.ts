import { ForbiddenException, HttpStatus } from '@nestjs/common';

export class ForbiddenError extends ForbiddenException {
  static fromError({ message }: Error) {
    return new ForbiddenError({
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });
  }
}
