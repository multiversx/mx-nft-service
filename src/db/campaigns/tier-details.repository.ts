import { EntityRepository, Repository, Unique } from 'typeorm';
import { TierDetailEntity } from './tier-details.entity';

@EntityRepository(TierDetailEntity)
@Unique('CampaignEntity_UQ', ['campaignId', 'tierId'])
export class TierDetailsRepository extends Repository<TierDetailEntity> {
  async getTier(
    campaignId: string,
    tierName: string,
  ): Promise<TierDetailEntity> {
    const campaign = await this.findOne({
      where: {
        campaignId,
        tierName,
      },
    });

    return campaign;
  }

  async getTiersForCampaign(campaignId: string): Promise<TierDetailEntity[]> {
    const campaigns = await this.find({
      where: {
        campaignId,
      },
    });

    return campaigns;
  }

  async saveTier(tier: TierDetailEntity): Promise<TierDetailEntity> {
    try {
      return await this.save(tier);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
  }
}
