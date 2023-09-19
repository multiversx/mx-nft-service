import { Query, Resolver, Args, ResolveField, Int, Parent } from '@nestjs/graphql';
import { mxConfig } from 'src/config';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { CollectionsStatsService } from './collections-stats.service';
import { CollectionStats } from './models';
import { CollectionStatsFilter } from './models/Collection-Stats.Filter';

@Resolver(() => CollectionStats)
export class CollectionsStatsResolver {
  constructor(private collectionsStatsService: CollectionsStatsService, private usdPriceService: UsdPriceService) {}

  @Query(() => CollectionStats)
  async collectionStats(
    @Args({ name: 'filters', type: () => CollectionStatsFilter })
    filters: CollectionStatsFilter,
  ): Promise<CollectionStats> {
    let decimals = mxConfig.decimals;
    const collection = await this.collectionsStatsService.getStats(filters.identifier, filters.marketplaceKey, filters.paymentToken);
    if (filters.paymentToken) {
      const paymentToken = await this.usdPriceService.getToken(filters.paymentToken);
      decimals = paymentToken?.decimals ?? mxConfig.decimals;
    }
    return CollectionStats.fromEntity(collection, decimals, filters?.identifier);
  }

  @ResolveField(() => Int)
  async items(@Parent() stats: CollectionStats) {
    const { identifier } = stats;
    const nftsCount = await this.collectionsStatsService.getItemsCount(identifier);
    return nftsCount.value || 0;
  }
}
