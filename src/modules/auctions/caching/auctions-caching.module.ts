import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AuctionsCachingService } from './auctions-caching.service';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { AuctionsForAssetRedisHandler } from '../loaders/asset-auctions.redis-handler';
import { LowestAuctionRedisHandler } from '../loaders/lowest-auctions.redis-handler';
import { AccountsStatsCachingService } from '../../account-stats/accounts-stats.caching.service';
import { AssetAuctionsCountRedisHandler } from '../../assets/loaders/asset-auctions-count.redis-handler';
import { AssetAvailableTokensCountRedisHandler } from '../../assets/loaders/asset-available-tokens-count.redis-handler';
import { OnSaleAssetsCountForCollectionRedisHandler } from '../../nftCollections/loaders/onsale-assets-count.redis-handler';

@Module({
  providers: [
    AuctionsCachingService,
    AuctionsForAssetRedisHandler,
    LowestAuctionRedisHandler,
    AssetAuctionsCountRedisHandler,
    OnSaleAssetsCountForCollectionRedisHandler,
    AssetAvailableTokensCountRedisHandler,
    AccountsStatsCachingService,
  ],
  imports: [CachingModule, CommonModule],
  exports: [
    AuctionsCachingService,
    AuctionsForAssetRedisHandler,
    LowestAuctionRedisHandler,
    AssetAuctionsCountRedisHandler,
    OnSaleAssetsCountForCollectionRedisHandler,
    AssetAvailableTokensCountRedisHandler,
    AccountsStatsCachingService,
  ],
})
export class AuctionsCachingModule {}
