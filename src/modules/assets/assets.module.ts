import { forwardRef, Module } from '@nestjs/common';
import { AssetsService, AssetsResolver, AssetsLikesService } from '.';
import { IpfsModule } from '../ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsLikesRepository } from 'src/db/assets';
import { S3Service } from '../s3/s3.service';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { AssetAuctionsCountProvider, AssetLikesProvider } from '.';
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

@Module({
  providers: [
    AssetsService,
    AssetsLikesService,
    VerifyContentService,
    ContentValidation,
    AssetLikesProvider,
    IsAssetLikedProvider,
    LowestAuctionProvider,
    AssetsSupplyLoader,
    AssetAuctionsCountProvider,
    AssetScamInfoProvider,
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
