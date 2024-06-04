import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { CreateOrderArgs, OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { BidEvent } from '../../entities/auction-reindex';
import { ElrondSwapBidEvent } from '../../entities/auction-reindex/elrondnftswap/elrondswap-bid.event';
import { FeedEventsSenderService } from '../feed-events.service';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class BidEventHandler {
  private readonly logger = new Logger(BidEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private feedEventsSenderService: FeedEventsSenderService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private readonly persistenceService: PersistenceService,
  ) { }

  async handle(event: EventLog, marketplace: Marketplace) {
    try {
      let [bidEvent, topics] = [undefined, undefined];
      if (marketplace.type === MarketplaceTypeEnum.External) {
        [bidEvent, topics] = this.getEventAndTopics(event, marketplace.key);
      } else {
        [bidEvent, topics] = this.getEventAndTopics(event);
        marketplace = await this.marketplaceService.getMarketplaceByType(bidEvent.getAddress(), marketplace.type, topics.collection);
      }
      if (!marketplace) return;
      this.logger.log(`${bidEvent.identifier} event detected for marketplace '${marketplace?.name}'`);
      const auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
      if (!auction) return;

      const activeOrder = await this.ordersService.getActiveOrderForAuction(auction.id);
      if (activeOrder && activeOrder.priceAmount === topics.currentBid) {
        return;
      }

      const order = await this.ordersService.updateAuctionOrders(
        new CreateOrderArgs({
          ownerAddress: topics.currentWinner,
          auctionId: auction.id,
          priceToken: auction.paymentToken,
          priceAmount: topics.currentBid,
          priceNonce: auction.paymentNonce,
          blockHash: '',
          status: OrderStatusEnum.Active,
          marketplaceKey: marketplace.key,
        }),
        activeOrder,
      );
      await this.feedEventsSenderService.sendBidEvent(auction, topics, order);
      if (auction.maxBidDenominated === order.priceAmountDenominated) {
        this.notificationsService.updateNotificationStatus([auction?.id]);
        this.notificationsService.addNotifications(auction, order);
        this.auctionsService.updateAuctionStatus(auction.id, AuctionStatusEnum.Ended, 'hash', event.identifier);
        this.persistenceService.updateOrderWithStatus(order, OrderStatusEnum.Bought);
      }
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }

  private getEventAndTopics(event: any, marketplaceKey?: string) {
    if (marketplaceKey && marketplaceKey === ELRONDNFTSWAP_KEY) {
      const bidEvent = new ElrondSwapBidEvent(event);
      const topics = bidEvent.getTopics();
      return [bidEvent, topics];
    }
    const bidEvent = new BidEvent(event);
    const topics = bidEvent.getTopics();
    return [bidEvent, topics];
  }
}
