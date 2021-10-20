import { Injectable } from '@nestjs/common';
import { AuctionsService } from '../auctions';
import { OrdersService } from '../orders/order.service';

@Injectable()
export class RevertEventsService {
  constructor(
    private auctionsService: AuctionsService,
    private ordersService: OrdersService,
  ) {}

  public async handleNftAuctionEnded(revertEvent: any) {
    await this.auctionsService.deleteAuctionByHash(revertEvent.hash);
    await this.ordersService.rollbackOrdersByHash(revertEvent.hash);
  }
}
