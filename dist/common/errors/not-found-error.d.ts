import { NotFoundException } from '@nestjs/common';
import { Error } from './error';
export declare class NotFoundError extends NotFoundException {
    static fromError({ message, error }: Error): NotFoundError;
}
