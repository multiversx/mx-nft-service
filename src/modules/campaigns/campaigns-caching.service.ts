import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Campaign } from './models';

@Injectable()
export class CampaignsCachingService {
  constructor(private cacheService: CacheService) {}

  public async getAllMarketplaces(getCampaignsFromDb: () => any): Promise<CollectionType<Campaign>> {
    return await this.cacheService.getOrSet(CacheInfo.Campaigns.key, () => getCampaignsFromDb(), Constants.oneHour());
  }

  public async getOrSetNrOfTransactionOnSC(getOrSetNrOfTransactionOnSC: () => any, key: string): Promise<number> {
    return await this.cacheService.getOrSet(
      `${CacheInfo.NrOfNftsOnTransaction.key}_${key}`,
      () => getOrSetNrOfTransactionOnSC(),
      CacheInfo.NrOfNftsOnTransaction.ttl,
    );
  }

  public async invalidateCache() {
    await this.cacheService.deleteInCache(CacheInfo.Campaigns.key);
  }
}
