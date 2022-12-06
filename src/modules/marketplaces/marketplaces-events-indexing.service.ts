import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplacesService } from './marketplaces.service';
import { ElrondElasticService } from 'src/common';
import { constants } from 'src/config';
import { HitResponse } from 'src/common/services/elrond-communication/models/elastic-search';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class MarketplaceEventsIndexingService {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceService: PersistenceService,
    private readonly marketplaceService: MarketplacesService,
    private readonly marketplacesCachingService: MarketplacesCachingService,
    private readonly elrondElasticService: ElrondElasticService,
  ) {}

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
  ): Promise<[number, number]> {
    try {
      if (beforeTimestamp < afterTimestamp) {
        throw new Error(`beforeTimestamp can't be less than afterTimestamp`);
      }

      const size = constants.getLogsFromElasticBatchSize;
      let newestTimestamp: number;
      let oldestTimestamp: number;
      let stop: boolean;

      do {
        [stop, newestTimestamp, oldestTimestamp] =
          await this.getEventsBatchAndSaveToDb(
            marketplaceAddress,
            size,
            newestTimestamp,
            oldestTimestamp,
            stopIfDuplicates,
            beforeTimestamp,
            afterTimestamp,
          );
      } while (!stop);

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

      return [newestTimestamp, oldestTimestamp];
    } catch (error) {
      this.logger.error('Error when reindexing marketplace events', {
        path: `${MarketplaceEventsIndexingService.name}.${this.reindexMarketplaceEvents.name}`,
        marketplaceAddress: marketplaceAddress,
      });
    }
  }

  private async getEventsBatchAndSaveToDb(
    marketplaceAddress: string,
    size: number,
    newestTimestamp: number,
    oldestTimestamp: number,
    stopIfDuplicates?: boolean,
    beforeTimestamp?: number,
    afterTimestamp?: number,
  ): Promise<[boolean, number, number]> {
    let stop = false;

    const [batch, batchSize, timestamp] =
      await this.elrondElasticService.getAddressHistory(
        marketplaceAddress,
        size,
        oldestTimestamp ?? beforeTimestamp,
        afterTimestamp,
      );

    if (batchSize === 0) {
      stop = true;
    }

    oldestTimestamp = timestamp;

    if (!newestTimestamp) {
      newestTimestamp = batch[0]._source.timestamp;
    }

    const [savedItemsCount, totalEventsCount] = await this.saveEventsToDb(
      batch,
      marketplaceAddress,
    );

    if (stopIfDuplicates && savedItemsCount !== totalEventsCount) {
      stop = true;
    }

    return [stop, newestTimestamp, oldestTimestamp];
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
    batch: HitResponse[],
    marketplaceAddress: string,
  ): Promise<[number, number]> {
    let marketplaceEvents: MarketplaceEventsEntity[] = [];

    for (let i = 0; i < batch.length; i++) {
      const log = batch[i];
      const txHash = log._id;
      const originalTxHash = log._source.originalTxHash;
      const events = log._source.events;
      const timestamp = log._source.timestamp;

      for (let j = 0; j < events.length; j++) {
        const event = events[j];

        if (event.address !== marketplaceAddress) {
          continue;
        }

        const marketplaceEvent = new MarketplaceEventsEntity({
          txHash: txHash,
          originalTxHash: originalTxHash,
          order: event.order,
          marketplaceAddress: marketplaceAddress,
          timestamp: timestamp,
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
