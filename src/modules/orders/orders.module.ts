import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module';

@Module({
  providers: [OrdersService, OrdersResolver],
  imports: [ElrondCommunicationModule, OrdersModuleDb],
  exports: [OrdersService],
})
export class OrdersModuleGraph {}
