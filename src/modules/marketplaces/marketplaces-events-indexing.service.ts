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
import { MarketplaceEventsIndexingRequest } from './models/MarketplaceEventsIndexingRequest';

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
    stopIfDuplicates?: boolean,
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
            new MarketplaceEventsIndexingRequest({
              marketplaceAddress: marketplaceAddresses[i],
              beforeTimestamp,
              afterTimestamp,
              stopIfDuplicates,
            }),
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
        new MarketplaceEventsIndexingRequest({
          marketplaceAddress: marketplaces[i],
          beforeTimestamp: DateUtils.getCurrentTimestamp(),
          afterTimestamp: marketplaceLastIndexTimestamp,
        }),
      );
    }
  }

  async reindexMarketplaceEvents(
    input: MarketplaceEventsIndexingRequest,
  ): Promise<void> {
    try {
      if (input.beforeTimestamp < input.afterTimestamp) {
        throw new Error(`beforeTimestamp can't be less than afterTimestamp`);
      }

      const [newestTimestamp] = await this.getEventsAndSaveToDb(input);

      if (
        !input.marketplaceLastIndexTimestamp ||
        newestTimestamp > input.marketplaceLastIndexTimestamp
      ) {
        await this.marketplaceService.updateMarketplaceLastIndexTimestampByAddress(
          input.marketplaceAddress,
          newestTimestamp,
        );
        await this.marketplacesCachingService.invalidateMarketplacesCache();
      }
    } catch (error) {
      this.logger.error('Error when reindexing marketplace events', {
        path: `${MarketplaceEventsIndexingService.name}.${this.reindexMarketplaceEvents.name}`,
        error: error.message,
        marketplaceAddress: input.marketplaceAddress,
      });
    }
  }

  private async getEventsAndSaveToDb(
    input: MarketplaceEventsIndexingRequest,
  ): Promise<[number, number]> {
    let oldestTimestamp: number;
    let newestTimestamp: number;

    const query = ElasticQuery.create()
      .withMustCondition(
        QueryType.Nested('events', {
          'events.address': input.marketplaceAddress,
        }),
      )
      .withRangeFilter('timestamp', new RangeLowerThan(input.beforeTimestamp))
      .withRangeFilter('timestamp', new RangeGreaterThan(input.afterTimestamp))
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
        if (!events || events.length === 0) {
          return false;
        }

        if (!newestTimestamp) {
          newestTimestamp = events[0].timestamp;
        }

        oldestTimestamp = events[events.length - 1].timestamp;

        const [savedItemsCount, totalEventsCount] = await this.saveEventsToDb(
          events,
          input.marketplaceAddress,
        );

        if (input.stopIfDuplicates && savedItemsCount !== totalEventsCount) {
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
