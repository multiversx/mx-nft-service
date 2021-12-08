import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrderEntity, OrdersServiceDb } from 'src/db/orders';
import { CreateOrderArgs, Order } from './models';
import { QueryRequest } from '../QueryRequest';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { cacheConfig } from 'src/config';
const hash = require('object-hash');

@Injectable()
export class OrdersService {
  private redisClient: Redis.Redis;
  constructor(
    private orderServiceDb: OrdersServiceDb,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
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

      await this.invalidateCache();
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

  async createOrderForSft(createOrderArgs: CreateOrderArgs): Promise<Order> {
    try {
      await this.invalidateCache();
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

      return this.orderServiceDb.deleteOrdersByHash(hash);
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

  private async invalidateCache(): Promise<void> {
    return this.redisCacheService.flushDb(this.redisClient);
  }
}
