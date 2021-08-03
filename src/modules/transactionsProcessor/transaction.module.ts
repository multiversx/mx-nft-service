import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication/elrond-communication.module';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { TransactionService } from './transactions.service';

@Module({
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
  ],
  providers: [TransactionService, RedisCacheService],
  exports: [TransactionService],
})
export class TransactionModule {}
