import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Campaign } from './models';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import * as Redis from 'ioredis';
import { CampaignEntity } from 'src/db/campaigns';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { CampaignsFilter } from '../common/filters/filtersTypes';
import { CollectionType } from '../assets/models/Collection.type';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CampaignsService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private nftMinterService: NftMinterAbiService,
    private campaignsRepository: CampaignsRepository,
    private tierRepository: TiersRepository,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getCampaigns(
    limit: number = 10,
    offset: number = 0,
    filters: CampaignsFilter,
  ): Promise<CollectionType<Campaign>> {
    let allCampaigns = await this.getAllCampaigns();

    if (filters?.campaignId) {
      const campaigns = allCampaigns?.items?.filter(
        (c) =>
          c.campaignId === filters.campaignId &&
          c.minterAddress === filters.minterAddress,
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
      await this.campaignsRepository.getCampaigns();
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
      const savedCampaign = await this.campaignsRepository.saveCampaign(
        campaign,
      );
      const tiers = campaign.tiers.map((tier) => ({
        ...tier,
        campaignId: savedCampaign?.id,
      }));
      savedCampaigns = [...savedCampaigns, savedCampaign];
      await this.tierRepository.save(tiers);
    }

    return savedCampaigns.map((campaign) => Campaign.fromEntity(campaign));
  }

  public async updateTier(
    address: string,
    campaignId: string,
    tier: string,
    nftsBought: string,
  ) {
    const campaign = await this.campaignsRepository.getCampaign(
      campaignId,
      address,
    );
    const tierEntity = await this.tierRepository.getTier(campaign.id, tier);
    tierEntity.availableNfts -= nftsBought ? parseInt(nftsBought) : 1;
    await this.tierRepository.save(tierEntity);
  }

  public async invalidateKey() {
    await this.cacheService.setCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
      null,
      TimeConstants.oneDay,
    );
    await this.refreshCacheKey(CacheInfo.Campaigns.key, TimeConstants.oneDay);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit('refreshCacheKey', {
      key,
      ttl,
      redisClientName: cacheConfig.auctionsRedisClientName,
    });
  }

  public async invalidateCache() {
    await this.cacheService.deleteInCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
    );
  }
}
