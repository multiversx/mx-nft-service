import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetAvailableTokensCountRedisHandler } from './asset-available-tokens-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAvailableTokensCountProvider extends BaseProvider<string> {
  constructor(
    assetsAvailableRedisHandler: AssetAvailableTokensCountRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      assetsAvailableRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const availableTokens =
      await this.auctionsServiceDb.getAvailableTokensForIdentifiers(
        identifiers,
      );
    return availableTokens?.groupBy(
      (auction: { identifier: any }) => auction.identifier,
    );
  }
}
