import { forwardRef, Module } from '@nestjs/common';
import {
  AuctionsService,
  AuctionsForAssetProvider,
  AuctionProvider,
  NftMarketplaceAbiService,
} from '.';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { AssetsProvider } from '../assets';
import { PriceServiceUSD } from '../Price.service.usd';
import { UsdAmountResolver } from './usd-amount.resolver';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { AvailableTokensForAuctionProvider } from 'src/db/orders/available-tokens-auction.loader';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    UsdAmountResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetProvider,
    AvailableTokensForAuctionProvider,
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
    AvailableTokensForAuctionProvider,
  ],
})
export class AuctionsModuleGraph {}
