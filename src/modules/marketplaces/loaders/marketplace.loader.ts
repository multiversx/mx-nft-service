import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Logger, Scope } from '@nestjs/common';
import { MarketplaceRedisHandler } from './marketplace.redis-handler';
import { MarketplaceEntity } from 'src/db/marketplaces';

@Injectable({
  scope: Scope.REQUEST,
})
export class MarketplaceProvider extends BaseProvider<string> {
  constructor(
    redisHandler: MarketplaceRedisHandler,
    private readonly logger: Logger,
  ) {
    super(
      redisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(marketplaceKeys: string[]) {
    const marketplaces = await getRepository(MarketplaceEntity)
      .createQueryBuilder('marketplaces')
      .where('`key` IN(:...marketplaceKeys)', {
        marketplaceKeys: marketplaceKeys,
      })
      .getMany();
    return marketplaces?.groupBy((marketplace) => marketplace.key);
  }
}
