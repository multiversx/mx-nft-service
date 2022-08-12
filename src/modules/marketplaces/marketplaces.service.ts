import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { CollectionType } from '../assets/models/Collection.type';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { Marketplace } from './models';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { MarketplaceEntity } from 'src/db/marketplaces';

@Injectable()
export class MarketplacesService {
  constructor(
    private marketplacesRepository: MarketplaceRepository,
    private cacheService: MarketplacesCachingService,
  ) {}

  async getMarketplaces(
    limit: number = 10,
    offset: number = 0,
  ): Promise<CollectionType<Marketplace>> {
    let allCampaigns = await this.getAllMarketplaces();

    const campaigns = allCampaigns?.items?.slice(offset, offset + limit);

    return new CollectionType({
      count: campaigns?.length,
      items: campaigns,
    });
  }

  private async getAllMarketplaces(): Promise<CollectionType<Marketplace>> {
    return await this.cacheService.getAllMarketplaces(() =>
      this.getMarketplacesFromDb(),
    );
  }

  async getMarketplacesFromDb(): Promise<CollectionType<Marketplace>> {
    let [campaigns, count]: [MarketplaceEntity[], number] =
      await this.marketplacesRepository.getMarketplaces();
    return new CollectionType({
      count: count,
      items: campaigns.map((campaign) => Marketplace.fromEntity(campaign)),
    });
  }
}
