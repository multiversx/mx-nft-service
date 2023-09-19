import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { BuyEventAnalyticsParser } from './events-parsers/buy-event-analytics.parser';
import { AcceptOfferEventAnalyticsParser } from './events-parsers/acceptOffer-event-analytics.parser';
import { PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AnalyticsDataSetterService } from 'src/common/persistence/timescaledb/analytics-data.setter.service';
import BigNumber from 'bignumber.js';
import { analyticsEventsEnum } from './analyticsEventsEnum';
import { ListingAuctionAnalyticsHandler } from './events-parsers/listing-event-analytics.parser';
import { UpdateListingEventParser } from './events-parsers/updateListing-event.parser';
import { UpdatePriceEventParser } from './events-parsers/updatePrice-event.parser';

@Injectable()
export class AnalyticsService {
  private filterAddresses: string[];
  private data: any[];

  constructor(
    private readonly indexerService: ElasticAnalyticsService,
    private readonly marketplacesService: MarketplacesService,
    private readonly logger: Logger,
    private readonly buyEventHandler: BuyEventAnalyticsParser,
    private readonly acceptEventParser: AcceptOfferEventAnalyticsParser,
    private readonly startAuctionEventParser: ListingAuctionAnalyticsHandler,
    private readonly updatePriceEventParser: UpdatePriceEventParser,
    private readonly updateListingEventParser: UpdateListingEventParser,
    private readonly dataSetterService: AnalyticsDataSetterService,
  ) {}

  public async indexAnalyticsLogs(startDateUtc: number, endDateUtc: number): Promise<void> {
    try {
      const performanceProfiler = new PerformanceProfiler();
      const tokens = await this.fetchLogsUsingScrollApi(startDateUtc, endDateUtc);

      performanceProfiler.stop();

      this.logger.log(`Finish indexing analytics data. Elapsed time: ${moment(performanceProfiler.duration).format('HH:mm:ss')}`);
      return tokens;
    } catch (error) {
      this.logger.log(error);
    }
  }

  public async processEvents(
    rawEvents: any[],
    startDateUtc: number,
    eventsTimestamp: number,
    isSingleEvent: boolean = false,
    ingestLast: boolean = false,
  ): Promise<void> {
    const marketplaceAddresses = await this.marketplacesService.getMarketplacesAddreses();
    const performanceProfiler = new PerformanceProfiler();

    const events: any[] = rawEvents.filter(
      (rawEvent: { address: string; identifier: string }) =>
        marketplaceAddresses?.find((filterAddress) => rawEvent.address === filterAddress) !== undefined,
    );

    if (events.length === 0) {
      return;
    }
    this.data = [];
    for (const rawEvent of events) {
      try {
        let parsedEvent = await this.getParsedEvent(rawEvent, eventsTimestamp);
        if (parsedEvent) this.updateIngestData(parsedEvent);
      } catch (error) {
        if (error?.message?.includes('Cannot create address from')) {
          this.logger.log('Invalid event');
        } else {
          this.logger.log(`Could not process event:`, rawEvent);
          this.logger.log(error);
        }
        continue;
      }
    }
    performanceProfiler.stop();

    if (Object.keys(this.data).length > 0) {
      const isAfter = moment(eventsTimestamp * 1000).isSameOrAfter(startDateUtc);
      if (isAfter) {
        await this.ingestEvent(isSingleEvent, eventsTimestamp, ingestLast);
      }
    }
  }

  private async fetchLogsUsingScrollApi(startDateUtc: number, endDateUtc: number): Promise<void> {
    this.logger.log(`Scroll logs between '${startDateUtc}' and '${endDateUtc}'`);

    let scrollPage = 0;
    let lastBlockLogs = [];
    return await this.getProcessedEvents(startDateUtc, endDateUtc, scrollPage, lastBlockLogs);
  }

  private async getProcessedEvents(startDateUtc: number, endDateUtc: number, scrollPage: number, lastBlockLogs: any[]) {
    this.filterAddresses = await this.marketplacesService.getMarketplacesAddreses();

    await this.indexerService.getAllEvents(startDateUtc, endDateUtc, analyticsEventsEnum, this.filterAddresses, async (logs: any[]) => {
      this.logger.log(`Fetched ${logs.length} logs on page ${scrollPage}`);
      scrollPage += 1;

      const { blockLogsLength, blockLogs } = this.getBlocksGroupedByTimestamp(logs, lastBlockLogs);
      for (let i = 0; i < blockLogsLength; i++) {
        const eventsRaw = blockLogs[i].map((logs: { events: any }) => logs.events).flat();

        const events = eventsRaw.filter((event: { identifier: string }) => analyticsEventsEnum.includes(event.identifier));

        await this.processEvents(events, startDateUtc, blockLogs[i][0]?.timestamp);
      }

      this.logger.log(`Fetched blocks: ${blockLogs.length}; processed: ${blockLogsLength}`);
      if (blockLogs.length > 0) {
        lastBlockLogs = blockLogs[blockLogs.length - 1];
      }
    });
    const eventsRaw = lastBlockLogs.map((logs) => logs.events).flat();
    const events = eventsRaw.filter((event) => analyticsEventsEnum.includes(event.identifier));
    await this.processEvents(events, startDateUtc, lastBlockLogs[0].timestamp, false, true);
  }

  private getBlocksGroupedByTimestamp(logs: any[], lastBlockLogs: any[]) {
    const groupedLogs = logs.groupBy((log) => log.timestamp);

    const blockLogs = Array.from(Object.keys(groupedLogs).sort()).map((key) => groupedLogs[key]);
    if (blockLogs.length > 0) {
      blockLogs[0] = [...lastBlockLogs, ...blockLogs[0]];

      this.logger.log(`Remained logs from last block: ${lastBlockLogs.length}`);
    } else {
      blockLogs.push(lastBlockLogs);
    }

    const blockLogsLength = blockLogs.length === 0 ? blockLogs.length : blockLogs.length - 1;
    return { blockLogsLength, blockLogs };
  }

  private async getParsedEvent(rawEvent: any, eventsTimestamp: number) {
    let parsedEvent = undefined;
    switch (rawEvent.identifier) {
      case AuctionEventEnum.AcceptOffer:
      case ExternalAuctionEventEnum.AcceptGlobalOffer:
        parsedEvent = await this.acceptEventParser.handle(rawEvent, eventsTimestamp);
        break;
      case AuctionEventEnum.BuySftEvent:
      case AuctionEventEnum.BidEvent:
      case ExternalAuctionEventEnum.BulkBuy:
      case ExternalAuctionEventEnum.Buy:
      case ExternalAuctionEventEnum.BuyNft:
      case ExternalAuctionEventEnum.BuyFor:
        parsedEvent = await this.buyEventHandler.handle(rawEvent, eventsTimestamp);
        break;
      case AuctionEventEnum.AuctionTokenEvent:
      case ExternalAuctionEventEnum.ListNftOnMarketplace:
      case ExternalAuctionEventEnum.Listing:
      case KroganSwapAuctionEventEnum.NftSwap:
        parsedEvent = await this.startAuctionEventParser.handle(rawEvent, eventsTimestamp);
        break;
      case ExternalAuctionEventEnum.ChangePrice:
      case ExternalAuctionEventEnum.UpdatePrice:
        parsedEvent = await this.updatePriceEventParser.handle(rawEvent, eventsTimestamp);
        break;

      case ExternalAuctionEventEnum.UpdateListing:
        parsedEvent = await this.updateListingEventParser.handle(rawEvent, eventsTimestamp);
        break;
    }
    return parsedEvent;
  }

  private async ingestEvent(singleEvent: boolean, eventsTimestamp: number, ingestLast: boolean = false) {
    if (singleEvent) {
      await this.dataSetterService.ingestSingleEvent({
        data: this.data,
        timestamp: eventsTimestamp,
      });
    } else {
      await this.dataSetterService.ingest({
        data: this.data,
        timestamp: eventsTimestamp,
        ingestLast: ingestLast,
      });
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
            ? new BigNumber(this.data[series][measure]).plus(eventData[series][measure]).toFixed()
            : eventData[series][measure];
        }
        if (measure.toLowerCase().includes('volumeUSD')) {
          this.data[series][measure] = this.data[series][measure]
            ? new BigNumber(this.data[series][measure]).plus(eventData[series][measure]).toFixed()
            : eventData[series][measure];
        }
        if (measure.toLowerCase().includes('floorPrice')) {
          this.data[series][measure] = eventData[series][measure];
        }
        if (measure.toLowerCase().includes('floorPriceUSD')) {
          this.data[series][measure] = eventData[series][measure];
        } else {
          this.data[series][measure] = eventData[series][measure];
        }
      }
    }
  }
}
