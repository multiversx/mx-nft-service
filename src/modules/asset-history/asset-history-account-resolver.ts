import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog as AssetHistoryLog } from './models';
import { Account } from '../accounts/models/Account.dto';
import { AccountsProvider } from '../accounts/accounts.loader';

@Resolver(() => AssetHistoryLog)
export class AssetHistoryAccountResolver extends BaseResolver(AssetHistoryLog) {
  constructor(private accountsProvider: AccountsProvider) {
    super();
  }

  @ResolveField('account', () => Account)
  async account(@Parent() asset: AssetHistoryLog) {
    const { address } = asset;

    if (!address) return null;
    const account = await this.accountsProvider.getAccountByAddress(address);
    return Account.fromEntity(account);
  }

  @ResolveField('senderAccount', () => Account, { nullable: true })
  async senderAccount(@Parent() asset: AssetHistoryLog) {
    const { senderAddress } = asset;

    if (!senderAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      senderAddress,
    );
    return Account.fromEntity(account);
  }
}
