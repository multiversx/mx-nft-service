import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants } from 'src/config';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { MarketplaceEventsEntity } from './marketplace-events.entity';

@Injectable()
export class MarketplaceEventsRepository {
  constructor(
    @InjectRepository(MarketplaceEventsEntity)
    private marketplaceCollectionRepository: Repository<MarketplaceEventsEntity>,
  ) {}
  async saveOrIgnoreBulk(marketplaceEvents: MarketplaceEventsEntity[]): Promise<number> {
    let savedRecordsCount = 0;

    const totalBatches = Math.max(marketplaceEvents.length / constants.dbBatch, 1);
    for (let i = 0; i < totalBatches; i++) {
      const batch = marketplaceEvents.slice(i * constants.dbBatch, (i + 1) * constants.dbBatch);
      const res = await this.marketplaceCollectionRepository
        .createQueryBuilder()
        .insert()
        .into('marketplace_events')
        .values(batch)
        .orIgnore()
        .execute();
      savedRecordsCount += res?.identifiers.filter((identifier) => identifier).length;
    }

    return savedRecordsCount;
  }

  async getEventsByMarketplaceAndTimestampsAsc(
    marketplaceAddress: string,
    afterTimestamp?: number,
    beforeTimestamp?: number,
  ): Promise<MarketplaceEventsEntity[]> {
    let whereFilter = {
      marketplaceAddress,
    };
    if (afterTimestamp && beforeTimestamp) {
      whereFilter['timestamp'] = MoreThan(afterTimestamp) && LessThan(beforeTimestamp);
    } else if (afterTimestamp) {
      whereFilter['timestamp'] = MoreThan(afterTimestamp);
    }

    return await this.marketplaceCollectionRepository.find({
      where: whereFilter,
      order: {
        timestamp: 'ASC',
      },
      take: constants.dbBatch,
    });
  }
}
