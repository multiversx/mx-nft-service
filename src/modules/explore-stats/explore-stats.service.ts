import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { ExploreCollectionsStats, ExploreNftsStats, ExploreStats } from './models/Explore-Stats.dto';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AuctionsGetterService } from '../auctions';
import { buyNowAuctionRequest, runningAuctionRequest } from '../auctions/auctionsRequest';
import { OffersService } from '../offers/offers.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class ExploreStatsService {
  constructor(
    private cacheService: CacheService,
    private collectionsService: CollectionsGetterService,
    private auctionsService: AuctionsGetterService,
    private apiService: MxApiService,
    private offersService: OffersService,
  ) {}

  async getExploreStats(): Promise<ExploreStats> {
    const [, collections] = await this.collectionsService.getOrSetFullCollections();
    const nfts = await this.getOrSetTotalNftsCount();
    const [, artists] = await this.collectionsService.getOrSetMostActiveCollections();
    return new ExploreStats({ collections, nfts, artists });
  }

  async getExploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    const [collections, allCollectionsCount] = await this.collectionsService.getOrSetFullCollections();
    const verifiedCount = collections.filter((token) => token.verified === true).length;
    const [, activeLast30DaysCount] = await this.collectionsService.getActiveCollectionsFromLast30Days();
    return new ExploreCollectionsStats({
      allCollectionsCount,
      verifiedCount,
      activeLast30DaysCount,
    });
  }

  async getExploreNftsStats(): Promise<ExploreNftsStats> {
    const allNftsCount = await this.getOrSetTotalNftsCount();

    const [, buyNowCount] = await this.auctionsService.getAuctionsGroupByIdentifier(
      buyNowAuctionRequest(DateUtils.getCurrentTimestamp().toString()),
    );

    const [, liveAuctionsCount] = await this.auctionsService.getAuctionsGroupByIdentifier(
      runningAuctionRequest(DateUtils.getCurrentTimestamp().toString()),
    );
    const [, offersCount] = await this.offersService.getOffers();

    return new ExploreNftsStats({
      allNftsCount,
      buyNowCount,
      liveAuctionsCount,
      offersCount,
    });
  }

  async getOrSetTotalNftsCount(): Promise<number> {
    return await this.cacheService.getOrSet(
      CacheInfo.NftsCount.key,
      async () => await this.apiService.getNftsCount(),
      CacheInfo.NftsCount.ttl,
    );
  }
}
