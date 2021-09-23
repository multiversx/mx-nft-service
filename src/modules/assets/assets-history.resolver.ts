import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { AssetsHistoryService } from './assets-history.service';
import { AssetHistoryFilter } from '../filtersTypes';
import { getCollectionAndNonceFromIdentifier } from '../transactionsProcessor/helpers';
import { Account } from '../accounts/models';
import { AccountsProvider } from '../accounts/accounts.loader';

@Resolver(() => AssetHistoryLog)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(
    private assetsHistoryService: AssetsHistoryService,
    private accountsProvider: AccountsProvider,
  ) {
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

  @ResolveField('account', () => Account)
  async account(@Parent() asset: AssetHistoryLog) {
    const { address } = asset;

    if (!address) return null;
    const account = await this.accountsProvider.getAccountByAddress(address);
    return Account.fromEntity(account);
  }
}
