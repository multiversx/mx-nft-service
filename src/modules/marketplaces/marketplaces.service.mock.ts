import { Injectable } from '@nestjs/common';
import '../../utils/extensions';

@Injectable()
export class MarketplacesServiceMock {
  async getCollectionsByMarketplace(marketplaceKey: string): Promise<string[]> {
    return;
  }
}
