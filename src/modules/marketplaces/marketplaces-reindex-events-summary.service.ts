import { Injectable } from '@nestjs/common';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { Marketplace } from './models';

@Injectable()
export class MarketplacesReindexEventsSummaryService {
  constructor() {}

  getEventsSetSummary(
    marketplace: Marketplace,
    eventsSet: MarketplaceEventsEntity[],
  ): any {
    throw new Error('Not implemented yet');
  }
}
