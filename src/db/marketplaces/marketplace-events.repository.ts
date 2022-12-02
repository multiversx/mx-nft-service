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
      console.log(batch.length, marketplaceEvents.length);
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

  async getByMarketplaceAndTimestamps(
    marketplaceKey: string,
    beforeTimestamp: number,
    afterTimestamp: number,
  ): Promise<MarketplaceEventsEntity[]> {
    return await this.find({
      where: {
        marketplace_key: marketplaceKey,
        timestamp: MoreThan(afterTimestamp) && LessThan(beforeTimestamp),
      },
    });
  }
}