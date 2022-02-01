import { forwardRef, Module } from '@nestjs/common';
import {
  AssetsService,
  AssetsResolver,
  AssetsLikesService,
  AssetAuctionsCountProvider,
  AssetAuctionsCountRedisHandler,
} from '.';
import { IpfsModule } from '../ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsLikesRepository } from 'src/db/assets';
import { S3Service } from '../s3/s3.service';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetAvailableTokensCountProvider } from './asset-available-tokens-count.loader';
import { AssetsSupplyLoader } from './assets-supply.loader';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { IsAssetLikedProvider } from './asset-is-liked.loader';
import { ContentValidation } from './content.validation.service';
import { AssetAuctionResolver } from './asset-auction.resolver';
import { LowestAuctionProvider } from '../auctions/lowest-auctions.loader';
import { VerifyContentService } from './verify-content.service';
import { AssetAvailableTokensCountRedisHandler } from './asset-available-tokens-count.redis-handler';
import { IsAssetLikedRedisHandler } from './asset-is-liked.redis-handler';
import { AssetLikesProvider } from './asset-likes-count.loader';
import { AssetLikesProviderRedisHandler } from './asset-likes-count.redis-handler';
import { LowestAuctionRedisHandler } from '../auctions/lowest-auctions.redis-handler';
import { AssetsSupplyRedisHandler } from './assets-supply.redis-handler';
import { AssetScamInfoRedisHandler } from './assets-scam-info.redis-handler';

@Module({
  providers: [
    AssetsService,
    AssetsLikesService,
    VerifyContentService,
    ContentValidation,
    AssetLikesProviderRedisHandler,
    AssetLikesProvider,
    IsAssetLikedRedisHandler,
    IsAssetLikedProvider,
    LowestAuctionRedisHandler,
    LowestAuctionProvider,
    AssetsSupplyRedisHandler,
    AssetsSupplyLoader,
    AssetAuctionsCountRedisHandler,
    AssetAuctionsCountProvider,
    AssetScamInfoRedisHandler,
    AssetScamInfoProvider,
    AssetAvailableTokensCountRedisHandler,
    AssetAvailableTokensCountProvider,
    AssetsResolver,
    AssetAuctionResolver,
    RedisCacheService,
    S3Service,
  ],
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => AccountsModuleGraph),
    forwardRef(() => AuctionsModuleDb),
    forwardRef(() => AuctionsModuleGraph),
    IpfsModule,
    TypeOrmModule.forFeature([AssetsLikesRepository]),
  ],
  exports: [
    AssetsService,
    AssetsLikesService,
    RedisCacheService,
    S3Service,
    AssetLikesProvider,
    AssetsSupplyLoader,
    AssetScamInfoProvider,
  ],
})
export class AssetsModuleGraph {}
