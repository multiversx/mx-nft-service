import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplacesService } from './marketplaces.service';
import { ElrondElasticService } from 'src/common';
import { constants } from 'src/config';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { DateUtils } from 'src/utils/date-utils';
import {
  ElasticQuery,
  ElasticSortOrder,
  QueryType,
  RangeGreaterThan,
  RangeLowerThan,
} from '@elrondnetwork/erdnest';
import { Locker } from 'src/utils/locker';

@Injectable()
export class MarketplaceEventsIndexingService {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceService: PersistenceService,
    private readonly marketplaceService: MarketplacesService,
    private readonly marketplacesCachingService: MarketplacesCachingService,
    private readonly elrondElasticService: ElrondElasticService,
  ) {}

  async reindexAllMarketplaceEvents(
    beforeTimestamp?: number,
    afterTimestamp?: number,
  ): Promise<void> {
    await Locker.lock(
      'reindexAllMarketplaceEvents',
      async () => {
        let [marketplaces] = await this.persistenceService.getMarketplaces();
        let marketplaceAddresses = [
          ...new Set(marketplaces.map((marketplace) => marketplace.address)),
        ];
        for (let i = 0; i < marketplaceAddresses.length; i++) {
          await this.reindexMarketplaceEvents(
            marketplaceAddresses[i],
            beforeTimestamp,
            afterTimestamp,
          );
        }
      },
      true,
    );
  }

  async reindexLatestMarketplacesEvents(events: any[]): Promise<void> {
    const marketplaces: string[] = [
      ...new Set(events.map((event) => event.address)),
    ];
    for (let i = 0; i < marketplaces.length; i++) {
      const marketplaceLastIndexTimestamp =
        await this.getMarketplaceLastIndexTimestamp(marketplaces[i]);
      await this.reindexMarketplaceEvents(
        marketplaces[i],
        DateUtils.getCurrentTimestamp(),
        marketplaceLastIndexTimestamp,
      );
    }
  }

  async reindexMarketplaceEvents(
    marketplaceAddress: string,
    beforeTimestamp?: number,
    afterTimestamp?: number,
    stopIfDuplicates?: boolean,
    marketplaceLastIndexTimestamp?: number,
  ): Promise<void> {
    try {
      if (beforeTimestamp < afterTimestamp) {
        throw new Error(`beforeTimestamp can't be less than afterTimestamp`);
      }

      const [newestTimestamp] = await this.getEventsAndSaveToDb(
        marketplaceAddress,
        beforeTimestamp,
        afterTimestamp,
        stopIfDuplicates,
      );

      if (
        !marketplaceLastIndexTimestamp ||
        newestTimestamp > marketplaceLastIndexTimestamp
      ) {
        await this.marketplaceService.updateMarketplaceLastIndexTimestampByAddress(
          marketplaceAddress,
          newestTimestamp,
        );
        await this.marketplacesCachingService.invalidateMarketplacesCache();
      }
    } catch (error) {
      this.logger.error('Error when reindexing marketplace events', {
        path: `${MarketplaceEventsIndexingService.name}.${this.reindexMarketplaceEvents.name}`,
        marketplaceAddress: marketplaceAddress,
      });
    }
  }

  private async getEventsAndSaveToDb(
    marketplaceAddress: string,
    beforeTimestamp: number,
    afterTimestamp: number,
    stopIfDuplicates?: boolean,
  ): Promise<[number, number]> {
    let oldestTimestamp: number;
    let newestTimestamp: number;

    const query = ElasticQuery.create()
      .withMustCondition(
        QueryType.Nested('events', { 'events.address': marketplaceAddress }),
      )
      .withRangeFilter('timestamp', new RangeLowerThan(beforeTimestamp))
      .withRangeFilter('timestamp', new RangeGreaterThan(afterTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getLogsFromElasticBatchSize,
      });

    await this.elrondElasticService.getScrollableList(
      'logs',
      'identifier',
      query,
      async (events) => {
        if (!newestTimestamp) {
          newestTimestamp = events[0].timestamp;
        }

        oldestTimestamp = events[events.length - 1].timestamp;

        const [savedItemsCount, totalEventsCount] = await this.saveEventsToDb(
          events,
          marketplaceAddress,
        );

        if (stopIfDuplicates && savedItemsCount !== totalEventsCount) {
          return false;
        }
      },
    );

    return [newestTimestamp, oldestTimestamp];
  }

  private async getMarketplaceLastIndexTimestamp(
    marketplaceAddress: string,
  ): Promise<number> {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      marketplaceAddress,
    );
    return marketplace.lastIndexTimestamp;
  }

  private async saveEventsToDb(
    batch: any,
    marketplaceAddress: string,
  ): Promise<[number, number]> {
    let marketplaceEvents: MarketplaceEventsEntity[] = [];

    for (let i = 0; i < batch.length; i++) {
      for (let j = 0; j < batch[i].events.length; j++) {
        const event = batch[i].events[j];

        if (event.address !== marketplaceAddress) {
          continue;
        }

        const marketplaceEvent = new MarketplaceEventsEntity({
          txHash: batch[i].identifier,
          originalTxHash: batch[i].originalTxHash,
          order: event.order,
          marketplaceAddress: marketplaceAddress,
          timestamp: batch[i].timestamp,
          data: event,
        });
        marketplaceEvents.push(marketplaceEvent);
      }
    }

    const savedRecordsCount =
      await this.persistenceService.saveOrIgnoreMarketplacesBulk(
        marketplaceEvents,
      );
    return [savedRecordsCount, marketplaceEvents.length];
  }
}
