import { Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { PriceServiceUSD } from '../Price.service.usd';
import { AuctionProvider } from '../auctions/auction.loader';

@Module({
  providers: [
    OrdersService,
    PriceServiceUSD,
    OrdersResolver,
    RedisCacheService,
    AuctionProvider,
  ],
  imports: [ElrondCommunicationModule, OrdersModuleDb, AccountsModuleGraph],
  exports: [OrdersService, RedisCacheService],
})
export class OrdersModuleGraph {}
