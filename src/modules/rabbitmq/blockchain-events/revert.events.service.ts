import { Injectable } from '@nestjs/common';
import { AuctionsSetterService } from 'src/modules/auctions';
import { OrdersService } from 'src/modules/orders/order.service';

@Injectable()
export class RevertEventsService {
  constructor(private auctionsService: AuctionsSetterService, private ordersService: OrdersService) {}

  public async handleNftAuctionEnded(revertEvent: any) {
    await this.auctionsService.rollbackAuctionByHash(revertEvent.hash);
    await this.ordersService.rollbackOrdersByHash(revertEvent.hash);
  }
}
