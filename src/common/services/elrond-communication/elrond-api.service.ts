import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { Token } from './models/interfaces/elrond/token.dto';
import { nominateVal } from 'src/modules/formatters';
import PaginationArgs from 'src/modules/PaginationArgs.dto';

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
    page: PaginationArgs,
  ): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts?from=${page.offset}&size=${page.size}`,
      (response) => response,
    );
  }

  async getAllNfts(from: number = 0, size: number = 50): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `nfts?from=${from}&size=${size}`,
      (response) => response,
    );
  }
}
