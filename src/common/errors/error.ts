import { ApiProperty } from '@nestjs/swagger';
import { Generic } from './errors';

/**
 * Use this object for error infos. It will be used as an error response for APIs
 */

export class Error {
  /**
   * The error codes. It should be one from /utils/errors.ts
   */
  @ApiProperty({
    name: 'error',
    description: 'The error codes. It should be one from /utils/errors.ts',
    enum: { ...Generic },
  })
  error: string;
  /**
   * The message describing the error.
   */
  @ApiProperty({
    description: 'Message describing the error',
  })
  message: string;
}
