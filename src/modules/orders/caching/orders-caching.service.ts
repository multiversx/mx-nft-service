import { Injectable } from '@nestjs/common';
import '../../../utils/extensions';
import { Order } from '../models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { QueryRequest } from '../../common/filters/QueryRequest';
import { AvailableTokensForAuctionRedisHandler } from '../../auctions/loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from '../loaders/last-order.redis-handler';
import { OrdersRedisHandler } from '../loaders/orders.redis-handler';
import { AccountsStatsCachingService } from 'src/modules/account-stats/accounts-stats.caching.service';
import * as hash from 'object-hash';

@Injectable()
export class OrdersCachingService {
  constructor(
    private accountStatsCachingService: AccountsStatsCachingService,
    private lastOrderRedisHandler: LastOrderRedisHandler,
    private ordersRedisHandler: OrdersRedisHandler,
    private auctionAvailableTokens: AvailableTokensForAuctionRedisHandler,
    private redisCacheService: RedisCacheService,
  ) {}

  public async getOrSetOrders(queryRequest: QueryRequest, getOrders: () => any): Promise<[Order[], number]> {
    return this.redisCacheService.getOrSet(this.getOrdersCacheKey(queryRequest), () => getOrders(), 30 * Constants.oneSecond());
  }

  public async invalidateCache(auctionId: number = 0, ownerAddress: string = '', marketplaceKey: string = ''): Promise<void> {
    await this.lastOrderRedisHandler.clearKey(auctionId);
    await this.ordersRedisHandler.clearKey(auctionId);
    await this.ordersRedisHandler.clearKeyByPattern(auctionId);
    await this.auctionAvailableTokens.clearKey(auctionId);
    await this.accountStatsCachingService.invalidateStats(ownerAddress);
    await this.accountStatsCachingService.invalidateStats(`${ownerAddress}_${marketplaceKey}`);
  }

  private getOrdersCacheKey(request: QueryRequest) {
    return generateCacheKeyFromParams('orders', hash(request));
  }
}
