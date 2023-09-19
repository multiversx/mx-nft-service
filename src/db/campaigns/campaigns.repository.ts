import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { CampaignEntity } from './campaign.entity';

@Injectable()
export class CampaignsRepository {
  constructor(
    @InjectRepository(CampaignEntity)
    private campaignsRepository: Repository<CampaignEntity>,
  ) {}
  async getCampaign(campaignId: string, minterAddress: string): Promise<CampaignEntity> {
    const campaign = await this.campaignsRepository.findOne({
      where: {
        campaignId,
        minterAddress,
      },
    });

    return campaign;
  }

  async getCampaignByCollectionTicker(collectionTicker: string): Promise<CampaignEntity> {
    const campaign = await this.campaignsRepository.findOne({
      where: {
        collectionTicker,
      },
    });

    return campaign;
  }

  async getCampaignByMinterAddress(minterAddress: string): Promise<CampaignEntity[]> {
    const campaigns = await this.campaignsRepository.find({
      where: {
        minterAddress,
      },
      relations: ['tiers'],
    });

    return campaigns;
  }

  async getCampaigns(): Promise<[CampaignEntity[], number]> {
    const campaigns = await this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.tiers', 'tiers')
      .orderBy('campaign.id', 'DESC')
      .addOrderBy('tiers.mintPriceDenominated', 'ASC')
      .getManyAndCount();
    return campaigns;
  }

  async saveCampaign(campaign: CampaignEntity): Promise<CampaignEntity> {
    try {
      return await this.campaignsRepository.save(campaign);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }
}
