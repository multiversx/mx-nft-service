import { Injectable } from '@nestjs/common';
import '../../../utils/extentions';
import { Order } from '../models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { QueryRequest } from '../../common/filters/QueryRequest';
import { AvailableTokensForAuctionRedisHandler } from '../../auctions/loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from '../loaders/last-order.redis-handler';
import { TimeConstants } from 'src/utils/time-utils';
import { OrdersRedisHandler } from '../loaders/orders.redis-handler';
import { AccountsStatsCachingService } from 'src/modules/account-stats/accounts-stats.caching.service';
const hash = require('object-hash');

@Injectable()
export class OrdersCachingService {
  private redisClient: Redis.Redis;
  constructor(
    private accountStatsCachingService: AccountsStatsCachingService,
    private lastOrderRedisHandler: LastOrderRedisHandler,
    private ordersRedisHandler: OrdersRedisHandler,
    private auctionAvailableTokens: AvailableTokensForAuctionRedisHandler,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.ordersRedisClientName,
    );
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getOrSetOrders(
    queryRequest: QueryRequest,
    getOrders: () => any,
  ): Promise<[Order[], number]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getOrdersCacheKey(queryRequest),
      () => getOrders(),
      30 * TimeConstants.oneSecond,
    );
  }

  public async invalidateCache(
    auctionId: number = 0,
    ownerAddress: string = '',
  ): Promise<void> {
    await this.lastOrderRedisHandler.clearKey(auctionId);
    await this.ordersRedisHandler.clearKey(auctionId);
    await this.auctionAvailableTokens.clearKey(auctionId);
    await this.accountStatsCachingService.invalidateStats(ownerAddress);
    return this.redisCacheService.flushDb(this.redisClient);
  }

  private getOrdersCacheKey(request: QueryRequest) {
    return generateCacheKeyFromParams('orders', hash(request));
  }
}
