import { AccountStatsFilter } from '../accounts/models';
import { Query, Resolver, Args } from '@nestjs/graphql';
import { AccountStats } from './models/Account-Stats.dto';
import { AccountsStatsService } from './accounts-stats.service';

@Resolver(() => AccountStats)
export class AccountsStatsResolver {
  constructor(private accountsStatsService: AccountsStatsService) {}

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
