import { constants } from 'src/config';
import { EntityRepository, LessThan, MoreThan, Repository } from 'typeorm';
import { MarketplaceEventsEntity } from './marketplace-events.entity';

@EntityRepository(MarketplaceEventsEntity)
export class MarketplaceEventsRepository extends Repository<MarketplaceEventsEntity> {
  async saveOrIgnoreBulk(
    marketplaceEvents: MarketplaceEventsEntity[],
  ): Promise<number> {
    let savedRecords = 0;

    const totalBatches = Math.max(
      marketplaceEvents.length / constants.dbBatch,
      1,
    );
    for (let i = 0; i < totalBatches; i++) {
      const batch = marketplaceEvents.slice(
        i * constants.dbBatch,
        (i + 1) * constants.dbBatch,
      );
      const res = await this.createQueryBuilder()
        .insert()
        .into('marketplace_events')
        .values(batch)
        .orIgnore()
        .execute();
      savedRecords += res?.identifiers.filter(
        (identifier) => identifier,
      ).length;
    }

    return savedRecords;
  }

  async getByMarketplaceAndTimestampsAsc(
    marketplaceAddress: string,
    afterTimestamp?: number,
    beforeTimestamp?: number,
  ): Promise<MarketplaceEventsEntity[]> {
    let whereFilter = {
      marketplaceAddress,
    };
    if (afterTimestamp && beforeTimestamp) {
      whereFilter['timestamp'] =
        MoreThan(afterTimestamp) && LessThan(beforeTimestamp);
    } else if (afterTimestamp) {
      whereFilter['timestamp'] = MoreThan(afterTimestamp);
    }

    return await this.find({
      where: whereFilter,
      order: {
        timestamp: 'ASC',
      },
      take: constants.dbBatch,
    });
  }
}
