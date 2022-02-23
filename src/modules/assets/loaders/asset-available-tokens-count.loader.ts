import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { getAvailableTokensScriptsByIdentifiers } from 'src/db/auctions/sql.queries';
import { BaseProvider } from '../base.loader';
import { AssetAvailableTokensCountRedisHandler } from './asset-available-tokens-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAvailableTokensCountProvider extends BaseProvider<string> {
  constructor(
    assetsAvailableRedisHandler: AssetAvailableTokensCountRedisHandler,
  ) {
    super(
      assetsAvailableRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const availableTokens = await getRepository(AuctionEntity).query(
      getAvailableTokensScriptsByIdentifiers(identifiers),
    );

    return availableTokens?.groupBy((auction) => auction.identifier);
  }
}
