import { Injectable } from '@nestjs/common';
import { ActiveOrdersProvider } from 'src/db/orders';
import { AvailableTokensForAuctionProvider } from 'src/db/orders/available-tokens-auction.loader';
import { AuctionEventEnum } from '../assets/models/AuctionEvent.enum';
import { AuctionsService } from '../auctions';
import { AuctionStatusEnum } from '../auctions/models';
import { CreateOrderArgs } from '../orders/models';
import { OrdersService } from '../orders/order.service';
import {
  AuctionTokenEvent,
  BidEvent,
  BuySftEvent,
  EndAuctionEvent,
  WithdrawEvent,
} from './entities/auction';

@Injectable()
export class NftEventsService {
  constructor(
    private auctionsService: AuctionsService,
    private availableTokens: AvailableTokensForAuctionProvider,
    private ordersService: OrdersService,
  ) {}

  public async handleNftAuctionEnded(auctionEvents: any[], hash: string) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          this.ordersService.createOrder(
            new CreateOrderArgs({
              ownerAddress: topics.currentWinner,
              auctionId: parseInt(topics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: topics.currentBid,
              priceNonce: 0,
              blockHash: hash,
            }),
          );
          break;
        case AuctionEventEnum.BuySftEvent:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const result =
            await this.availableTokens.getAvailableTokensForAuctionId(
              parseInt(buySftTopics.auctionId, 16),
            );
          const totalRemaining =
            parseFloat(buySftTopics.boughtTokens) - result
              ? result[0]?.availableTokens
              : 0;
          if (totalRemaining === 0) {
            this.auctionsService.updateAuction(
              parseInt(buySftTopics.auctionId, 16),
              AuctionStatusEnum.Ended,
              hash,
            );
          }
          this.ordersService.createOrderForSft(
            new CreateOrderArgs({
              ownerAddress: buySftTopics.currentWinner,
              auctionId: parseInt(buySftTopics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: buySftTopics.bid,
              priceNonce: 0,
              blockHash: hash,
              boughtTokens: buySftTopics.boughtTokens,
            }),
          );
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsWithdraw.auctionId, 16),
            AuctionStatusEnum.Closed,
            hash,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuction = new EndAuctionEvent(event);
          const topicsEndAuction = endAuction.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsEndAuction.auctionId, 16),
            AuctionStatusEnum.Ended,
            hash,
          );
          break;
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`,
            hash,
          );
          break;
      }
    }
  }
}
