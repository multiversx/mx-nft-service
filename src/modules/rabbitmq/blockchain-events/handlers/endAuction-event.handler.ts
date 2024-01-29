import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
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
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private notificationsService: NotificationsService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const endAuctionEvent = new EndAuctionEvent(event);
    const topics = endAuctionEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      endAuctionEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace) return;
    this.logger.log(`End auction event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);
    const auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);

    if (!auction) return;

    this.auctionsService.updateAuctionStatus(auction.id, AuctionStatusEnum.Ended, hash, AuctionEventEnum.EndAuctionEvent);
    this.notificationsService.updateNotificationStatus([auction.id]);
    this.ordersService.updateOrder(auction.id, OrderStatusEnum.Bought);
    await this.feedEventsSenderService.sendWonAuctionEvent(topics, auction, marketplace);
  }
}
