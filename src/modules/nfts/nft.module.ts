import { CacheModule, Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { NftService } from './nft.service';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { OrdersResolver } from './orders.resolver';
import { AuctionsResolver } from './auctions.resolver';

@Module({
  controllers: [NftController],
  providers: [
    NftService,
    AssetsService,
    AssetsResolver,
    OrdersResolver,
    AuctionsResolver,
  ],
  imports: [
    ElrondCommunicationModule,
    CacheManagerModule,
    CacheModule.register({
      ttl: 30, // default cache to 30 seconds. it will be overridden when needed
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [NftService, AssetsService],
})
export class NftModule {}
