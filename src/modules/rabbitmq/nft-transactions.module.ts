import { forwardRef, Module } from '@nestjs/common';
import { NftTransactionsService } from './nft-transactions.service';
import { NftTransactionsConsumer } from './nft-transactions.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';

@Module({
  imports: [
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
  ],
  providers: [NftTransactionsConsumer, NftTransactionsService],
  exports: [NftTransactionsService],
})
export class NftTransactionsModule {}
