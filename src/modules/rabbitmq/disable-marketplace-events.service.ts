import { Injectable } from '@nestjs/common';
import { MarketplaceDisablePublisherService } from './disable-marketplace-publisher.service';

@Injectable()
export class DisabledMarketplaceEventsService {
  constructor(private disabledMarketplacePublisherService: MarketplaceDisablePublisherService) {}

  public async handleAuctionEventsForDisableMarketplace(auctionEvents: any[], hash: string) {
    if (auctionEvents?.length) {
      await this.disabledMarketplacePublisherService.publish({ hash: hash, events: auctionEvents });
    }
  }
}
