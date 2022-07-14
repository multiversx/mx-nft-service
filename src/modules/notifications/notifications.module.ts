import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { NotificationsModuleDb } from 'src/db/notifications/notifications.module.db';
import { CommonModule } from 'src/common.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [NotificationsService, NotificationsResolver],
  imports: [
    ElrondCommunicationModule,
    CommonModule,
    forwardRef(() => NotificationsModuleDb),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => AssetsModuleGraph),
  ],
  exports: [NotificationsService],
})
export class NotificationsModuleGraph {}
