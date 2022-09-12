import { Injectable } from '@nestjs/common';
import '../../utils/extentions';

@Injectable()
export class MarketplacesServiceMock {
  async getCollectionsByMarketplace(marketplaceKey: string): Promise<string[]> {
    return;
  }
}
