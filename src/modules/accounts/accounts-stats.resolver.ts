import { Account, AccountResponse, AccountStatsFilter } from './models';
import { Query, Resolver, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import ConnectionArgs from '../ConnectionArgs';
import { ElrondIdentityService } from 'src/common';
import PageResponse from '../PageResponse';
import { AccountStats } from './models/Account-Stats.dto';
import { AccountsStatsService } from './accounts-stats.service';

@Resolver(() => AccountStats)
export class AccountsStatsResolver {
  constructor(
    private accountsStatsService: AccountsStatsService,
    private identityService: ElrondIdentityService,
  ) {}

  @Query(() => AccountStats)
  async accountStats(
    @Args({ name: 'filters', type: () => AccountStatsFilter })
    filters,
  ): Promise<AccountStats> {
    const accounts = await this.accountsStatsService.getStats(
      filters?.addresses,
    );
    return new AccountStats();
  }
}
