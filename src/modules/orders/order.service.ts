import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrderEntity, OrdersServiceDb } from 'src/db/orders';
import { CreateOrderArgs, Order, OrderStatusEnum } from './models';
import { QueryRequest } from '../QueryRequest';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { cacheConfig } from 'src/config';
import { LastOrderRedisHandler } from 'src/db/orders/last-order.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from 'src/db/orders/available-tokens-auctions.redis-handler';
import { AccountsStatsService } from '../account-stats/accounts-stats.service';
const hash = require('object-hash');

@Injectable()
export class OrdersService {
  private redisClient: Redis.Redis;
  constructor(
    private orderServiceDb: OrdersServiceDb,
    private lastOrderRedisHandler: LastOrderRedisHandler,
    private accountStats: AccountsStatsService,
    private auctionAvailableTokens: AvailableTokensForAuctionRedisHandler,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.ordersRedisClientName,
    );
  }

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<OrderEntity> {
    try {
      await this.invalidateCache(createOrderArgs.auctionId);
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

  async getOrders(queryRequest: QueryRequest): Promise<[any[], number]> {
    // return await this.orderServiceDb.getOrders(queryRequest);
    const cacheKey = this.getAuctionsCacheKey(queryRequest);
    const getOrders = () => this.getMappedOrders(queryRequest);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getOrders,
      cacheConfig.ordersttl,
    );
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
