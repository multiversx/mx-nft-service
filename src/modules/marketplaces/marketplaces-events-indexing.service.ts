import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { MarketplaceFilters } from './models/Marketplace.Filter';
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
    private readonly persistenceService: PersistenceService,
    private readonly marketplaceService: MarketplacesService,
    private readonly marketplacesCachingService: MarketplacesCachingService,
    private readonly elrondElasticService: ElrondElasticService,
  ) {}

  async reindexLatestMarketplacesEvents(events: any[]): Promise<void> {
    const marketplaces: string[] = [
      ...new Set(events.map((event) => String(event.address))),
    ];
    for (let i = 0; i < marketplaces.length; i++) {
      const [
        marketplaceKey,
        marketplaceAddress,
        marketplaceLastIndexTimestamp,
      ] = await this.getMarketplaceKeyAddressAndLastIndexTimestamp(
        new MarketplaceFilters({ marketplaceAddress: marketplaces[i] }),
      );
      await this.reindexMarketplaceEvents(
        new MarketplaceFilters({
          marketplaceAddress,
          marketplaceKey,
        }),
        DateUtils.getCurrentTimestamp(),
        marketplaceLastIndexTimestamp,
      );
    }
  }

  async reindexMarketplaceEvents(
    filters: MarketplaceFilters,
    beforeTimestamp?: number,
    afterTimestamp?: number,
    stopIfDuplicates?: boolean,
    marketplaceLastIndexTimestamp?: number,
  ): Promise<[number, number]> {
    if (!filters.marketplaceAddress && !filters.marketplaceKey) {
      throw new Error('Marketplace Address or Key should be provided.');
    }

    if (beforeTimestamp < afterTimestamp) {
      throw new Error(`beforeTimestamp can't be less than afterTimestamp`);
    }

    let marketplaceAddress = filters.marketplaceAddress;
    let marketplaceKey = filters.marketplaceKey;

    if (
      marketplaceAddress ||
      marketplaceKey ||
      !marketplaceLastIndexTimestamp
    ) {
      [marketplaceKey, marketplaceAddress, marketplaceLastIndexTimestamp] =
        await this.getMarketplaceKeyAddressAndLastIndexTimestamp(filters);
    }

    const size = constants.getLogsFromElasticBatchSize;
    let newestTimestamp: number;
    let oldestTimestamp: number;

    do {
      const [batch, batchSize, timestamp] =
        await this.elrondElasticService.getAddressHistory(
          marketplaceAddress,
          size,
          oldestTimestamp ?? beforeTimestamp,
          afterTimestamp,
        );

      if (batchSize === 0) {
        break;
      }

      oldestTimestamp = timestamp;

      if (!newestTimestamp) {
        newestTimestamp = batch[0]._source.timestamp;
      }

      const [savedItemsCount, totalEventsCount] = await this.saveEventsToDb(
        batch,
        marketplaceKey,
        marketplaceAddress,
      );

      if (stopIfDuplicates && savedItemsCount !== totalEventsCount) {
        break;
      }
    } while (true);

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
  }

  private async getMarketplaceKeyAddressAndLastIndexTimestamp(
    filters: MarketplaceFilters,
  ): Promise<[string, string, number]> {
    let marketplaceAddress = filters.marketplaceAddress;
    let marketplaceKey = filters.marketplaceKey;
    let marketplaceLastIndexTimestamp: number;

    if (!marketplaceAddress) {
      marketplaceAddress = await this.getMarketplaceAddressByKey(
        marketplaceKey,
      );
    }

    [marketplaceKey, marketplaceAddress, marketplaceLastIndexTimestamp] =
      await this.getMarketplaceKeyAndLastIndexTimestamp(marketplaceAddress);

    return [marketplaceKey, marketplaceAddress, marketplaceLastIndexTimestamp];
  }

  private async getMarketplaceKeyAndLastIndexTimestamp(
    marketplaceAddress: string,
  ): Promise<[string, string, number]> {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      marketplaceAddress,
    );
    const marketplaceKey = marketplace.key;
    const marketplaceLastIndexTimestamp = marketplace.lastIndexTimestamp;
    return [marketplaceKey, marketplaceAddress, marketplaceLastIndexTimestamp];
  }

  private async getMarketplaceAddressByKey(
    marketplaceKey: string,
  ): Promise<string> {
    const marketplaces = await this.marketplaceService.getMarketplaceByKey(
      marketplaceKey,
    );
    return marketplaces[0];
  }

  private async saveEventsToDb(
    batch: HitResponse[],
    marketplaceKey: string,
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
          tx_hash: txHash,
          original_tx_hash: originalTxHash,
          order: event.order,
          marketplace_key: marketplaceKey,
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
