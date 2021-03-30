import { BadRequestException } from '@nestjs/common';
import { Error } from './error';
export declare class BadRequest extends BadRequestException {
    static fromError({ message, error }: Error): BadRequest;
}
