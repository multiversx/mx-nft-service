import { forwardRef, Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { OrdersService } from '../orders/order.service';
import { AuctionsForAssetProvider } from './asset-auctions.loader';
import { AssetsProvider } from '../assets/assets.loader';
import { PriceServiceUSD } from '../Price.service.usd';
import { UsdAmountResolver } from './usd-amount.resolver';
import { AuctionProvider } from './auction.loader';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    UsdAmountResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetProvider,
    AuctionProvider,
    AssetsProvider,
    PriceServiceUSD,
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
