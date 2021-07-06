import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { nominateVal } from 'src/modules/formatters';
import { Token } from './models/token.dto';

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

  async getNftByTokenAndAddress(
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

  async getNftByToken(token: string, nonce: number): Promise<Token> {
    const identifier = `${token}-${nominateVal(nonce)}`;
    return await this.getService().doGetGeneric(
      `nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsForUser(address: string, query: string = ''): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts${query}`,
      (response) => response,
    );
  }

  async getTokensForUserCount(address: string): Promise<number> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/count`,
      (response) => response,
    );
  }

  async getAllNfts(query: string = ''): Promise<Token[]> {
    return await this.getService().doGetGeneric(
      `nfts${query}`,
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
