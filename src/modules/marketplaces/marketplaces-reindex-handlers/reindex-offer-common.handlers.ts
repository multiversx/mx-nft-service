import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexOfferCommonHandlers {
  constructor() {}

  handleMarketplaceExpiredOffers(): void {
    throw new Error('Not implemented yet');
  }

  getOfferIndex(): number {
    throw new Error('Not implemented yet');
  }
}
