import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import { Notification, NotificationStatusEnum } from './models';
import {
  NotificationEntity,
  NotificationsServiceDb,
} from 'src/db/notifications';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationTypeEnum } from './models/Notification-type.enum';
import { OrderEntity } from 'src/db/orders';
import { OrdersService } from '../orders/order.service';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { NotificationsCachingService } from './notifications-caching.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationServiceDb: NotificationsServiceDb,
    private readonly ordersService: OrdersService,
    private readonly logger: Logger,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly notificationCachingService: NotificationsCachingService,
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
  }

  async updateNotificationStatus(auctionIds: number[]) {
    try {
      if (auctionIds && auctionIds.length > 0) {
        const notifications =
          await this.notificationServiceDb.getNotificationsByAuctionIds(
            auctionIds,
          );
        const inactiveNotifications = notifications.map((n) => {
          return {
            ...n,
            status: NotificationStatusEnum.Inactive,
            modifiedDate: new Date(new Date().toUTCString()),
          };
        });
        await this.notificationServiceDb.saveNotifications(
          inactiveNotifications,
        );
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
    await this.notificationServiceDb.saveNotifications(notifications);
  }

  private async getMappedNotifications(address: string) {
    const [notificationsEntities, count] =
      await this.notificationServiceDb.getNotificationsForAddress(address);

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
      await this.notificationServiceDb.getNotificationsForMarketplace(
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

  public async addNotifications(auction: AuctionEntity, order: OrderEntity) {
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
}
