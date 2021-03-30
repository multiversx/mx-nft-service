import { ErdResponseCode } from '../../enums/erd-response-code';
export interface ElrondResponse<T> {
    data: T;
    error: string;
    code: ErdResponseCode;
}
