import { EntityRepository, Repository } from 'typeorm';
import { CampaignEntity } from './campaign.entity';

@EntityRepository(CampaignEntity)
export class CampaignsRepository extends Repository<CampaignEntity> {
  async getCampaign(
    campaignId: string,
    minterAddress: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.findOne({
      where: {
        campaignId,
        minterAddress,
      },
    });

    return campaign;
  }

  async getCampaignByMinterAddress(
    minterAddress: string,
  ): Promise<CampaignEntity[]> {
    const campaigns = await this.find({
      where: {
        minterAddress,
      },
      relations: ['tiers'],
    });
    return campaigns;
  }

  async saveCampaign(campaign: CampaignEntity): Promise<CampaignEntity> {
    try {
      return await this.save(campaign);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
  }
}
