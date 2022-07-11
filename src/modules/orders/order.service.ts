import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrderEntity, OrdersServiceDb } from 'src/db/orders';
import { CreateOrderArgs, Order, OrderStatusEnum } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { cacheConfig } from 'src/config';
import { AccountsStatsService } from '../account-stats/accounts-stats.service';
import { QueryRequest } from '../common/filters/QueryRequest';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from './loaders/last-order.redis-handler';
import { TimeConstants } from 'src/utils/time-utils';
import {
  NotificationEntity,
  NotificationsServiceDb,
} from 'src/db/notifications';
import { NotificationTypeEnum } from '../notifications/models/Notification-type.enum';
import { NotificationStatusEnum } from '../notifications/models';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { AssetsService } from '../assets';
const hash = require('object-hash');

@Injectable()
export class OrdersService {
  private redisClient: Redis.Redis;
  constructor(
    private orderServiceDb: OrdersServiceDb,
    private lastOrderRedisHandler: LastOrderRedisHandler,
    private accountStats: AccountsStatsService,
    private auctionsService: AuctionsServiceDb,
    private auctionAvailableTokens: AvailableTokensForAuctionRedisHandler,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private notificationsService: NotificationsServiceDb,
    private apiService: ElrondApiService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.ordersRedisClientName,
    );
  }

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<OrderEntity> {
    try {
      const activeOrder = await this.orderServiceDb.getActiveOrderForAuction(
        createOrderArgs.auctionId,
      );

      await this.invalidateCache(
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
    const notifications =
      await this.notificationsService.getNotificationByIdAndOwner(
        createOrderArgs.auctionId,
        createOrderArgs.ownerAddress,
      );
    this.notificationsService.updateNotification(notifications);
    await this.addNotification(createOrderArgs, activeOrder);
  }

  private async addNotification(
    createOrderArgs: CreateOrderArgs,
    activeOrder: OrderEntity,
  ) {
    const auction = await this.auctionsService.getAuction(
      createOrderArgs.auctionId,
    );
    const asset = await this.apiService.getNftByIdentifier(auction.identifier);
    const assetName = asset ? asset.name : '';
    await this.notificationsService.saveNotification(
      new NotificationEntity({
        auctionId: createOrderArgs.auctionId,
        ownerAddress: activeOrder.ownerAddress,
        type: NotificationTypeEnum.Outbidded,
        status: NotificationStatusEnum.Active,
        identifier: auction?.identifier,
        name: assetName,
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

      await this.invalidateCache(auctionId, activeOrder.ownerAddress);
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
      await this.invalidateCache(
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
      await this.invalidateCache();

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
    const cacheKey = this.getAuctionsCacheKey(queryRequest);
    const getOrders = () => this.getMappedOrders(queryRequest);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getOrders,
      TimeConstants.oneDay,
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

  private getAuctionsCacheKey(request: QueryRequest) {
    return generateCacheKeyFromParams('orders', hash(request));
  }

  private async invalidateCache(
    auctionId: number = 0,
    ownerAddress: string = '',
  ): Promise<void> {
    await this.lastOrderRedisHandler.clearKey(auctionId);
    await this.auctionAvailableTokens.clearKey(auctionId);
    await this.accountStats.invalidateStats(ownerAddress);
    return this.redisCacheService.flushDb(this.redisClient);
  }
}
