import { Inject, Injectable } from '@nestjs/common';
import { Campaign } from './models';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import * as Redis from 'ioredis';
import { CampaignEntity } from 'src/db/campaigns';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { CampaignsFilter } from '../common/filters/filtersTypes';
import { CollectionType } from '../assets/models/Collection.type';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { PersistenceService } from 'src/common/persistance/persistance.service';

@Injectable()
export class CampaignsService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private nftMinterService: NftMinterAbiService,
    private persistenceService: PersistenceService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getCampaigns(
    limit: number = 10,
    offset: number = 0,
    filters: CampaignsFilter,
  ): Promise<CollectionType<Campaign>> {
    let allCampaigns = await this.getAllCampaigns();

    if (filters?.campaignId && filters?.minterAddress) {
      const campaigns = allCampaigns?.items?.filter(
        (c) =>
          c.campaignId === filters.campaignId &&
          c.minterAddress === filters.minterAddress,
      );
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    } else if (filters?.campaignId) {
      const campaigns = allCampaigns?.items?.filter(
        (c) => c.campaignId === filters.campaignId,
      );
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    } else if (filters?.minterAddress) {
      const campaigns = allCampaigns?.items?.filter(
        (c) => c.minterAddress === filters.minterAddress,
      );
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    }

    const campaigns = allCampaigns?.items?.slice(offset, offset + limit);

    return new CollectionType({
      count: campaigns?.length,
      items: campaigns,
    });
  }

  private async getAllCampaigns(): Promise<CollectionType<Campaign>> {
    const campaigns = await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
      () => this.getCampaignsFromDb(),
      TimeConstants.oneHour,
    );
    return campaigns;
  }

  async getCampaignsFromDb(): Promise<CollectionType<Campaign>> {
    let [campaigns, count]: [CampaignEntity[], number] =
      await this.persistenceService.getCampaigns();
    return new CollectionType({
      count: count,
      items: campaigns.map((campaign) => Campaign.fromEntity(campaign)),
    });
  }

  async saveCampaign(minterAddress: string): Promise<Campaign[]> {
    const campaigns: BrandInfoViewResultType[] =
      await this.nftMinterService.getCampaignsForScAddress(minterAddress);
    const campaignsfromBlockchain = campaigns.map((c) =>
      CampaignEntity.fromCampaignAbi(c, minterAddress),
    );
    let savedCampaigns = [];
    for (const campaign of campaignsfromBlockchain) {
      const savedCampaign = await this.persistenceService.saveCampaign(
        campaign,
      );
      const tiers = campaign.tiers.map((tier) => ({
        ...tier,
        campaignId: savedCampaign?.id,
      }));
      savedCampaigns = [...savedCampaigns, savedCampaign];
      await this.persistenceService.saveTiers(tiers);
    }

    return savedCampaigns.map((campaign) => Campaign.fromEntity(campaign));
  }

  public async updateTier(
    address: string,
    campaignId: string,
    tier: string,
    nftsBought: string,
  ) {
    const campaign = await this.persistenceService.getCampaign(
      campaignId,
      address,
    );
    const tierEntity = await this.persistenceService.getTier(campaign.id, tier);
    tierEntity.availableNfts -= nftsBought ? parseInt(nftsBought) : 1;
    return await this.persistenceService.saveTier(tierEntity);
  }

  public async invalidateKey() {
    const campaigns = await this.getCampaignsFromDb();
    await this.cacheService.setCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
      campaigns,
      TimeConstants.oneDay,
    );
    await this.refreshCacheKey(CacheInfo.Campaigns.key, TimeConstants.oneDay);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit('refreshCacheKey', {
      key,
      ttl,
      redisClientName: cacheConfig.persistentRedisClientName,
    });
  }

  public async invalidateCache() {
    await this.cacheService.deleteInCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
    );
  }
}
