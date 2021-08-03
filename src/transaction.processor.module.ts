import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from './app.module';
import { ElrondCommunicationModule } from './common/services/elrond-communication/elrond-communication.module';
import { RedisCacheService } from './common/services/redis-cache.service';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { TransactionService } from './modules/transactionsProcessor/transactions.service';

@Module({
  imports: [
    AppModule,
    ElrondCommunicationModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
  ],
  providers: [TransactionService, RedisCacheService],
  exports: [TransactionService],
})
export class TransactionsProcessorModule {}
