import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { IpfsModule } from '../ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsLikesService } from './assets-likes.service';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import { AssetsHistoryResolver } from './assets-history.resolver';
import { AssetsHistoryService } from './assets-history.service';
import { S3Service } from '../s3/s3.service';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { PriceServiceUSD } from '../Price.service.usd';
import { AssetLikesProvider } from './asset-likes-count.loader';
import { AssetAuctionsCountProvider } from './asset-auctions-count.loader';

@Module({
  providers: [
    AssetsService,
    AssetsLikesService,
    AssetLikesProvider,
    AssetsHistoryService,
    AssetAuctionsCountProvider,
    AssetsResolver,
    AssetsHistoryResolver,
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
  ],
})
export class AssetsModuleGraph {}
