import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetAvailableTokensCountRedisHandler } from './asset-available-tokens-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAvailableTokensCountProvider extends BaseProvider<string> {
  constructor(assetsAvailableRedisHandler: AssetAvailableTokensCountRedisHandler, private persistenceService: PersistenceService) {
    super(assetsAvailableRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const availableTokens = await this.persistenceService.getAvailableTokensForIdentifiers(identifiers);
    return availableTokens?.groupBy((auction: { identifier: any }) => auction.identifier);
  }
}
