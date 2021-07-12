import { HttpStatus, UnauthorizedException } from '@nestjs/common';

export class UnauthorizedError extends UnauthorizedException {
  static fromError({ message }: Error) {
    return new UnauthorizedError({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}
