import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from './assets-history.service';

@Resolver(() => AssetHistoryLog)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(private assetsHistoryService: AssetsHistoryService) {
    super();
  }

  @Query(() => [AssetHistoryLog])
  async assetHistory(
    @Args({ name: 'collection', type: () => String })
    collection,
    @Args({ name: 'nonce', type: () => Int }) nonce,
  ): Promise<AssetHistoryLog[]> {
    const historyLog = await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
    );

    return historyLog;
  }
}
