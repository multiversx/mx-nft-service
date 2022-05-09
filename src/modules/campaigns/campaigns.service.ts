import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Campaign } from './models';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import { CampaignEntity } from 'src/db/campaigns';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { CampaignsFilter } from '../common/filters/filtersTypes';
import { CollectionType } from '../assets/models/Collection.type';

@Injectable()
export class CampaignsService {
  constructor(
    private nftMinterService: NftMinterAbiService,
    private campaignsRepository: CampaignsRepository,
    private tierRepository: TiersRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getCampaigns(
    limit: number = 10,
    offset: number = 0,
    filters: CampaignsFilter,
  ): Promise<CollectionType<Campaign>> {
    if (filters?.campaignId) {
      const campaigns = await this.campaignsRepository.getCampaignById(
        filters.campaignId,
      );
      return new CollectionType({
        count: campaigns ? campaigns.length : 0,
        items: campaigns.map((campaign) => Campaign.fromEntity(campaign)),
      });
    }
    let [campaigns, count]: [CampaignEntity[], number] =
      await this.campaignsRepository.getCampaigns(limit, offset);

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
}
