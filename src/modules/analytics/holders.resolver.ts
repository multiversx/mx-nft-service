import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { HoldersCount } from './models/general-stats.model';
import { Account } from '../account-stats/models';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';

@Resolver(() => HoldersCount)
export class HoldersResolver extends BaseResolver(HoldersCount) {
  constructor(private readonly accountsProvider: AccountsProvider) {
    super();
  }

  @ResolveField(() => Account)
  async accountDetails(@Parent() holders: HoldersCount) {
    const { address } = holders;

    if (!address) return null;
    const account = await this.accountsProvider.load(address);
    return Account.fromEntity(account?.value, address);
  }
}
