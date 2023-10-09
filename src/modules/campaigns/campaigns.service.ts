import { Inject, Injectable } from '@nestjs/common';
import { Campaign } from './models';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import { CampaignEntity } from 'src/db/campaigns';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { CampaignsFilter } from '../common/filters/filtersTypes';
import { CollectionType } from '../assets/models/Collection.type';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CampaignsCachingService } from './campaigns-caching.service';

@Injectable()
export class CampaignsService {
  constructor(
    private nftMinterService: NftMinterAbiService,
    private persistenceService: PersistenceService,
    private cacheService: CampaignsCachingService,
  ) {}

  async getCampaigns(limit: number = 10, offset: number = 0, filters?: CampaignsFilter): Promise<CollectionType<Campaign>> {
    let allCampaigns = await this.getAllCampaigns();

    if (filters?.campaignId && filters?.minterAddress) {
      const campaigns = allCampaigns?.items?.filter(
        (c) => c.campaignId === filters.campaignId && c.minterAddress === filters.minterAddress,
      );
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    } else if (filters?.campaignId) {
      const campaigns = allCampaigns?.items?.filter((c) => c.campaignId === filters.campaignId);
      return new CollectionType({
        count: campaigns ? campaigns?.length : 0,
        items: campaigns,
      });
    } else if (filters?.minterAddress) {
      const campaigns = allCampaigns?.items?.filter((c) => c.minterAddress === filters.minterAddress);
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

  async saveCampaign(minterAddress: string): Promise<Campaign[]> {
    const campaigns: BrandInfoViewResultType[] = await this.nftMinterService.getCampaignsForScAddress(minterAddress);
    const maxNftsPerTransaction = await this.cacheService.getOrSetNrOfTransactionOnSC(
      () => this.nftMinterService.getMaxNftsPerTransaction(minterAddress),
      minterAddress,
    );
    const campaignsfromBlockchain = campaigns.map((c) => CampaignEntity.fromCampaignAbi(c, minterAddress, maxNftsPerTransaction));
    let savedCampaigns = [];
    for (const campaign of campaignsfromBlockchain) {
      const savedCampaign = await this.persistenceService.saveCampaign(campaign);
      const tiers = campaign.tiers.map((tier) => ({
        ...tier,
        campaignId: savedCampaign?.id,
      }));
      if (!savedCampaign) continue;
      savedCampaigns = [...savedCampaigns, savedCampaign];
      await this.persistenceService.saveTiers(tiers);
    }

    return savedCampaigns.map((campaign) => Campaign.fromEntity(campaign));
  }

  public async updateTier(address: string, campaignId: string, tier: string, nftsBought: string) {
    const campaign = await this.persistenceService.getCampaign(campaignId, address);
    const tierEntity = await this.persistenceService.getTier(campaign.id, tier);
    tierEntity.availableNfts -= nftsBought ? parseInt(nftsBought) : 1;
    return await this.persistenceService.saveTier(tierEntity);
  }

  private async getAllCampaigns(): Promise<CollectionType<Campaign>> {
    return await this.cacheService.getAllMarketplaces(() => this.getCampaignsFromDb());
  }

  private async getCampaignsFromDb(): Promise<CollectionType<Campaign>> {
    let [campaigns, count]: [CampaignEntity[], number] = await this.persistenceService.getCampaigns();
    return new CollectionType({
      count: count,
      items: campaigns.map((campaign) => Campaign.fromEntity(campaign)),
    });
  }
}
