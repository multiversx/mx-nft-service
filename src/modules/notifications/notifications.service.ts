import { Address } from '@multiversx/sdk-core';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationEntity } from 'src/db/notifications';
import { OfferEntity } from 'src/db/offers';
import { OrderEntity } from 'src/db/orders';
import '../../utils/extensions';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { NftTypeEnum } from '../assets/models';
import { AuctionsGetterService } from '../auctions';
import { OrdersService } from '../orders/order.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { Notification, NotificationStatusEnum } from './models';
import { NotificationTypeEnum } from './models/Notification-type.enum';
import { NotificationsCachingService } from './notifications-caching.service';

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
    private readonly auctionsGetterService: AuctionsGetterService,
  ) {}

  async getNotifications(address: string, marketplaceKey: string = undefined): Promise<[Notification[], number]> {
    return this.notificationCachingService.getAllNotifications(`${address}_${marketplaceKey}`, () =>
      this.getMappedNotifications(address, marketplaceKey),
    );
  }

  async generateNotifications(auctions: AuctionEntity[]): Promise<void> {
    await this.updateNotificationStatus(auctions?.map((a) => a.id));
    const orders = await this.ordersService.getOrdersByAuctionIds(auctions?.map((a) => a.id));
    for (const auction of auctions) {
      this.addNotifications(auction, orders[auction.id]);
    }
    this.triggerClearCache(auctions, orders);
  }

  async updateNotificationStatus(auctionIds: number[]) {
    try {
      if (auctionIds && auctionIds.length > 0) {
        const notifications = await this.persistenceService.getNotificationsByAuctionIds(auctionIds);
        const inactiveNotifications = notifications?.map((n) => {
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
      this.logger.error('An error occurred while trying to update notifications status.', {
        path: 'NotificationsService.updateNotificationStatus',
        exception: error?.toString(),
      });
      return;
    }
  }

  async updateNotificationStatusForOffers(identifiers: string[]) {
    try {
      if (identifiers?.length > 0) {
        const notifications = await this.persistenceService.getNotificationsByIdentifiersAndType(identifiers, [
          NotificationTypeEnum.OfferReceived,
          NotificationTypeEnum.OfferExpired,
        ]);
        const inactiveNotifications = notifications?.map((n) => {
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
      this.logger.error('An error occurred while trying to update notifications status.', {
        path: this.updateNotificationStatusForOffers.name,
        exception: error?.toString(),
      });
      return;
    }
  }

  async generateOffersNotifications(offers: OfferEntity[]): Promise<void> {
    let notifications = [];
    for (const offer of offers) {
      const asset = await this.assetByIdentifierService.getAsset(offer.identifier);
      const assetName = asset ? asset.name : '';
      notifications.push(
        new NotificationEntity({
          auctionId: 0,
          identifier: offer.identifier,
          ownerAddress: offer.ownerAddress,
          status: NotificationStatusEnum.Active,
          type: NotificationTypeEnum.OfferExpired,
          name: assetName,
          marketplaceKey: offer.marketplaceKey,
        }),
      );
    }

    this.saveNotifications(notifications);
    this.triggerClearCacheForAccounts(
      offers.map((o) => o.ownerAddress),
      offers[0].marketplaceKey,
    );
  }

  async saveNotifications(notifications: NotificationEntity[]): Promise<void> {
    try {
      await this.persistenceService.saveNotifications(notifications);
      this.triggerClearCacheForAccounts(
        notifications?.map((n) => n.ownerAddress),
        notifications[0].marketplaceKey,
      );
    } catch (error) {
      this.logger.error('An error occurred while trying to update notifications status.', {
        path: 'NotificationsService.saveNotifications',
        exception: error?.toString(),
      });
    }
  }

  async saveNotification(notification: NotificationEntity): Promise<void> {
    try {
      await this.persistenceService.saveNotification(notification);
      await this.publishClearNotificationEvent(notification.ownerAddress, notification.marketplaceKey);
    } catch (error) {
      this.logger.error('An error occurred while trying to save notifications status.', {
        path: 'NotificationsService.saveNotification',
        exception: error?.toString(),
      });
    }
  }

  async getNotificationByIdAndOwner(auctionId: number, ownerAddress: string): Promise<NotificationEntity> {
    try {
      return await this.persistenceService.getNotificationByIdAndOwner(auctionId, ownerAddress);
    } catch (error) {
      this.logger.error('An error occurred while trying to get a notification.', {
        path: 'NotificationsService.getNotificationByIdAndOwner',
        auctionId,
        ownerAddress,
        exception: error?.toString(),
      });
    }
  }

  async updateNotification(auctionId: number, ownerAddress: string) {
    try {
      const notification = await this.getNotificationByIdAndOwner(auctionId, ownerAddress);
      if (notification) {
        await this.publishClearNotificationEvent(notification.ownerAddress, notification.marketplaceKey);
        return await this.persistenceService.updateNotification(notification);
      }
    } catch (error) {
      this.logger.error('An error occurred while trying to update notifications status.', {
        path: 'NotificationsService.updateNotification',
        exception: error?.toString(),
      });
    }
  }

  private async updateInactiveStatus(inactiveNotifications: NotificationEntity[]) {
    await this.persistenceService.saveNotifications(inactiveNotifications);
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: inactiveNotifications?.map((n) => n.ownerAddress),
        type: CacheEventTypeEnum.UpdateNotifications,
        extraInfo: { marketplaceKey: inactiveNotifications[0].marketplaceKey },
      }),
    );
  }

  private async getMappedNotifications(address: string, marketplaceKey: string) {
    const [notificationsEntities, count] = await this.persistenceService.getNotificationsForAddress(address, marketplaceKey);

    return [notificationsEntities.map((notification) => Notification.fromEntity(notification)), count];
  }

  public async addNotifications(auction: AuctionEntity, order: OrderEntity) {
    try {
      const asset = await this.assetByIdentifierService.getAsset(auction.identifier);
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
            ownerAddress: order.ownerAddress,
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
      this.logger.error('An error occurred while trying to save notifications for users.', {
        path: 'NotificationsService.addNotifications',
        exception: error?.toString(),
        auction: auction?.ownerAddress,
        order: order?.ownerAddress,
      });
    }
  }

  public async addNotificationForOffer(offer: OfferEntity) {
    try {
      const asset = await this.assetByIdentifierService.getAsset(offer.identifier);
      if (asset && asset.type !== NftTypeEnum.NonFungibleESDT) {
        return;
      }
      const assetName = asset ? asset.name : '';
      const address = new Address(asset.ownerAddress);
      if (!address.isSmartContract()) {
        this.saveNotifications([this.getOfferNotification(offer, asset.ownerAddress, assetName)]);
      } else {
        const auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(offer.identifier, offer.marketplaceKey);
        if (!auction) return;
        this.saveNotifications([this.getOfferNotification(offer, auction.ownerAddress, assetName, auction.id)]);
      }
    } catch (error) {
      this.logger.error('An error occurred while trying to save notifications for offers.', {
        path: this.addNotificationForOffer.name,
        exception: error?.toString(),
        order: offer?.ownerAddress,
      });
    }
  }

  private getOfferNotification(offer: OfferEntity, ownerAddress: string, assetName: string, auctionId: number = 0) {
    return new NotificationEntity({
      auctionId: auctionId,
      identifier: offer.identifier,
      ownerAddress: ownerAddress,
      status: NotificationStatusEnum.Active,
      type: NotificationTypeEnum.OfferReceived,
      name: assetName,
      marketplaceKey: offer.marketplaceKey,
    });
  }

  private triggerClearCache(auctions: AuctionEntity[], orders: OrderEntity[]) {
    if (!auctions?.length && !orders?.length) return;
    let addreses = auctions.map((a) => a.ownerAddress);
    for (const orderGroup in orders) {
      addreses = [...addreses, orders[orderGroup][0].ownerAddress];
    }
    const uniqueAddresses = [...new Set(addreses)];
    this.triggerClearCacheForAccounts(uniqueAddresses, auctions[0].marketplaceKey);
  }

  private triggerClearCacheForAccounts(accountAddresses: string[], marketplaceKey: string) {
    this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: accountAddresses,
        type: CacheEventTypeEnum.UpdateNotifications,
        extraInfo: { marketplaceKey: marketplaceKey },
      }),
    );
  }

  private async publishClearNotificationEvent(id: string, marketplaceKey: string) {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: id,
        type: CacheEventTypeEnum.UpdateOneNotification,
        extraInfo: { marketplaceKey: marketplaceKey },
      }),
    );
  }
}
