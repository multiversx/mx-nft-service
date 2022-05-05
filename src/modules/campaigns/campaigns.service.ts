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
      } else {
        const auction: BrandInfoViewResultType[] =
          await this.nftMinterService.getCampaignsForScAddress(minter);
        const campaignsfromBlockchain = auction.map((c) =>
          CampaignEntity.fromCampaignAbi(c, minter),
        );
        const savedCampaigns = await this.campaignsRepository.save(
          campaignsfromBlockchain,
        );
        for (const campaign of campaignsfromBlockchain) {
          const savedCampaign = await this.campaignsRepository.saveCampaign(
            campaign,
          );
          const tiers = campaign.tiers.map((tier) => ({
            ...tier,
            campaignId: savedCampaign.id,
          }));
          await this.tierRepository.save(tiers);
        }
        campaigns = [...campaigns, ...savedCampaigns];
      }
    }

    return campaigns.map((campaign) => Campaign.fromEntity(campaign));
  }

  public async updateTier(
    address: string,
    campaignId: string,
    mintPrice: string,
  ) {
    const campaign = await this.campaignsRepository.getCampaign(
      campaignId,
      address,
    );
    const tierEntity = await this.tierRepository.getTier(
      campaign.id,
      mintPrice,
    );
    tierEntity.availableNfts--;
    await this.tierRepository.save(tierEntity);
  }
}
