import { NotImplementedException } from '@nestjs/common';
import { Error } from './error';
export declare class NotImplementedError extends NotImplementedException {
    static fromError({ message, error }: Error): NotImplementedError;
}
