import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from '.';
import { AssetHistoryFilter } from '../filtersTypes';
import { Account } from '../accounts/models';
import { AccountsProvider } from '../accounts/accounts.loader';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AssetHistoryResponse } from './models';
import { HistoryPagination } from '../ConnectionArgs';
import { Edge } from 'graphql-relay';

@Resolver(() => AssetHistoryResponse)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(
    private assetsHistoryService: AssetsHistoryService,
    private accountsProvider: AccountsProvider,
  ) {
    super();
  }

  @Query(() => AssetHistoryResponse)
  async assetHistory(
    @Args({ name: 'filters', type: () => AssetHistoryFilter })
    filters,
    @Args({ name: 'pagination', type: () => HistoryPagination, nullable: true })
    pagination: HistoryPagination,
  ): Promise<AssetHistoryResponse> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      filters.identifier,
    );
    const [historyLog, count] = await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
      pagination.first,
      pagination.timestamp,
    );

    return AssetsHistoryResolver.mapResponse(
      historyLog || [],
      count,
      pagination.timestamp,
      pagination.first,
    );
  }

  @ResolveField('account', () => Account)
  async account(@Parent() asset: AssetHistoryLog) {
    const { address } = asset;

    if (!address) return null;
    const account = await this.accountsProvider.getAccountByAddress(address);
    return Account.fromEntity(account);
  }

  @ResolveField('senderAccount', () => Account)
  async senderAccount(@Parent() asset: AssetHistoryLog) {
    const { senderAddress } = asset;

    if (!senderAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      senderAddress,
    );
    return Account.fromEntity(account);
  }

  static mapResponse(
    returnList: AssetHistoryLog[],
    count: number,
    offset: number | string,
    limit: number,
  ) {
    return {
      edges: returnList?.map(
        (elem) =>
          new HistoryEdge<AssetHistoryLog>({
            cursor: elem.actionDate.toString(),
            node: elem,
          }),
      ),
      pageInfo: {
        startCursor: returnList[0].actionDate,
        endCursor: returnList[returnList.length - 1].actionDate,
        hasNextPage: returnList.length < count,
      },
      pageData: { count, limit, offset },
    };
  }
}

export class HistoryEdge<T> implements Edge<T> {
  node: T;
  cursor: string;

  constructor(init?: Partial<HistoryEdge<T>>) {
    Object.assign(this, init);
  }
}
