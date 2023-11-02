import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AuctionsRepository } from 'src/db/auctions/auctions.repository';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';
import { FeaturedCollectionsRepository, FeaturedNftsRepository } from 'src/db/featuredNfts/featured.repository';
import { MarketplaceCollectionsRepository } from 'src/db/marketplaces/marketplace-collections.repository';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
import { NotificationEntity, NotificationsRepository } from 'src/db/notifications';
import { OfferEntity, OffersRepository } from 'src/db/offers';
import { OrderEntity, OrdersRepository } from 'src/db/orders';
import { ReportNftsRepository } from 'src/db/reports/report-nft.repository';
import { CacheEventsPublisherModule } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { PersistenceService } from './persistence.service';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { MxCommunicationModule } from '../services/mx-communication';
import { MarketplaceEventsRepository } from 'src/db/marketplaces/marketplace-events.repository';
import { BlacklistedCollectionsRepository } from 'src/db/blacklistedCollections/blacklisted.repository';
import { ReportCollectionEntity, ReportCollectionsRepository, ReportNftEntity } from 'src/db/reports';
import { AssetLikeEntity, AssetsLikesRepository } from 'src/db/assets';
import { BlacklistedCollectionEntity } from 'src/db/blacklistedCollections';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { CampaignEntity } from 'src/db/campaigns';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { FeaturedCollectionEntity, FeaturedNftEntity } from 'src/db/featuredNfts';
import { MarketplaceCollectionEntity, MarketplaceEntity } from 'src/db/marketplaces';
import { NftFlagsEntity } from 'src/db/nftFlags';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { MinterEntity } from 'src/db/minters';
import { MintersRepository } from 'src/db/minters/minters.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetLikeEntity,
      FeaturedCollectionEntity,
      FeaturedNftEntity,
      BlacklistedCollectionEntity,
      TagEntity,
      CampaignEntity,
      TierEntity,
      MarketplaceEntity,
      MarketplaceCollectionEntity,
      ReportNftEntity,
      ReportCollectionEntity,
      NftFlagsEntity,
      NftRarityEntity,
      NotificationEntity,
      OrderEntity,
      AuctionEntity,
      OfferEntity,
      MarketplaceEventsEntity,
      MinterEntity,
    ]),
    CacheEventsPublisherModule,
    MxCommunicationModule,
  ],
  providers: [
    UsdPriceService,
    PersistenceService,
    AccountStatsRepository,
    CollectionStatsRepository,
    AuctionsRepository,
    OffersRepository,
    AssetsLikesRepository,
    BlacklistedCollectionsRepository,
    TiersRepository,
    CampaignsRepository,
    TagsRepository,
    FeaturedCollectionsRepository,
    FeaturedNftsRepository,
    MarketplaceRepository,
    MarketplaceCollectionsRepository,
    ReportNftsRepository,
    ReportCollectionsRepository,
    NftsFlagsRepository,
    NftRarityRepository,
    NotificationsRepository,
    OrdersRepository,
    MarketplaceEventsRepository,
    MintersRepository,
  ],
  exports: [PersistenceService, UsdPriceService],
})
export class PersistenceModule {}
