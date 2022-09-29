import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import { Notification, NotificationStatusEnum } from './models';
import { NotificationEntity } from 'src/db/notifications';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationTypeEnum } from './models/Notification-type.enum';
import { OrderEntity } from 'src/db/orders';
import { OrdersService } from '../orders/order.service';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { NotificationsCachingService } from './notifications-caching.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/changed.event';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly persistenceService: PersistenceService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly logger: Logger,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly notificationCachingService: NotificationsCachingService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
  ) {}

  async getNotifications(
    address: string,
    marketplaceKey: string = undefined,
  ): Promise<[Notification[], number]> {
    if (marketplaceKey) {
      return this.notificationCachingService.getNotificationsForMarketplace(
        address,
        marketplaceKey,
        () => this.getNotificationsForMarketplace(address, marketplaceKey),
      );
    }
    return this.notificationCachingService.getAllNotifications(address, () =>
      this.getMappedNotifications(address),
    );
  }

  async generateNotifications(auctions: AuctionEntity[]): Promise<void> {
    await this.updateNotificationStatus(auctions?.map((a) => a.id));
    const orders = await this.ordersService.getOrdersByAuctionIds(
      auctions?.map((a) => a.id),
    );
    for (const auction of auctions) {
      this.addNotifications(auction, orders[auction.id]);
    }

    this.triggerClearCache(auctions, orders);
  }

  async updateNotificationStatus(auctionIds: number[]) {
    try {
      if (auctionIds && auctionIds.length > 0) {
        const notifications =
          await this.persistenceService.getNotificationsByAuctionIds(
            auctionIds,
          );
        const inactiveNotifications = notifications.map((n) => {
          return {
            ...n,
            status: NotificationStatusEnum.Inactive,
            modifiedDate: new Date(new Date().toUTCString()),
          };
        });
        if (inactiveNotifications?.length > 0) {
          await this.updateInactiveStatus(inactiveNotifications);
        }
      }
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to update notifications status.',
        {
          path: 'NotificationsService.updateNotificationStatus',
          exception: error?.toString(),
        },
      );
      return;
    }
  }

  async saveNotifications(notifications: NotificationEntity[]): Promise<void> {
    try {
      await this.persistenceService.saveNotifications(notifications);
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to update notifications status.',
        {
          path: 'NotificationsService.saveNotifications',
          exception: error?.toString(),
        },
      );
    }
  }

  async saveNotification(notification: NotificationEntity): Promise<void> {
    try {
      await this.persistenceService.saveNotification(notification);
      await this.publishClearNotificationEvent(
        notification.ownerAddress,
        notification.marketplaceKey,
      );
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to save notifications status.',
        {
          path: 'NotificationsService.saveNotification',
          exception: error?.toString(),
        },
      );
    }
  }

  async getNotificationByIdAndOwner(
    auctionId: number,
    ownerAddress: string,
  ): Promise<NotificationEntity> {
    try {
      return await this.persistenceService.getNotificationByIdAndOwner(
        auctionId,
        ownerAddress,
      );
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to get a notification.',
        {
          path: 'NotificationsService.getNotificationByIdAndOwner',
          auctionId,
          ownerAddress,
          exception: error?.toString(),
        },
      );
    }
  }

  async updateNotification(auctionId: number, ownerAddress: string) {
    try {
      const notification = await this.getNotificationByIdAndOwner(
        auctionId,
        ownerAddress,
      );
      if (notification) {
        await this.publishClearNotificationEvent(
          notification.ownerAddress,
          notification.marketplaceKey,
        );
        return await this.persistenceService.updateNotification(notification);
      }
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to update notifications status.',
        {
          path: 'NotificationsService.updateNotification',
          exception: error?.toString(),
        },
      );
    }
  }

  private async updateInactiveStatus(
    inactiveNotifications: NotificationEntity[],
  ) {
    await this.persistenceService.saveNotifications(inactiveNotifications);
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: inactiveNotifications?.map((n) => n.ownerAddress),
        type: CacheEventTypeEnum.UpdateNotifications,
        extraInfo: { marketplaceKey: inactiveNotifications[0].marketplaceKey },
      }),
    );
  }

  private async getMappedNotifications(address: string) {
    const [notificationsEntities, count] =
      await this.persistenceService.getNotificationsForAddress(address);

    return [
      notificationsEntities.map((notification) =>
        Notification.fromEntity(notification),
      ),
      count,
    ];
  }

  private async getNotificationsForMarketplace(
    address: string,
    marketplaceKey: string,
  ) {
    const [notificationsEntities, count] =
      await this.persistenceService.getNotificationsForMarketplace(
        address,
        marketplaceKey,
      );

    return [
      notificationsEntities.map((notification) =>
        Notification.fromEntity(notification),
      ),
      count,
    ];
  }

  private async addNotifications(auction: AuctionEntity, order: OrderEntity) {
    try {
      const asset = await this.assetByIdentifierService.getAsset(
        auction.identifier,
      );
      const assetName = asset ? asset.name : '';
      if (order) {
        this.saveNotifications([
          new NotificationEntity({
            auctionId: auction.id,
            identifier: auction.identifier,
            ownerAddress: auction.ownerAddress,
            status: NotificationStatusEnum.Active,
            type: NotificationTypeEnum.Ended,
            name: assetName,
            marketplaceKey: auction.marketplaceKey,
          }),
          new NotificationEntity({
            auctionId: auction.id,
            identifier: auction.identifier,
            ownerAddress: order[0].ownerAddress,
            status: NotificationStatusEnum.Active,
            type: NotificationTypeEnum.Won,
            name: assetName,
            marketplaceKey: auction.marketplaceKey,
          }),
        ]);
      } else {
        this.saveNotifications([
          new NotificationEntity({
            auctionId: auction.id,
            identifier: auction.identifier,
            ownerAddress: auction.ownerAddress,
            status: NotificationStatusEnum.Active,
            type: NotificationTypeEnum.Ended,
            name: assetName,
            marketplaceKey: auction.marketplaceKey,
          }),
        ]);
      }
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to save notifications for users.',
        {
          path: 'NotificationsService.addNotifications',
          exception: error?.toString(),
          auction: auction?.ownerAddress,
          order: order?.ownerAddress,
        },
      );
    }
  }

  private triggerClearCache(auctions: AuctionEntity[], orders: OrderEntity[]) {
    if (!auctions?.length && !orders?.length) return;
    let addreses = auctions.map((a) => a.ownerAddress);
    for (const orderGroup in orders) {
      addreses = [...addreses, orders[orderGroup][0].ownerAddress];
    }
    const uniqueAddresses = [...new Set(addreses)];
    this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: uniqueAddresses,
        type: CacheEventTypeEnum.UpdateNotifications,
        extraInfo: { marketplaceKey: auctions[0].marketplaceKey },
      }),
    );
  }

  private async publishClearNotificationEvent(
    id: string,
    marketplaceKey: string,
  ) {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: id,
        type: CacheEventTypeEnum.UpdateOneNotification,
        extraInfo: { marketplaceKey: marketplaceKey },
      }),
    );
  }
}
