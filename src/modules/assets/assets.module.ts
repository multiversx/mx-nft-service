import { forwardRef, Module } from '@nestjs/common';
import { AssetsService, AssetsResolver, AssetsLikesService } from '.';
import { IpfsModule } from '../ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsLikesRepository } from 'src/db/assets';
import { S3Service } from '../s3/s3.service';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { PriceServiceUSD } from '../Price.service.usd';
import { AssetAuctionsCountProvider, AssetLikesProvider } from '.';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetAvailableTokensCountProvider } from './asset-available-tokens-count.loader';
import { AssetsSupplyLoader } from './assets-supply.loader';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { IsAssetLikedProvider } from './asset-is-liked.loader';
import { VerifyContentService } from './verify-content.service';
import { ContentValidation } from './content.validation.service';

@Module({
  providers: [
    AssetsService,
    AssetsLikesService,
    VerifyContentService,
    ContentValidation,
    AssetLikesProvider,
    IsAssetLikedProvider,
    AssetsSupplyLoader,
    AssetAuctionsCountProvider,
    AssetScamInfoProvider,
    AssetAvailableTokensCountProvider,
    AssetsResolver,
    RedisCacheService,
    S3Service,
    PriceServiceUSD,
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
