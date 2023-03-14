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
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';

@Injectable()
export class AnalyticsService {
  private filterAddresses: string[];
  private data: any[] = [];

  constructor(
    private readonly indexerService: ElasticAnalyticsService,
    private readonly marketplacesService: MarketplacesService,
    private readonly cacheService: CachingService,
    private readonly logger: Logger,
    private readonly buyEventHandler: BuyEventParser,
    private readonly acceptEventParser: AcceptOfferEventParser,
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
    ({ scrollPage, lastBlockLogs } = await this.getParsedEvents(
      startDateUtc,
      endDateUtc,
      scrollPage,
      lastBlockLogs,
    ));

    return await this.getTrendingCollections();
  }

  private async getTrendingCollections(): Promise<void> {
    const tokensWithPrice = await this.getTokensWithDetails();
    // const collections = this.getDataGroupedByCollectionAndToken();
    // let trending = [];
    // for (const collection of collections) {
    //   let priceUsd: BigNumber = new BigNumber(0);

    //   for (const token of collection.tokens) {
    //     const tokenDetails = tokensWithPrice[token.paymentToken];
    //     if (
    //       tokenDetails &&
    //       tokenDetails.length > 0 &&
    //       tokenDetails[0].usdPrice
    //     ) {
    //       priceUsd = priceUsd.plus(
    //         computeUsd(
    //           tokenDetails[0].usdPrice,
    //           token.sum,
    //           tokenDetails[0].decimals,
    //         ),
    //       );
    //     }
    //   }
    //   trending.push({
    //     collection: collection.collection,
    //     volume: priceUsd.toString(),
    //     tokens: collection.tokens,
    //   });
    // }
    // return trending.sortedDescending((x) => parseFloat(x.volume));
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

        console.log('blockLogs', JSON.stringify(blockLogs));
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

          console.log(JSON.stringify(eventsRaw));
          const events = eventsRaw.filter((event: { identifier: string }) =>
            trendingEventsEnum.includes(event.identifier),
          );

          await this.processEvents(events);
        }

        this.logger.log(
          `Fetched blocks: ${blockLogs.length}; processed: ${blockLogsLength}`,
        );
        if (blockLogs.length > 0) {
          lastBlockLogs = blockLogs[blockLogs.length - 1];
        }
      },
    );
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
            sum: group.values
              .sumBigInt((x: { value: BigInt }) => BigInt(x.value.toString()))
              .toString(),
          })),
      }));
  }

  private async getTokensWithDetails() {
    console.log({ date: this.data });
    // const tokens = [...new Set(this.data.map((item) => item.paymentToken))];
    // let tokensWithPrice = [];
    // for (const token of tokens) {
    //   const tokenData = await this.usdPriceService.getToken(token);
    //   tokensWithPrice.push({
    //     key: token,
    //     usdPrice: tokenData.priceUsd,
    //     decimals: tokenData.decimals,
    //   });
    // }
    // return tokensWithPrice.groupBy((t) => t.key);
  }

  async getFilterAddresses(): Promise<void> {
    this.filterAddresses = [];
    this.filterAddresses =
      await this.marketplacesService.getMarketplacesAddreses();
  }

  private async processEvents(rawEvents: any[]): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();

    const events: GenericEvent[] = rawEvents.filter(
      (rawEvent: { address: string; identifier: string }) =>
        this.filterAddresses.find(
          (filterAddress) => rawEvent.address === filterAddress,
        ) !== undefined,
    );

    if (events.length === 0) {
      return;
    }

    for (const rawEvent of events) {
      try {
        let parsedEvent = undefined;
        switch (rawEvent.getIdentifier()) {
          case AuctionEventEnum.AcceptOffer:
          case ExternalAuctionEventEnum.AcceptGlobalOffer:
            [parsedEvent] = await this.acceptEventParser.handle(rawEvent);
            break;
          case AuctionEventEnum.BuySftEvent:
          case ExternalAuctionEventEnum.BulkBuy:
          case ExternalAuctionEventEnum.Buy:
          case ExternalAuctionEventEnum.BuyNft:
          case ExternalAuctionEventEnum.BuyFor:
            [parsedEvent] = await this.buyEventHandler.handle(rawEvent);
            break;
          // case AuctionEventEnum.AuctionTokenEvent:
          // case ExternalAuctionEventEnum.Listing:
          // case ExternalAuctionEventEnum.ListNftOnMarketplace:
          //   parsedEvent = await this.buyEventHandler.handle(rawEvent);
          //   break;
        }

        console.log({ parsedEvent });
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
