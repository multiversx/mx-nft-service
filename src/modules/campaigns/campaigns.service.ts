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

@Injectable()
export class CampaignsService {
  private redisClient: Redis.Redis;
  constructor(
    private nftMinterService: NftMinterAbiService,
    private campaignsRepository: CampaignsRepository,
    private tierRepository: TiersRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  private async getAllCampaigns(): Promise<CollectionType<Campaign>> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AllCollections.key,
      () => this.getCampaignsFromDb(),
      TimeConstants.oneHour,
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
        (c) => c.campaignId === filters.campaignId,
      );
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    }
    allCampaigns.items = allCampaigns?.items?.slice(offset, offset + limit);

    return new CollectionType({
      count: allCampaigns?.items?.length,
      items: allCampaigns?.items,
    });
  }

  async getCampaignsFromDb(): Promise<CollectionType<Campaign>> {
    let [campaigns, count]: [CampaignEntity[], number] =
      await this.campaignsRepository.getCampaigns();
    console.log('From database', { campaigns, count });
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

  public async invalidateCache() {
    await this.cacheService.deleteInCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
    );
  }
}
