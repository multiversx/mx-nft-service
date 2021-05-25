import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';
import { AuctionsService } from './auctions.service';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { OrdersModuleGraph } from '../orders/orders.module';

@Module({
  providers: [AuctionsService, AuctionsResolver, NftMarketplaceAbiService],
  imports: [
    ElrondCommunicationModule,
    CacheManagerModule,
    AuctionsModuleDb,
    forwardRef(() => AccountsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    CacheModule.register({
      ttl: 30, // default cache to 30 seconds. it will be overridden when needed
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [AuctionsService, NftMarketplaceAbiService],
})
export class AuctionsModuleGraph {}
