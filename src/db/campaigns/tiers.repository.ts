import { EntityRepository, Repository, Unique } from 'typeorm';
import { TierEntity } from './tiers.entity';

@EntityRepository(TierEntity)
@Unique('CampaignEntity_UQ', ['campaignId', 'tierName'])
export class TiersRepository extends Repository<TierEntity> {
  async getTier(campaignId: string, tierName: string): Promise<TierEntity> {
    const campaign = await this.findOne({
      where: {
        campaignId,
        tierName,
      },
    });

    return campaign;
  }

  async getTiersForCampaign(campaignId: string): Promise<TierEntity[]> {
    const campaigns = await this.find({
      where: {
        campaignId,
      },
    });

    return campaigns;
  }

  async saveTier(tier: TierEntity): Promise<TierEntity> {
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
