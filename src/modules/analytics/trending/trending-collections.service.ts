import { Injectable, Logger } from '@nestjs/common';
import { PerformanceProfiler } from '../../metrics/performance.profiler';
import * as moment from 'moment';
import { ElasticAnalyticsService } from '../elastic.indexer.service';
import { analyticsEventsEnum } from '../analyticsEventsEnum';
import { MarketplacesService } from '../../marketplaces/marketplaces.service';
import BigNumber from 'bignumber.js';
import { BuyEventParser } from './buy-event.parser';
import { UsdPriceService } from '../../usdPrice/usd-price.service';
import { computeUsd } from 'src/utils/helpers';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AcceptOfferEventParser } from './acceptOffer-event.parser';
import { CollectionVolumeLast24 } from '../models/collection-volume';
import { CacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class TrendingCollectionsService {
  private filterAddresses: string[];
  private data: any[] = [];

  constructor(
    private readonly indexerService: ElasticAnalyticsService,
    private readonly marketplacesService: MarketplacesService,
    private readonly usdPriceService: UsdPriceService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
    private readonly buyEventHandler: BuyEventParser,
    private readonly acceptEventParser: AcceptOfferEventParser,
  ) {}

  public async getTrendingByVolume(): Promise<CollectionVolumeLast24[]> {
    return await this.cacheService.get(CacheInfo.TrendingByVolume.key);
  }

  public async reindexTrendingCollections(forTheLastHours: number = 24): Promise<CollectionVolumeLast24[]> {
    try {
      const performanceProfiler = new PerformanceProfiler();

      const startDateUtc = moment().add(-forTheLastHours, 'hours').format('YYYY-MM-DD HH:mm:ss');
      const endDateUtc = moment().format('YYYY-MM-DD HH:mm:ss');

      await this.getFilterAddresses();

      const tokens = await this.fetchLogsUsingScrollApi(new Date(startDateUtc).getTime(), new Date(endDateUtc).getTime());

      performanceProfiler.stop();

      this.logger.log(`Finish indexing analytics data. Elapsed time: ${moment(performanceProfiler.duration).format('HH:mm:ss')}`);
      return tokens;
    } catch (error) {
      this.logger.log(error);
    }
  }

  private async fetchLogsUsingScrollApi(startDateUtc: number, endDateUtc: number): Promise<CollectionVolumeLast24[]> {
    this.logger.log(`Scroll logs between '${startDateUtc}' and '${endDateUtc}'`);

    let scrollPage = 0;
    let lastBlockLogs = [];
    ({ scrollPage, lastBlockLogs } = await this.getParsedEvents(startDateUtc, endDateUtc, scrollPage, lastBlockLogs));

    return await this.getTrendingCollections();
  }

  private async getTrendingCollections(): Promise<CollectionVolumeLast24[]> {
    const tokensWithPrice = await this.getTokensWithDetails();
    const collections = this.getDataGroupedByCollectionAndToken();
    let trending = [];
    for (const collection of collections) {
      let priceUsd: BigNumber = new BigNumber(0);

      for (const token of collection.tokens) {
        const tokenDetails = tokensWithPrice[token.paymentToken];
        if (tokenDetails && tokenDetails.length > 0 && tokenDetails[0].usdPrice) {
          priceUsd = priceUsd.plus(computeUsd(tokenDetails[0].usdPrice, token.sum, tokenDetails[0].decimals));
        }
      }
      trending.push({
        collection: collection.collection,
        volume: priceUsd.toString(),
        tokens: collection.tokens,
      });
    }
    return trending.sortedDescending((x) => parseFloat(x.volume));
  }

  private async getParsedEvents(startDateUtc: number, endDateUtc: number, scrollPage: number, lastBlockLogs: any[]) {
    await this.indexerService.getAllEvents(startDateUtc, endDateUtc, analyticsEventsEnum, this.filterAddresses, async (logs: any[]) => {
      this.logger.log(`Fetched ${logs.length} logs on page ${scrollPage}`);
      scrollPage += 1;

      const groupedLogs = logs.groupBy((log) => log.timestamp);

      const blockLogs = Array.from(Object.keys(groupedLogs).sort()).map((key) => groupedLogs[key]);

      if (blockLogs.length > 0) {
        blockLogs[0] = [...lastBlockLogs, ...blockLogs[0]];
      } else {
        blockLogs.push(lastBlockLogs);
      }

      const blockLogsLength = blockLogs.length === 0 ? blockLogs.length : blockLogs.length - 1;
      for (let i = 0; i < blockLogsLength; i++) {
        const eventsRaw = blockLogs[i].map((logs: { events: any }) => logs.events).flat();
        const events = eventsRaw.filter((event: { identifier: string }) => analyticsEventsEnum.includes(event.identifier));

        await this.processEvents(events);
      }

      if (blockLogs.length > 0) {
        lastBlockLogs = blockLogs[blockLogs.length - 1];
      }
    });
    return { scrollPage, lastBlockLogs };
  }

  private getDataGroupedByCollectionAndToken() {
    return this.data
      .groupBy((x) => x.collection, true)
      .map((group: { key: any; values: any[] }) => ({
        collection: group.key,
        tokens: group.values
          .groupBy((g: { paymentToken: any }) => g.paymentToken, true)
          .map((group: { key: any; values: any[] }) => ({
            paymentToken: group.key,
            sum: group.values.sumBigInt((x: { value: BigInt }) => BigInt(x.value.toString())).toString(),
          })),
      }));
  }

  private async getTokensWithDetails() {
    const tokens = [...new Set(this.data.map((item) => item.paymentToken))];
    let tokensWithPrice = [];
    for (const token of tokens) {
      const tokenData = await this.usdPriceService.getToken(token);
      tokensWithPrice.push({
        key: token,
        usdPrice: tokenData.priceUsd,
        decimals: tokenData.decimals,
      });
    }
    return tokensWithPrice.groupBy((t) => t.key);
  }

  async getFilterAddresses(): Promise<void> {
    this.filterAddresses = [];
    this.filterAddresses = await this.marketplacesService.getMarketplacesAddreses();
  }

  private async processEvents(rawEvents: any[]): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();

    const events: any[] = rawEvents.filter(
      (rawEvent: { address: string; identifier: string }) =>
        this.filterAddresses.find((filterAddress) => rawEvent.address === filterAddress) !== undefined,
    );

    if (events.length === 0) {
      return;
    }

    for (const rawEvent of events) {
      try {
        let parsedEvent = undefined;
        if (rawEvent.identifier === 'acceptOffer') {
          parsedEvent = await this.acceptEventParser.handle(rawEvent);
        } else {
          parsedEvent = await this.buyEventHandler.handle(rawEvent, 'hash');
        }

        if (parsedEvent) this.data.push(parsedEvent);
      } catch (error) {
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
  }
}
