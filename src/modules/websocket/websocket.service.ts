import { Inject } from '@nestjs/common';
import WebSocket from 'ws';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuctionEventEnum } from '../assets/models/AuctionEvent.enum';
import { AuctionsService } from '../auctions/auctions.service';
import { OrdersService } from '../orders/order.service';
import { CreateOrderArgs } from '../orders/models';
import { AuctionStatusEnum } from '../auctions/models';
import { elrondConfig } from 'src/config';
import { BidEvent } from './entities/auction/bid.event';
import { WithdrawEvent } from './entities/auction/withdraw.event';
import { EndAuctionEvent } from './entities/auction/endAuction.event';
import { AuctionTokenEvent } from './entities/auction/auctionToken.event';

export class WebSocketService {
  private ws: WebSocket;
  private subEvent = {
    subscriptionEntries: [],
  };

  constructor(
    private auctionsService: AuctionsService,
    private ordersService: OrdersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.ws = new WebSocket(process.env.Notifier_Url);

    this.ws.on('message', (message) => {
      const rawEvents = JSON.parse(message.toString());
      rawEvents.map(async (rawEvent) => {
        switch (rawEvent.identifier) {
          case AuctionEventEnum.BidEvent || AuctionEventEnum.BuySftEvent:
            const bidEvent = new BidEvent(rawEvent);
            this.logger.info(JSON.stringify(bidEvent.toJSON()));
            const topics = bidEvent.getTopics();
            this.ordersService.createOrder(
              new CreateOrderArgs({
                ownerAddress: topics.currentWinner,
                auctionId: parseInt(topics.auctionId), //parseInt(dataArgs[0], 16),
                priceToken: 'EGLD',
                priceAmount: topics.currentBid,
                priceNonce: 0,
              }),
            );
            break;
          case AuctionEventEnum.WithdrawEvent:
            const withdraw = new WithdrawEvent(rawEvent);
            this.logger.info(JSON.stringify(bidEvent.toJSON()));
            const topicsWithdraw = withdraw.getTopics();
            this.auctionsService.updateAuction(
              parseInt(topicsWithdraw.auctionId),
              AuctionStatusEnum.Closed,
            );
            break;

          case AuctionEventEnum.EndAuctionEvent:
            const endAuction = new EndAuctionEvent(rawEvent);
            this.logger.info(JSON.stringify(bidEvent.toJSON()));
            const topicsEndAuction = endAuction.getTopics();
            this.auctionsService.updateAuction(
              parseInt(topicsEndAuction.auctionId),
              AuctionStatusEnum.Ended,
            );
            break;
          case AuctionEventEnum.AuctionTokenEvent:
            const auctionToken = new AuctionTokenEvent(rawEvent);
            this.logger.info(JSON.stringify(bidEvent.toJSON()));
            const topicsAuctionToken = auctionToken.getTopics();
            this.logger.info(JSON.stringify(auctionToken.toJSON()));
            this.auctionsService.saveAuction(
              parseInt(topicsAuctionToken.auctionId),
              `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`,
            );
            break;
        }
      });
    });
  }

  async subscribe() {
    const pairEvents = Object.values(AuctionEventEnum);
    pairEvents.map((event) =>
      this.subEvent.subscriptionEntries.push({
        address: elrondConfig.nftMarketplaceAddress,
        identifier: event,
      }),
    );

    this.ws.send(JSON.stringify(this.subEvent));
  }
}
