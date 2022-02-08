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
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../user';
import { AccountStatsFilter } from './models/Account-Stats.Filter';

@Resolver(() => AccountStats)
export class AccountsStatsResolver {
  constructor(private accountsStatsService: AccountsStatsService) {}

  @Query(() => AccountStats)
  async accountStats(
    @Args({ name: 'filters', type: () => AccountStatsFilter })
    filters,
  ): Promise<AccountStats> {
    const account = await this.accountsStatsService.getStats(filters?.address);
    return account;
  }

  @UseGuards(GqlAuthGuard)
  @ResolveField('claimable', () => Int)
  async claimable(@Parent() stats: AccountStats, @User() user: any) {
    const { address } = stats;
    const claimableCount = await this.accountsStatsService.getClaimableCount(
      address,
    );
    return claimableCount ? claimableCount[0]?.claimable : 0;
  }

  @UseGuards(GqlAuthGuard)
  @ResolveField('collected', () => Int)
  async collected(@Parent() stats: AccountStats, @User() user: any) {
    console.log(user);
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCollectedCount(
      address,
    );
    return collectedCount || 0;
  }

  @UseGuards(GqlAuthGuard)
  @ResolveField('collections', () => Int)
  async creations(@Parent() stats: AccountStats, @User() user: any) {
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCollectionsCount(
      address,
    );
    return collectedCount || 0;
  }

  @UseGuards(GqlAuthGuard)
  @ResolveField('creations', () => Int)
  async collections(@Parent() stats: AccountStats) {
    const { address } = stats;
    const collectedCount = await this.accountsStatsService.getCollectedCount(
      address,
    );
    return collectedCount || 0;
  }
}
