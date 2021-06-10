import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { Token } from './models/interfaces/elrond/token.dto';
import { nominateVal } from 'src/modules/formatters';

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

  async getNftByToken(
    address: string,
    token: string,
    nonce: number,
  ): Promise<Token> {
    const identifier = `${token}-${nominateVal(nonce)}`;
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsForUser(
    address: string,
    from: number = 0,
    size: number = 50,
  ): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts?from=${from}&size=${size}`,
      (response) => response,
    );
  }

  async getTokensForUserCount(address: string): Promise<number> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/count`,
      (response) => response,
    );
  }

  async getAllNfts(from: number = 0, size: number = 50): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `nfts?from=${from}&size=${size}`,
      (response) => response,
    );
  }

  async getNftsCount(): Promise<number> {
    return await this.getService().doGetGeneric(
      'nfts/count',
      (response) => response,
    );
  }
}
