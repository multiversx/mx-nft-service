import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { Nft } from './models/nft.dto';

@Injectable()
export class ElrondApiService {
  private proxy: ApiProvider;
  constructor() {
    this.proxy = new ApiProvider(process.env.ELROND_API, { timeout: 10000 });
  }

  getService(): ApiProvider {
    return this.proxy;
  }

  async getTokensForUser(address: string): Promise<Nft[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/tokens`,
      (response) => response,
    );
  }

  async getNftByIdentifierAndAddress(
    address: string,
    identifier: string,
  ): Promise<Nft> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    return await this.getService().doGetGeneric(
      `nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsForUser(address: string, query: string = ''): Promise<Nft[]> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts${query}`,
      (response) => response,
    );
  }

  async getNftsForUserCount(
    address: string,
    query: string = '',
  ): Promise<number> {
    return await this.getService().doGetGeneric(
      `accounts/${address}/nfts/count${query}`,
      (response) => response,
    );
  }

  async getAllNfts(query: string = ''): Promise<Nft[]> {
    return await this.getService().doGetGeneric(
      `nfts${query}`,
      (response) => response,
    );
  }

  async getNftsCount(query: string = ''): Promise<number> {
    return await this.getService().doGetGeneric(
      `nfts/count${query}`,
      (response) => response,
    );
  }
}
