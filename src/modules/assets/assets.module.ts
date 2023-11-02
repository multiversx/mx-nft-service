import { forwardRef, Module } from '@nestjs/common';
import {
  AssetsTransactionService,
  AssetsGetterService,
  AssetsQueriesResolver,
  AssetsLikesService,
  AssetAuctionsCountProvider,
  AssetsRedisHandler,
  AssetsProvider,
} from '.';
import { IpfsModule } from '../ipfs/ipfs.module';
import { S3Service } from '../s3/s3.service';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { MxCommunicationModule } from 'src/common';
import { AssetAvailableTokensCountProvider } from './loaders/asset-available-tokens-count.loader';
import { AssetsSupplyLoader } from './loaders/assets-supply.loader';
import { AssetScamInfoProvider } from './loaders/assets-scam-info.loader';
import { IsAssetLikedProvider } from './loaders/asset-is-liked.loader';
import { ContentValidation } from './content.validation.service';
import { AssetAuctionResolver } from './asset-auction.resolver';
import { LowestAuctionProvider } from '../auctions/loaders/lowest-auctions.loader';
import { VerifyContentService } from './verify-content.service';
import { AssetAvailableTokensCountRedisHandler } from './loaders/asset-available-tokens-count.redis-handler';
import { IsAssetLikedRedisHandler } from './loaders/asset-is-liked.redis-handler';
import { AssetLikesProvider } from './loaders/asset-likes-count.loader';
import { AssetLikesProviderRedisHandler } from './loaders/asset-likes-count.redis-handler';
import { LowestAuctionRedisHandler } from '../auctions/loaders/lowest-auctions.redis-handler';
import { AssetsSupplyRedisHandler } from './loaders/assets-supply.redis-handler';
import { AssetScamInfoRedisHandler } from './loaders/assets-scam-info.redis-handler';
import { AssetAuctionsCountRedisHandler } from './loaders/asset-auctions-count.redis-handler';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AssetsMutationsResolver } from './assets-mutations.resolver';
import { AssetsViewsLoader } from './loaders/assets-views.loader';
import { AssetsViewsRedisHandler } from './loaders/assets-views.redis-handler';
import { FeaturedMarketplaceProvider } from '../auctions/loaders/featured-marketplace.loader';
import { FeaturedMarketplaceRedisHandler } from '../auctions/loaders/featured-marketplace.redis-handler';
import { AssetRarityInfoRedisHandler } from './loaders/assets-rarity-info.redis-handler';
import { AssetRarityInfoProvider } from './loaders/assets-rarity-info.loader';
import { CommonModule } from 'src/common.module';
import { AssetByIdentifierService } from './asset-by-identifier.service';
import { InternalMarketplaceProvider } from './loaders/internal-marketplace.loader';
import { InternalMarketplaceRedisHandler } from './loaders/internal-marketplace.redis-handler';
import { LowestAuctionForMarketplaceRedisHandler } from '../auctions/loaders/lowest-auctions-for-marketplace.redis-handler';
import { LowestAuctionForMarketplaceProvider } from '../auctions/loaders/lowest-auctions-for-marketplace.loader';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { ArtistAddressRedisHandler } from '../artists/artists.redis-handler';
import { SmartContractArtistsService } from '../artists/smart-contract-artist.service';
import { AssetsLikesCachingService } from './assets-likes.caching.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { NftTraitsElasticService } from '../nft-traits/nft-traits.elastic.service';
import { AuthModule } from '../auth/auth.module';
import { FeaturedModuleGraph } from '../featured/featured.module';
import { IsTicketProvider } from './loaders/asset-is-ticket.loader';
import { IsTicketRedisHandler } from './loaders/asset-is-ticket.redis-handler';

@Module({
  providers: [
    AssetsTransactionService,
    AssetsGetterService,
    AssetByIdentifierService,
    AssetsLikesService,
    AssetsLikesCachingService,
    VerifyContentService,
    ContentValidation,
    AssetLikesProviderRedisHandler,
    AssetLikesProvider,
    AssetsViewsLoader,
    AssetsViewsRedisHandler,
    IsAssetLikedRedisHandler,
    IsAssetLikedProvider,
    LowestAuctionRedisHandler,
    LowestAuctionProvider,
    LowestAuctionForMarketplaceRedisHandler,
    LowestAuctionForMarketplaceProvider,
    AssetsSupplyRedisHandler,
    AssetsSupplyLoader,
    AssetAuctionsCountRedisHandler,
    AssetAuctionsCountProvider,
    AssetScamInfoRedisHandler,
    AssetScamInfoProvider,
    AssetRarityInfoRedisHandler,
    AssetRarityInfoProvider,
    AssetAvailableTokensCountRedisHandler,
    AssetAvailableTokensCountProvider,
    AssetsQueriesResolver,
    AssetsMutationsResolver,
    AssetAuctionResolver,
    ArtistAddressProvider,
    ArtistAddressRedisHandler,
    SmartContractArtistsService,
    S3Service,
    AccountsProvider,
    AccountsRedisHandler,
    AccountsRedisHandler,
    AssetsRedisHandler,
    AssetsProvider,
    FeaturedMarketplaceProvider,
    FeaturedMarketplaceRedisHandler,
    InternalMarketplaceProvider,
    InternalMarketplaceRedisHandler,
    NftTraitsService,
    NftTraitsElasticService,
    IsTicketProvider,
    IsTicketRedisHandler,
  ],
  imports: [
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CollectionsModuleGraph),
    forwardRef(() => FeaturedModuleGraph),
    forwardRef(() => AuthModule),
    IpfsModule,
  ],
  exports: [
    AssetsTransactionService,
    AssetByIdentifierService,
    AssetsGetterService,
    AssetsLikesService,
    AssetsLikesCachingService,
    IsAssetLikedProvider,
    IsAssetLikedRedisHandler,
    S3Service,
    AssetLikesProvider,
    AssetsSupplyLoader,
    AssetScamInfoProvider,
    AssetsRedisHandler,
    AssetsProvider,
    IsTicketProvider,
    IsTicketRedisHandler,
  ],
})
export class AssetsModuleGraph {}
