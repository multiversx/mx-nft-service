import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from '.';
import { AssetHistoryFilter } from '../filtersTypes';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AssetHistoryLogResponse } from './models';
import { HistoryEdge, HistoryPagination } from '../ConnectionArgs';
import { DateUtils } from 'src/utils/date-utils';

@Resolver(() => AssetHistoryLogResponse)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(private assetsHistoryService: AssetsHistoryService) {
    super();
  }

  @Query(() => AssetHistoryLogResponse)
  async assetHistory(
    @Args({ name: 'filters', type: () => AssetHistoryFilter })
    filters,
    @Args({ name: 'pagination', type: () => HistoryPagination, nullable: true })
    pagination: HistoryPagination,
  ): Promise<AssetHistoryLogResponse> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      filters.identifier,
    );
    let [historyLog] = [[], 0];
    await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
      pagination.first,
      pagination.timestamp,
      historyLog,
    );

    return this.mapResponse(
      historyLog || [],
      pagination.timestamp,
      pagination.first,
    );
  }

  private mapResponse(
    returnList: AssetHistoryLog[],
    offset: number,
    limit: number,
  ) {
    const startTimestamp = offset
      ? offset
      : returnList.length > 0
      ? returnList[0]?.actionDate
      : DateUtils.getCurrentTimestamp();

    return {
      edges: returnList?.map(
        (elem) =>
          new HistoryEdge<AssetHistoryLog>({
            cursor: elem.actionDate.toString(),
            node: elem,
          }),
      ),
      pageInfo: {
        startCursor: returnList[0]?.actionDate,
        endCursor: returnList[returnList.length - 1]?.actionDate,
        hasNextPage: returnList?.length === limit,
      },
      pageData: { count: returnList?.length, limit, offset: startTimestamp },
    };
  }
}
