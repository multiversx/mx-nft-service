import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import * as ormconfig from './ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMqModule } from './modules/rabbitmq/blockchain-events/rabbitmq.module';
import { DynamicModuleUtils } from './utils/dynamicModule-utils';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AuctionsModuleGraph,
    OrdersModuleGraph,
    RabbitMqModule.register(),
    DynamicModuleUtils.getCachingModule(),
  ],
  exports: [CommonModule],
})
export class RabbitMqProcessorModule {}
