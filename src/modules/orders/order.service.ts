import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrderEntity, OrdersServiceDb } from 'src/db/orders';
import { CreateOrderArgs, Order, OrderStatusEnum } from './models';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { QueryRequest } from '../common/filters/QueryRequest';
import { NotificationEntity } from 'src/db/notifications';
import { NotificationTypeEnum } from '../notifications/models/Notification-type.enum';
import { NotificationStatusEnum } from '../notifications/models';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/owner-changed.event';
import { OrdersCachingService } from './caching/orders-caching.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private orderServiceDb: OrdersServiceDb,
    private auctionsService: AuctionsServiceDb,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private ordersCachingService: OrdersCachingService,
    private notificationsService: NotificationsService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly rabbitPublisherService: CacheEventsPublisherService,
  ) {}

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<OrderEntity> {
    try {
      const activeOrder = await this.orderServiceDb.getActiveOrderForAuction(
        createOrderArgs.auctionId,
      );

      await this.triggerCacheInvalidation(
        createOrderArgs.auctionId,
        createOrderArgs.ownerAddress,
      );
      const orderEntity = await this.orderServiceDb.saveOrder(
        CreateOrderArgs.toEntity(createOrderArgs),
      );
      if (orderEntity && activeOrder) {
        await this.handleNotifications(createOrderArgs, activeOrder);
        await this.orderServiceDb.updateOrder(activeOrder);
      }
      return orderEntity;
    } catch (error) {
      this.logger.error('An error occurred while creating an order', {
        path: 'OrdersService.createOrder',
        createOrderArgs,
        exception: error,
      });
    }
  }

  private async handleNotifications(
    createOrderArgs: CreateOrderArgs,
    activeOrder: OrderEntity,
  ) {
    const notification =
      await this.notificationsService.getNotificationByIdAndOwner(
        createOrderArgs.auctionId,
        createOrderArgs.ownerAddress,
      );
    this.notificationsService.updateNotification(notification);
    await this.addNotification(createOrderArgs, activeOrder);
  }

  private async addNotification(
    createOrderArgs: CreateOrderArgs,
    activeOrder: OrderEntity,
  ) {
    const auction = await this.auctionsService.getAuction(
      createOrderArgs.auctionId,
    );
    const asset = await this.assetByIdentifierService.getAsset(
      auction.identifier,
    );
    const assetName = asset ? asset.name : '';
    await this.notificationsService.saveNotification(
      new NotificationEntity({
        auctionId: createOrderArgs.auctionId,
        ownerAddress: activeOrder.ownerAddress,
        type: NotificationTypeEnum.Outbidded,
        status: NotificationStatusEnum.Active,
        identifier: auction?.identifier,
        name: assetName,
        marketplaceKey: createOrderArgs.marketplaceKey,
      }),
    );
  }

  async updateOrder(
    auctionId: number,
    status: OrderStatusEnum,
  ): Promise<OrderEntity> {
    try {
      const activeOrder = await this.orderServiceDb.getActiveOrderForAuction(
        auctionId,
      );

      await this.triggerCacheInvalidation(auctionId, activeOrder.ownerAddress);
      const orderEntity = await this.orderServiceDb.updateOrderWithStatus(
        activeOrder,
        status,
      );

      return orderEntity;
    } catch (error) {
      this.logger.error('An error occurred while updating order for auction', {
        path: 'OrdersService.updateOrder',
        auctionId,
        exception: error,
      });
    }
  }

  async createOrderForSft(createOrderArgs: CreateOrderArgs): Promise<Order> {
    try {
      await this.triggerCacheInvalidation(
        createOrderArgs.auctionId,
        createOrderArgs.ownerAddress,
      );
      const orderEntity = await this.orderServiceDb.saveOrder(
        CreateOrderArgs.toEntity(createOrderArgs),
      );
      return Order.fromEntity(orderEntity);
    } catch (error) {
      this.logger.error('An error occurred while creating an order', {
        path: 'OrdersService.createOrderForSft',
        createOrderArgs,
        exception: error,
      });
    }
  }

  async rollbackOrdersByHash(hash: string): Promise<any> {
    try {
      return this.orderServiceDb.rollbackOrdersByHash(hash);
    } catch (error) {
      this.logger.error('An error occurred while creating an order', {
        path: 'OrdersService.rollbackOrdersByHash',
        hash,
        exception: error,
      });
    }
  }

  async getOrders(queryRequest: QueryRequest): Promise<[Order[], number]> {
    return this.ordersCachingService.getOrSetOrders(queryRequest, () =>
      this.getMappedOrders(queryRequest),
    );
  }

  async getOrdersByAuctionIds(auctionIds: number[]): Promise<OrderEntity[]> {
    if (auctionIds?.length > 0) {
      const orders = await this.orderServiceDb.getOrdersByAuctionIds(
        auctionIds,
      );
      return orders;
    }
  }

  private async getMappedOrders(queryRequest: QueryRequest) {
    const [ordersEntities, count] = await this.orderServiceDb.getOrders(
      queryRequest,
    );

    return [ordersEntities.map((order) => Order.fromEntity(order)), count];
  }

  private async triggerCacheInvalidation(
    auctionId: number,
    ownerAddress: string,
  ) {
    await this.rabbitPublisherService.publish(
      new ChangedEvent({
        id: auctionId.toString(),
        type: CacheEventTypeEnum.UpdateOrder,
        ownerAddress: ownerAddress,
      }),
    );
  }
}
