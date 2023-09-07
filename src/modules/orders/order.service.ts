import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { OrderEntity } from 'src/db/orders';
import { CreateOrderArgs, Order, OrderStatusEnum } from './models';
import { QueryRequest } from '../common/filters/QueryRequest';
import { NotificationEntity } from 'src/db/notifications';
import { NotificationTypeEnum } from '../notifications/models/Notification-type.enum';
import { NotificationStatusEnum } from '../notifications/models';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { OrdersCachingService } from './caching/orders-caching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { mxConfig } from 'src/config';

@Injectable()
export class OrdersService {
  constructor(
    private persistenceService: PersistenceService,
    private readonly logger: Logger,
    private ordersCachingService: OrdersCachingService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private assetByIdentifierService: AssetByIdentifierService,
    private usdPriceService: UsdPriceService,
    private readonly rabbitPublisherService: CacheEventsPublisherService,
  ) {}

  async getActiveOrderForAuction(auctionId: number): Promise<OrderEntity> {
    return await this.persistenceService.getActiveOrderForAuction(auctionId);
  }

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<OrderEntity> {
    try {
      const activeOrder = await this.persistenceService.getActiveOrderForAuction(createOrderArgs.auctionId);
      await this.triggerCacheInvalidation(createOrderArgs.auctionId, createOrderArgs.ownerAddress, createOrderArgs.marketplaceKey);

      const paymentToken = await this.usdPriceService.getToken(createOrderArgs.priceToken);
      const orderEntity = await this.persistenceService.saveOrder(CreateOrderArgs.toEntity(createOrderArgs, paymentToken?.decimals));
      if (orderEntity && activeOrder) {
        await this.handleNotifications(createOrderArgs, activeOrder);
        await this.persistenceService.updateOrderWithStatus(activeOrder, OrderStatusEnum.Inactive);
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

  async updateAuctionOrders(createOrderArgs: CreateOrderArgs, activeOrder: OrderEntity): Promise<OrderEntity> {
    try {
      await this.triggerCacheInvalidation(createOrderArgs.auctionId, createOrderArgs.ownerAddress, createOrderArgs.marketplaceKey);
      const paymentToken = await this.usdPriceService.getToken(createOrderArgs.priceToken);
      const orderEntity = await this.persistenceService.saveOrder(
        CreateOrderArgs.toEntity(createOrderArgs, paymentToken?.decimals ?? mxConfig.decimals),
      );
      if (orderEntity && activeOrder) {
        await this.handleNotifications(createOrderArgs, activeOrder);
        await this.persistenceService.updateOrderWithStatus(activeOrder, OrderStatusEnum.Inactive);
      }
      return orderEntity;
    } catch (error) {
      this.logger.error('An error occurred while creating an order', {
        path: 'OrdersService.updateAuctionOrders',
        createOrderArgs,
        exception: error,
      });
    }
  }

  private async handleNotifications(createOrderArgs: CreateOrderArgs, activeOrder: OrderEntity) {
    this.notificationsService.updateNotification(createOrderArgs.auctionId, createOrderArgs.ownerAddress);
    await this.addNotification(createOrderArgs, activeOrder);
  }

  private async addNotification(createOrderArgs: CreateOrderArgs, activeOrder: OrderEntity) {
    const auction = await this.persistenceService.getAuction(createOrderArgs.auctionId);
    const asset = await this.assetByIdentifierService.getAsset(auction.identifier);
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

  async updateOrder(auctionId: number, status: OrderStatusEnum): Promise<OrderEntity> {
    try {
      const activeOrder = await this.persistenceService.getActiveOrderForAuction(auctionId);

      if (!activeOrder) return;
      await this.triggerCacheInvalidation(auctionId, activeOrder.ownerAddress, activeOrder.marketplaceKey);
      const orderEntity = await this.persistenceService.updateOrderWithStatus(activeOrder, status);

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
      await this.triggerCacheInvalidation(createOrderArgs.auctionId, createOrderArgs.ownerAddress, createOrderArgs.marketplaceKey);

      const paymentToken = await this.usdPriceService.getToken(createOrderArgs.priceToken);
      const orderEntity = await this.persistenceService.saveOrder(CreateOrderArgs.toEntity(createOrderArgs, paymentToken?.decimals));
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
      return this.persistenceService.rollbackOrdersByHash(hash);
    } catch (error) {
      this.logger.error('An error occurred while creating an order', {
        path: 'OrdersService.rollbackOrdersByHash',
        hash,
        exception: error,
      });
    }
  }

  async getOrders(queryRequest: QueryRequest): Promise<[Order[], number]> {
    return this.ordersCachingService.getOrSetOrders(queryRequest, () => this.getMappedOrders(queryRequest));
  }

  async getOrdersByAuctionIds(auctionIds: number[]): Promise<OrderEntity[]> {
    if (auctionIds?.length > 0) {
      const orders = await this.persistenceService.getOrdersByAuctionIds(auctionIds);
      return orders;
    }
  }

  private async getMappedOrders(queryRequest: QueryRequest) {
    const [ordersEntities, count] = await this.persistenceService.getOrders(queryRequest);

    return [ordersEntities.map((order) => Order.fromEntity(order)), count];
  }

  private async triggerCacheInvalidation(auctionId: number, ownerAddress: string, marketplaceKey: string) {
    await this.rabbitPublisherService.publish(
      new ChangedEvent({
        id: auctionId.toString(),
        type: CacheEventTypeEnum.UpdateOrder,
        address: ownerAddress,
        extraInfo: { marketplaceKey: marketplaceKey },
      }),
    );
  }
}
