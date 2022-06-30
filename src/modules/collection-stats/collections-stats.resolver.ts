import {
  Query,
  Resolver,
  Args,
  ResolveField,
  Int,
  Parent,
} from '@nestjs/graphql';
import { CollectionsStatsService } from './collections-stats.service';
import { CollectionStats } from './models';
import { TrendingCollection } from './models/Collection-Trending.dto';
import { CollectionStatsFilter } from './models/Collection-Stats.Filter';
import { Price } from '../assets/models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { elrondConfig } from 'src/config';
import { DateUtils } from 'src/utils/date-utils';

@Resolver(() => CollectionStats)
export class CollectionsStatsResolver {
  constructor(private collectionsStatsService: CollectionsStatsService) {}

  @Query(() => CollectionStats)
  async collectionStats(
    @Args({ name: 'filters', type: () => CollectionStatsFilter })
    filters: CollectionStatsFilter,
  ): Promise<CollectionStats> {
    const collection = await this.collectionsStatsService.getStats(
      filters.identifier,
    );
    return CollectionStats.fromEntity(collection, filters?.identifier);
  }

  @ResolveField(() => Int)
  async items(@Parent() stats: CollectionStats) {
    const { identifier } = stats;
    const nftsCount = await this.collectionsStatsService.getItemsCount(
      identifier,
    );
    return nftsCount.value || 0;
  }

  @Query(() => [TrendingCollection])
  async trendingCollections(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<TrendingCollection[]> {
    return [
      new TrendingCollection({
        name: 'YOURSELF',
        identifier: 'YOURSELF-3df278',
        floarPrice: new Price({
          amount: '10000000000000000',
          timestamp: DateUtils.getCurrentTimestamp(),
          token: elrondConfig.egld,
          nonce: 0,
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/YOURSELF-3df278-350c6c6d',
      }),
      new TrendingCollection({
        name: 'EVIDENCE',
        identifier: 'EVIDENCE-2a8a14',
        floarPrice: new Price({
          amount: '10000000000000000',
          token: elrondConfig.egld,
          timestamp: DateUtils.getCurrentTimestamp(),
          nonce: 0,
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/EVIDENCE-2a8a14-06',
      }),
      new TrendingCollection({
        name: 'COL1',
        identifier: 'COL1-32b368',
        floarPrice: new Price({
          amount: '10000000000000000',
          timestamp: DateUtils.getCurrentTimestamp(),
          token: elrondConfig.egld,
          nonce: 0,
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/COL1-32b368-02',
      }),
      new TrendingCollection({
        name: 'YOURSELF',
        identifier: 'YOURSELF-3df278',
        floarPrice: new Price({
          amount: '10000000000000000',
          token: elrondConfig.egld,
          timestamp: DateUtils.getCurrentTimestamp(),
          nonce: 0,
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/YOURSELF-3df278-350c6c6d',
      }),
      new TrendingCollection({
        name: 'COL1',
        identifier: 'COL1-32b368',
        floarPrice: new Price({
          amount: '10000000000000000',
          token: elrondConfig.egld,
          timestamp: DateUtils.getCurrentTimestamp(),
          nonce: 0,
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/COL1-32b368-02',
      }),
      new TrendingCollection({
        name: 'COL1',
        identifier: 'COL1-32b368',
        floarPrice: new Price({
          amount: '10000000000000000',
          token: elrondConfig.egld,
          nonce: 0,
          timestamp: DateUtils.getCurrentTimestamp(),
        }),
        percentage: '30.3',
        verified: true,
        imageUrl:
          'https://devnet-media.elrond.com/nfts/thumbnail/COL1-32b368-02',
      }),
    ];
  }
}
