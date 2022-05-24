import {
  Query,
  Resolver,
  Args,
  ResolveField,
  Int,
  Parent,
} from '@nestjs/graphql';
import { AccountStats } from './models/Account-Stats.dto';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountStatsFilter } from './models/Account-Stats.Filter';

@Resolver(() => AccountStats)
export class AccountsStatsResolver {
  constructor(private accountsStatsService: AccountsStatsService) {}

  @Query(() => AccountStats)
  async accountStats(
    @Args({ name: 'filters', type: () => AccountStatsFilter })
    filters,
  ): Promise<AccountStats> {
    const account = await this.accountsStatsService.getStats(
      filters?.address,
      filters?.isOwner,
    );
    console.log(AccountStats.fromEntity(account[0], filters?.address));
    return AccountStats.fromEntity(account[0], filters?.address);
  }

  @ResolveField(() => Int)
  async claimable(@Parent() stats: AccountStats) {
    const { address } = stats;
    const claimableCount = await this.accountsStatsService.getClaimableCount(
      address,
    );
    return claimableCount || 0;
  }

  @ResolveField(() => Int)
  async collected(@Parent() stats: AccountStats) {
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCollectedCount(
      address,
    );
    return collectedCount || 0;
  }

  @ResolveField(() => Int)
  async collections(@Parent() stats: AccountStats) {
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCollectionsCount(
      address,
    );
    return collectedCount || 0;
  }

  @ResolveField(() => Int)
  async creations(@Parent() stats: AccountStats) {
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCreationsCount(
      address,
    );
    return collectedCount || 0;
  }
}
