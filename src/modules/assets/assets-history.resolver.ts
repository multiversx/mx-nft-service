import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from './assets-history.service';
import { AssetHistoryFilter } from '../filtersTypes';
import { getCollectionAndNonceFromIdentifier } from '../transactionsProcessor/helpers';

@Resolver(() => AssetHistoryLog)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(private assetsHistoryService: AssetsHistoryService) {
    super();
  }

  @Query(() => [AssetHistoryLog])
  async assetHistory(
    @Args({ name: 'filters', type: () => AssetHistoryFilter })
    filters,
  ): Promise<AssetHistoryLog[]> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      filters.identifier,
    );
    const historyLog = await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
    );

    return historyLog;
  }
}
