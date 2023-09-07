import { Query, Resolver, Args, ResolveField, Int, Parent } from '@nestjs/graphql';
import { AccountStats } from './models/Account-Stats.dto';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountStatsFilter } from './models/Account-Stats.Filter';
import { Price } from '../assets/models';

@Resolver(() => AccountStats)
export class AccountsStatsResolver {
  constructor(private accountsStatsService: AccountsStatsService) {}

  @Query(() => AccountStats)
  async accountStats(
    @Args({ name: 'filters', type: () => AccountStatsFilter })
    filters: AccountStatsFilter,
  ): Promise<AccountStats> {
    const account = await this.accountsStatsService.getStats(filters?.address, filters?.isOwner, filters?.marketplaceKey);
    return AccountStats.fromEntity(account, filters?.address, filters?.marketplaceKey);
  }

  @ResolveField(() => Int)
  async claimable(@Parent() stats: AccountStats) {
    const { address, marketplaceKey } = stats;
    const claimableCount = await this.accountsStatsService.getClaimableCount(address, marketplaceKey);
    return claimableCount || 0;
  }

  @ResolveField(() => [Price])
  async biddings(@Parent() stats: AccountStats) {
    const { address, marketplaceKey } = stats;
    const biddings = await this.accountsStatsService.getBiddingBalance(address, marketplaceKey);
    return biddings;
  }

  @ResolveField(() => Int)
  async offers(@Parent() stats: AccountStats) {
    const { address, marketplaceKey } = stats;
    const offersCount = await this.accountsStatsService.getOffersCount(address, marketplaceKey);
    return offersCount || 0;
  }

  @ResolveField(() => Int)
  async likes(@Parent() stats: AccountStats) {
    const { address } = stats;
    const likesCount = await this.accountsStatsService.getLikesCount(address);
    return likesCount || 0;
  }

  @ResolveField(() => Int)
  async collected(@Parent() stats: AccountStats) {
    const { address, marketplaceKey } = stats;
    const collectedCount = await this.accountsStatsService.getCollectedCount(address, marketplaceKey);
    return collectedCount || 0;
  }

  @ResolveField(() => Int)
  async collections(@Parent() stats: AccountStats) {
    const { address } = stats;
    const collectionsCount = await this.accountsStatsService.getCollectionsCount(address);
    return collectionsCount || 0;
  }

  @ResolveField(() => Int)
  async creations(@Parent() stats: AccountStats) {
    const { address } = stats;
    const creationsCount = await this.accountsStatsService.getArtistCreationsInfo(address);
    return creationsCount?.nfts || 0;
  }
}
