import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';
import { Token } from './models/interfaces/elrond/token.dto';
import { ErdTokenType } from './models/enums/erd-token-types';

@Injectable()
export class ElrondApiService {
  private proxy: ApiProvider;
  constructor() {
    this.proxy = new ApiProvider(elrondConfig.elrondApi, 10000);
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

  async getNftsForUser(address: string): Promise<Token[]> {
    const tokens = await this.getTokensForUser(address);
    return tokens.filter((tkn) => {
      return tkn.type === ErdTokenType.nonFungibleEsdt;
    });
  }
}
