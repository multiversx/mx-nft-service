import { Injectable, Logger } from '@nestjs/common';
import { AuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { EndAuctionEvent } from '../../entities/auction';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class EndAuctionEventHandler {
  private readonly logger = new Logger(EndAuctionEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private ordersService: OrdersService,
    private feedEventsSenderService: FeedEventsSenderService,
    private readonly marketplaceService: MarketplacesService,
    private notificationsService: NotificationsService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const endAuctionEvent = new EndAuctionEvent(event);
    const topicsEndAuction = endAuctionEvent.getTopics();
    const endMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        endAuctionEvent.getAddress(),
        marketplaceType,
        topicsEndAuction.collection,
      );

    if (!endMarketplace) return;
    this.logger.log(
      `End auction event detected for hash '${hash}' and marketplace '${endMarketplace?.name}'`,
    );
    const auction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topicsEndAuction.auctionId, 16),
        endMarketplace.key,
      );

    if (!auction) return;

    this.auctionsService.updateAuctionStatus(
      auction.id,
      AuctionStatusEnum.Ended,
      hash,
      AuctionEventEnum.EndAuctionEvent,
    );
    this.notificationsService.updateNotificationStatus([auction.id]);
    this.ordersService.updateOrder(auction.id, OrderStatusEnum.Bought);
    await this.feedEventsSenderService.sendWonAuctionEvent(
      topicsEndAuction,
      auction,
      endMarketplace,
    );
  }
}
