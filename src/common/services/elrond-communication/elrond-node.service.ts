/**
 * Service used for Elrond node requests;
 */
import { Injectable } from '@nestjs/common';
import { HttpService } from './http.service';
import { elrondConfig } from 'config';
import { SignedElrondTransactionDTO } from './models/interfaces/elrond/elrond-transaction.dto';
import { ElrondResponse } from './models/interfaces/elrond/elrond-response';
import { ElrondTransactionOutput } from './models/interfaces/elrond/elrond-transaction-output';
import { ErdResponseCode } from './models/enums/erd-response-code';
import { InternalServerError } from '../../errors';
import { ErrorCodes } from '../../../utils';

@Injectable()
export class ElrondNodeService extends HttpService {
  /**
   * Set config to Elrond
   */
  config = elrondConfig.gateway;

  constructor() {
    super();
  }

  /**
   * Send a transaction.
   * @param signedData
   */
  async sendTransaction(signedData: string | SignedElrondTransactionDTO) {
    const response = await this.post<ElrondResponse<ElrondTransactionOutput>>(
      'transaction/send',
      signedData,
    );
    if (response.data?.code !== ErdResponseCode.successful) {
      throw InternalServerError.fromError({
        message: response.data.error,
        error: ErrorCodes.somethingWentWrong,
      });
    }

    return response.data.data;
  }
}
