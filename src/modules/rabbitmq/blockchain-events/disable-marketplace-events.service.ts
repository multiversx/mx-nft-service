import { Injectable } from '@nestjs/common';
import { MarketplaceDisablePublisherService } from 'src/modules/marketplaces/change-events-publisher.service';

@Injectable()
export class DisabledMarketplaceEventsService {
  constructor(private disabledMarketplacePublisherService: MarketplaceDisablePublisherService) {}

  public async handleAuctionEventsForDisableMarketplace(auctionEvents: any[], hash: string) {
    await this.disabledMarketplacePublisherService.publish({ hash: hash, events: auctionEvents });
  }
}
