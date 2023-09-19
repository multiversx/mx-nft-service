import { forwardRef, Logger, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { NotificationsCachingService } from './notifications-caching.service';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { AuthModule } from '../auth/auth.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';

@Module({
  providers: [Logger, NotificationsService, NotificationsCachingService, NotificationsResolver, AssetByIdentifierService],
  imports: [
    MxCommunicationModule,
    CacheEventsPublisherModule,
    CommonModule,
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => AuthModule),
  ],
  exports: [NotificationsService, AssetByIdentifierService, NotificationsCachingService],
})
export class NotificationsModuleGraph {}
