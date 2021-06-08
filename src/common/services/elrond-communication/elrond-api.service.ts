import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { Token } from './models/interfaces/elrond/token.dto';

@Injectable()
export class ElrondApiService {
  private proxy: ApiProvider;
  constructor() {
    this.proxy = new ApiProvider(elrondConfig.elrondApi, 20000);
  }

  getService(): ApiProvider {
    return this.proxy;
  }

  async getTokensForUser(address: string): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/tokens`,
      (response) => response,
    );
  }

  async getNftByTokenIdentifier(
    address: string,
    tokenIdentifier: string,
    tokenNonce: number,
  ): Promise<Token> {
    const identifier = `${tokenIdentifier}-${this.nominateVal(tokenNonce)}`;
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsForUser(address: string): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts`,
      (response) => response,
    );
  }

  private nominateVal(value: number): string {
    let response = value.toString(16);
    if (response.length % 2 !== 0) {
      response = '0' + response;
    }
    return response;
  }
}
