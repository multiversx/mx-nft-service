import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { EntityRepository, Repository } from 'typeorm';
import { TierEntity } from './tiers.entity';

@EntityRepository(TierEntity)
export class TiersRepository extends Repository<TierEntity> {
  async getTier(campaignId: number, tierName: string): Promise<TierEntity> {
    const campaign = await this.findOne({
      where: {
        campaignId,
        tierName,
      },
    });

    return campaign;
  }

  async getTiersForCampaign(campaignId: number): Promise<TierEntity[]> {
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
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async saveTiers(tiers: TierEntity[]): Promise<TierEntity[]> {
    try {
      return await this.save(tiers);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }
}
