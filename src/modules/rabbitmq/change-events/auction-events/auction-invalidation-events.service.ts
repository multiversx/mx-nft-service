import { Injectable } from '@nestjs/common';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { OrdersService } from 'src/modules/orders/order.service';
import { BidChangeEvent, ChangedEvent } from '../events/owner-changed.event';

@Injectable()
export class AuctionInvalidationEventsService {
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsSetterService: AuctionsSetterService,
    private auctionsDbService: AuctionsServiceDb,
    private availableTokensCount: AssetAvailableTokensCountRedisHandler,
    private ordersService: OrdersService,
  ) {}

  async invalidateBidCaching(payload: BidChangeEvent) {
    this.auctionsSetterService.invalidateCache();
    await this.auctionsGetterService.invalidateCache(payload.ownerAddress);
    this.auctionsDbService.invalidateCache(
      payload.identifier,
      payload.ownerAddress,
    );
    await this.ordersService.invalidateCache(
      parseInt(payload.id),
      payload.ownerAddress,
    );
    await this.availableTokensCount.clearKey(payload.identifier);
  }

  async invalidateAuction(payload: ChangedEvent) {
    this.auctionsSetterService.invalidateCache();
    await this.auctionsGetterService.invalidateCache(payload.ownerAddress);
    await this.availableTokensCount.clearKey(payload.id);
  }

  async invalidateOrder(payload: BidChangeEvent) {
    await this.ordersService.invalidateCache(
      parseInt(payload.id),
      payload.ownerAddress,
    );
  }
}
