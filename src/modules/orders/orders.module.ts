import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module';
import { RedisCacheModule } from 'src/common/services/redis-cache.module';

@Module({
  providers: [OrdersService, OrdersResolver],
  imports: [
    ElrondCommunicationModule,
    OrdersModuleDb,
    RedisCacheModule.register({
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: 2,
    }),
  ],
  exports: [OrdersService],
})
export class OrdersModuleGraph {}
