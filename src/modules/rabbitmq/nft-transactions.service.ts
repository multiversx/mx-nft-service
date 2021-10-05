import { Injectable } from '@nestjs/common';
import { AuctionEventEnum } from '../assets/models/AuctionEvent.enum';
import { AuctionsService } from '../auctions/auctions.service';
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
export class NftTransactionsService {
  constructor(
    private auctionsService: AuctionsService,
    private ordersService: OrdersService,
  ) {}

  public async handleNftAuctionEnded(nftAuctionEndedEvent: any) {
    console.log(nftAuctionEndedEvent, nftAuctionEndedEvent.identifier);

    switch (nftAuctionEndedEvent.identifier) {
      case AuctionEventEnum.BidEvent:
        const bidEvent = new BidEvent(nftAuctionEndedEvent);
        const topics = bidEvent.getTopics();
        console.log({ topics });
        this.ordersService.createOrder(
          new CreateOrderArgs({
            ownerAddress: topics.currentWinner,
            auctionId: parseInt(topics.auctionId, 16),
            priceToken: 'EGLD',
            priceAmount: topics.currentBid,
            priceNonce: 0,
          }),
        );
        break;
      case AuctionEventEnum.BuySftEvent:
        const buySftEvent = new BuySftEvent(nftAuctionEndedEvent);
        const buySftTopics = buySftEvent.getTopics();
        console.log({ buySftTopics });
        this.ordersService.createOrder(
          new CreateOrderArgs({
            ownerAddress: buySftTopics.currentWinner,
            auctionId: parseInt(buySftTopics.auctionId, 16),
            priceToken: 'EGLD',
            priceAmount: buySftTopics.bid,
            priceNonce: 0,
          }),
        );
        break;
      case AuctionEventEnum.WithdrawEvent:
        const withdraw = new WithdrawEvent(nftAuctionEndedEvent);
        const topicsWithdraw = withdraw.getTopics();
        this.auctionsService.updateAuction(
          parseInt(topicsWithdraw.auctionId, 16),
          AuctionStatusEnum.Closed,
        );
        break;
      case AuctionEventEnum.EndAuctionEvent:
        const endAuction = new EndAuctionEvent(nftAuctionEndedEvent);
        const topicsEndAuction = endAuction.getTopics();
        console.log({ topicsEndAuction });
        this.auctionsService.updateAuction(
          parseInt(topicsEndAuction.auctionId, 16),
          AuctionStatusEnum.Ended,
        );
        break;
      case AuctionEventEnum.AuctionTokenEvent:
        const auctionToken = new AuctionTokenEvent(nftAuctionEndedEvent);
        const topicsAuctionToken = auctionToken.getTopics();
        console.log({ topicsAuctionToken });
        await this.auctionsService.saveAuction(
          parseInt(topicsAuctionToken.auctionId, 16),
          `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`,
        );
        break;
    }
  }
}
