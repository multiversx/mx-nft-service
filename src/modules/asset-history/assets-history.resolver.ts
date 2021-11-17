import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from '.';
import { AssetHistoryFilter } from '../filtersTypes';
import { Account } from '../accounts/models';
import { AccountsProvider } from '../accounts/accounts.loader';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { AssetHistoryResponse } from './models';

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
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetHistoryResponse> {
    const { limit, offset } = pagination.pagingParams();
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      filters.identifier,
    );
    const historyLog = await this.assetsHistoryService.getHistoryLog(
      collection,
      nonce,
      limit,
      offset,
    );

    console.log(limit, offset, historyLog);
    return PageResponse.mapResponse<AssetHistoryLog>(
      historyLog || [],
      pagination,
      historyLog?.length || 0,
      offset,
      limit,
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
}
