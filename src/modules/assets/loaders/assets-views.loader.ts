import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetsViewsRedisHandler } from './assets-views.redis-handler';
import { MxStatsService } from 'src/common/services/mx-communication/mx-stats.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsViewsLoader extends BaseProvider<string> {
  constructor(assetsViewsRedisHandler: AssetsViewsRedisHandler, private statsService: MxStatsService) {
    super(assetsViewsRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const getViewsCountPromises = identifiers.map((identifier) => this.statsService.getNftsViewsCount(identifier));

    const viewsCountResponse = await Promise.all(getViewsCountPromises);
    return viewsCountResponse?.groupBy((item) => item.identifier);
  }
}
