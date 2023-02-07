import { Injectable } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';

@Injectable()
export class ReindexAuctionCommonHandlers {
  constructor() {}

  handleChooseWinnerOrderAndReturnId(): number {
    throw new Error('Not implemented yet');
  }

  handleMarketplaceExpiredAuctionsAndOrders(): void {
    throw new Error('Not implemented yet');
  }

  handleInactiveOrdersForAuction(): void {
    throw new Error('Not implemented yet');
  }

  getAuctionIndex(auctionsState: AuctionEntity[], input: any): number {
    throw new Error('Not implemented yet');
  }
}
