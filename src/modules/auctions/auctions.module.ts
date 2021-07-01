import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AuctionsService } from './auctions.service';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RedisCacheModule } from 'src/common/services/redis-cache.module';
import { OrdersService } from '../orders/order.service';
import { OrdersModuleDb } from 'src/db/orders/orders.module';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    NftMarketplaceAbiService,
    OrdersService,
  ],
  imports: [
    ElrondCommunicationModule,
    AuctionsModuleDb,
    forwardRef(() => AccountsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    OrdersModuleDb,
    RedisCacheModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      db: 4,
    }),
  ],
  exports: [AuctionsService, NftMarketplaceAbiService, OrdersService],
})
export class AuctionsModuleGraph {}
