import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from '.';
import { AssetHistoryFilter } from '../filtersTypes';
import { Account } from '../accounts/models';
import { AccountsProvider } from '../accounts/accounts.loader';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import PageResponse from '../PageResponse';
import { AssetHistoryResponse } from './models';
import ConnectionArgs, { HistoryPagination } from '../ConnectionArgs';

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
    const limit = pagination.first;
    const offset = pagination.after;
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      filters.identifier,
    );
    const historyLog = await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
      limit,
      offset,
    );

    console.log(limit, offset);
    return;
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

  // static mapResponse<T>(
  //   returnList: T[],
  //   args: ConnectionArgs,
  //   count: number,
  //   offset: number,
  //   limit: number,
  // ) {
  //   const page = connectionFromArraySlice(returnList, args, {
  //     arrayLength: count,
  //     sliceStart: offset || 0,
  //   });
  //   return {
  //     edges: page.edges,
  //     pageInfo: page.pageInfo,
  //     pageData: { count, limit, offset },
  //   };
  // }
}
