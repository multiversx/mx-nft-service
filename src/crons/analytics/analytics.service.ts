import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { trendingEventsEnum } from './trendingEventsEnum';
import { BuyEventParser } from './buy-event.parser';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AcceptOfferEventParser } from './acceptOffer-event.parser';
import { CollectionVolumeLast24 } from './collection-volume';
import { CachingService, PerformanceProfiler } from '@multiversx/sdk-nestjs';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import {
  AuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import { AnalyticsDataSetterService } from 'src/common/persistence/timescaledb/analytics-data.setter.service';
import BigNumber from 'bignumber.js';

@Injectable()
export class AnalyticsService {
  private filterAddresses: string[];
  private data: any[];

  constructor(
    private readonly indexerService: ElasticAnalyticsService,
    private readonly marketplacesService: MarketplacesService,
    private readonly cacheService: CachingService,
    private readonly logger: Logger,
    private readonly buyEventHandler: BuyEventParser,
    private readonly acceptEventParser: AcceptOfferEventParser,
    private readonly dataSetterService: AnalyticsDataSetterService,
  ) {}

  public async getTrendingByVolume(): Promise<CollectionVolumeLast24[]> {
    return await this.cacheService.getCache(CacheInfo.TrendingByVolume.key);
  }

  public async reindexTrendingCollections(
    startDateUtc: number,
    endDateUtc: number,
  ): Promise<void> {
    try {
      const performanceProfiler = new PerformanceProfiler();

      await this.getFilterAddresses();

      const tokens = await this.fetchLogsUsingScrollApi(
        startDateUtc,
        endDateUtc,
      );

      performanceProfiler.stop();

      this.logger.log(
        `Finish indexing analytics data. Elapsed time: ${moment(
          performanceProfiler.duration,
        ).format('HH:mm:ss')}`,
      );
      return tokens;
    } catch (error) {
      this.logger.log(error);
    }
  }

  private async fetchLogsUsingScrollApi(
    startDateUtc: number,
    endDateUtc: number,
  ): Promise<void> {
    this.logger.log(
      `Scroll logs between '${startDateUtc}' and '${endDateUtc}'`,
    );

    let scrollPage = 0;
    let lastBlockLogs = [];
    return await this.getParsedEvents(
      startDateUtc,
      endDateUtc,
      scrollPage,
      lastBlockLogs,
    );
  }

  private async getParsedEvents(
    startDateUtc: number,
    endDateUtc: number,
    scrollPage: number,
    lastBlockLogs: any[],
  ) {
    await this.indexerService.getAllEvents(
      startDateUtc,
      endDateUtc,
      trendingEventsEnum,
      this.filterAddresses,
      async (logs: any[]) => {
        this.logger.log(`Fetched ${logs.length} logs on page ${scrollPage}`);
        scrollPage += 1;

        const groupedLogs = logs.groupBy((log) => log.timestamp);

        const blockLogs = Array.from(Object.keys(groupedLogs).sort()).map(
          (key) => groupedLogs[key],
        );
        if (blockLogs.length > 0) {
          blockLogs[0] = [...lastBlockLogs, ...blockLogs[0]];

          this.logger.log(
            `Remained logs from last block: ${lastBlockLogs.length}`,
          );
        } else {
          blockLogs.push(lastBlockLogs);
        }

        const blockLogsLength =
          blockLogs.length === 0 ? blockLogs.length : blockLogs.length - 1;
        for (let i = 0; i < blockLogsLength; i++) {
          const eventsRaw = blockLogs[i]
            .map((logs: { events: any }) => logs.events)
            .flat();

          const events = eventsRaw.filter((event: { identifier: string }) =>
            trendingEventsEnum.includes(event.identifier),
          );

          await this.processEvents(
            events,
            startDateUtc,
            blockLogs[i][0].timestamp,
          );
        }

        this.logger.log(
          `Fetched blocks: ${blockLogs.length}; processed: ${blockLogsLength}`,
        );
        if (blockLogs.length > 0) {
          lastBlockLogs = blockLogs[blockLogs.length - 1];
        }
      },
    );
    const eventsRaw = lastBlockLogs.map((logs) => logs.events).flat();
    const events = eventsRaw.filter((event) =>
      trendingEventsEnum.includes(event.identifier),
    );
    await this.processEvents(events, startDateUtc, startDateUtc);
  }

  async getFilterAddresses(): Promise<void> {
    this.filterAddresses = [];
    this.filterAddresses =
      await this.marketplacesService.getMarketplacesAddreses();
  }

  private async processEvents(
    rawEvents: any[],
    startDateUtc: number,
    eventsTimestamp: number,
  ): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();

    const events: any[] = rawEvents.filter(
      (rawEvent: { address: string; identifier: string }) =>
        this.filterAddresses.find(
          (filterAddress) => rawEvent.address === filterAddress,
        ) !== undefined,
    );

    if (events.length === 0) {
      return;
    }
    this.data = [];
    for (const rawEvent of events) {
      try {
        let parsedEvent = undefined;
        switch (rawEvent.identifier) {
          case AuctionEventEnum.AcceptOffer:
          case ExternalAuctionEventEnum.AcceptGlobalOffer:
            parsedEvent = await this.acceptEventParser.handle(rawEvent);
            break;
          case AuctionEventEnum.BuySftEvent:
          case ExternalAuctionEventEnum.BulkBuy:
          case ExternalAuctionEventEnum.Buy:
          case ExternalAuctionEventEnum.BuyNft:
          case ExternalAuctionEventEnum.BuyFor:
            parsedEvent = await this.buyEventHandler.handle(rawEvent);
            break;
        }

        if (parsedEvent) this.updateIngestData(parsedEvent);
      } catch (error) {
        console.log(error);
        if (error?.message?.includes('Cannot create address from')) {
          this.logger.log('Invalid event');
        } else {
          this.logger.log(`Could not process event:`, rawEvent);
          this.logger.log(error);
        }
        // throw error;
        continue;
      }
    }
    performanceProfiler.stop();

    if (Object.keys(this.data).length > 0) {
      const isAfter = moment(eventsTimestamp * 1000).isSameOrAfter(
        startDateUtc,
      );
      if (isAfter) {
        await this.dataSetterService.ingest({
          data: this.data,
          timestamp: eventsTimestamp,
          ingestLast: false,
        });
      }
    }
  }

  private updateIngestData(eventData: any[]): void {
    for (const series of Object.keys(eventData)) {
      if (this.data[series] === undefined) {
        this.data[series] = {};
      }

      for (const measure of Object.keys(eventData[series])) {
        if (measure.toLowerCase().includes('volume')) {
          this.data[series][measure] = this.data[series][measure]
            ? new BigNumber(this.data[series][measure])
                .plus(eventData[series][measure])
                .toFixed()
            : eventData[series][measure];
        }
        if (measure.toLowerCase().includes('volumeUSD')) {
          this.data[series][measure] = this.data[series][measure]
            ? new BigNumber(this.data[series][measure])
                .plus(eventData[series][measure])
                .toFixed()
            : eventData[series][measure];
        } else {
          this.data[series][measure] = eventData[series][measure];
        }
      }
    }
  }
}