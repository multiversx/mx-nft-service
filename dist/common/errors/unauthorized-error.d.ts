import { UnauthorizedException } from '@nestjs/common';
import { Error } from './error';
export declare class UnauthorizedError extends UnauthorizedException {
    static fromError({ message, error }: Error): UnauthorizedError;
}
