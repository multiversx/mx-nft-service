import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { RabbitMqModule } from './modules/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    RabbitMqModule.register(),
  ],
  exports: [CommonModule],
})
export class RabbitMqProcessorModule {}
