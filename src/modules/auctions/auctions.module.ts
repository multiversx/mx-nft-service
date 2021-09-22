import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AuctionsService } from './auctions.service';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { OrdersService } from '../orders/order.service';
import { OrdersModuleDb } from 'src/db/orders/orders.module';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { AuctionsProvider } from './asset-auctions.loader';
import { AssetsProvider } from '../assets/assets.loader';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsProvider,
    AssetsProvider,
  ],
  imports: [
    ElrondCommunicationModule,
    AuctionsModuleDb,
    forwardRef(() => AccountsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    OrdersModuleDb,
  ],
  exports: [
    AuctionsService,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsProvider,
  ],
})
export class AuctionsModuleGraph {}
