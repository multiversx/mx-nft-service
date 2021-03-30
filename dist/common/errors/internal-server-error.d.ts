import { InternalServerErrorException } from '@nestjs/common';
import { Error } from './error';
export declare class InternalServerError extends InternalServerErrorException {
    static fromError({ message, error }: Error): InternalServerError;
}
