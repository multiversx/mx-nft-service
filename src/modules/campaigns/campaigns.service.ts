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

@Injectable()
export class CampaignsService {
  constructor(
    private nftMinterService: NftMinterAbiService,
    private campaignsRepository: CampaignsRepository,
    private tierRepository: TiersRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getCampaigns(): Promise<Campaign[]> {
    const minters = process.env.MINTERS_ADDRESSES.split(',').map((entry) => {
      return entry.toLowerCase().trim();
    });
    let campaigns: CampaignEntity[] = [];
    for (const minter of minters) {
      const campaignsFromDb =
        await this.campaignsRepository.getCampaignByMinterAddress(minter);
      if (campaignsFromDb?.length > 0) {
        campaigns = [...campaigns, ...campaignsFromDb];
      }
    }

    return campaigns.map((campaign) => Campaign.fromEntity(campaign));
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
