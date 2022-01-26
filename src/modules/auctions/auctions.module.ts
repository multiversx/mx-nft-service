import { forwardRef, Module } from '@nestjs/common';
import {
  AuctionsService,
  AuctionProvider,
  NftMarketplaceAbiService,
  AuctionsOrdersProvider,
} from '.';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { AssetsProvider } from '../assets';
import { UsdAmountResolver } from './usd-amount.resolver';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { AuctionsForAssetProvider } from './asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
import { UsdPriceLoader } from './usd-price.loader';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    UsdAmountResolver,
    AuctionOrdersResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetProvider,
    AuctionsOrdersProvider,
    AuctionProvider,
    AssetsProvider,
    UsdPriceLoader,
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
    AuctionsForAssetProvider,
  ],
})
export class AuctionsModuleGraph {}
