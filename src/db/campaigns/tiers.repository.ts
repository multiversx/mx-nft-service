import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { TierEntity } from './tiers.entity';

@Injectable()
export class TiersRepository {
  constructor(
    @InjectRepository(TierEntity)
    private tiersRepository: Repository<TierEntity>,
  ) {}
  async getTier(campaignId: number, tierName: string): Promise<TierEntity> {
    const campaign = await this.tiersRepository.findOne({
      where: {
        campaignId,
        tierName,
      },
    });

    return campaign;
  }

  async getTiersForCampaign(campaignId: number): Promise<TierEntity[]> {
    const campaigns = await this.tiersRepository.find({
      where: {
        campaignId,
      },
    });

    return campaigns;
  }

  async saveTier(tier: TierEntity): Promise<TierEntity> {
    try {
      return await this.tiersRepository.save(tier);
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
      return await this.tiersRepository.save(tiers);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }
}
