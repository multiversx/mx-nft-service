import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import { Notification, NotificationStatusEnum } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { TimeConstants } from 'src/utils/time-utils';
import {
  NotificationEntity,
  NotificationsServiceDb,
} from 'src/db/notifications';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationTypeEnum } from './models/Notification-type.enum';
import { OrderEntity } from 'src/db/orders';
import { OrdersService } from '../orders/order.service';
import { AssetsGetterService } from '../assets';

@Injectable()
export class NotificationsService {
  private redisClient: Redis.Redis;
  constructor(
    private readonly notificationServiceDb: NotificationsServiceDb,
    private readonly ordersService: OrdersService,
    private readonly logger: Logger,
    private readonly assetsGetterService: AssetsGetterService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getNotifications(address: string): Promise<[Notification[], number]> {
    const cacheKey = this.getNotificationsCacheKey(address);
    const getNotifications = () => this.getMappedNotifications(address);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getNotifications,
      TimeConstants.oneDay,
    );
  }

  async generateNotifications(auctions: AuctionEntity[]): Promise<void> {
    await this.updateNotificationStatus(auctions?.map((a) => a.id));
    const orders = await this.ordersService.getOrdersByAuctionIds(
      auctions?.map((a) => a.id),
    );

    this.clearCache(auctions, orders);
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

  public async addNotifications(auction: AuctionEntity, order: OrderEntity) {
    try {
      const asset = await this.getAsset(auction.identifier);
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
          }),
          new NotificationEntity({
            auctionId: auction.id,
            identifier: auction.identifier,
            ownerAddress: order[0].ownerAddress,
            status: NotificationStatusEnum.Active,
            type: NotificationTypeEnum.Won,
            name: assetName,
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

  private async getAsset(identifier: string) {
    const { items } = await this.assetsGetterService.getAsset(identifier);
    if (items?.length > 0) return items[0];
    return undefined;
  }

  private clearCache(auctions: AuctionEntity[], orders: OrderEntity[]) {
    let addreses = auctions.map((a) => a.ownerAddress);
    for (const orderGroup in orders) {
      addreses = [...addreses, orders[orderGroup][0].ownerAddress];
    }
    const uniqueAddresses = [...new Set(addreses)];
    this.redisCacheService.delMultiple(
      this.redisClient,
      uniqueAddresses.map((a) => this.getNotificationsCacheKey(a)),
    );
  }

  private getNotificationsCacheKey(address: string) {
    return generateCacheKeyFromParams('notifications', address);
  }

  public async invalidateCache(ownerAddress: string = ''): Promise<void> {
    return this.redisCacheService.del(
      this.redisClient,
      this.getNotificationsCacheKey(ownerAddress),
    );
  }
}
