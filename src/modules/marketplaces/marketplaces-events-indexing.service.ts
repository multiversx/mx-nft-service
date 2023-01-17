import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplacesService } from './marketplaces.service';
import { MxElasticService } from 'src/common';
import { constants } from 'src/config';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { DateUtils } from 'src/utils/date-utils';
import {
  ElasticQuery,
  ElasticSortOrder,
  QueryConditionOptions,
  QueryType,
  RangeGreaterThan,
  RangeLowerThan,
} from '@elrondnetwork/erdnest';
import { Locker } from 'src/utils/locker';
import { MarketplaceEventsIndexingRequest } from './models/MarketplaceEventsIndexingRequest';
import { UpdateListingEventHandler } from '../rabbitmq/blockchain-events/handlers/updateListing-event.handler';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { ExternalAuctionEventEnum } from '../assets/models';
import { OrderEntity } from 'src/db/orders';
import { OrderStatusEnum } from '../orders/models';
import { AuctionEntity } from 'src/db/auctions';

@Injectable()
export class MarketplaceEventsIndexingService {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceService: PersistenceService,
    private readonly marketplaceService: MarketplacesService,
    private readonly marketplacesCachingService: MarketplacesCachingService,
    private readonly mxElasticService: MxElasticService,
    private readonly updateListingEventHandler: UpdateListingEventHandler, //private readonly
  ) {}

  async reindexAllMarketplaceEvents(
    stopIfDuplicates: boolean = true,
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
    marketplaces.map(async (marketplace) => {
      await Locker.lock(
        `${this.reindexLatestMarketplacesEvents.name} for ${marketplace}`,
        async () => {
          const marketplaceLastIndexTimestamp =
            await this.getMarketplaceLastIndexTimestamp(marketplace);
          await this.reindexMarketplaceEvents(
            new MarketplaceEventsIndexingRequest({
              marketplaceAddress: marketplace,
              afterTimestamp: marketplaceLastIndexTimestamp,
              stopIfDuplicates: true,
            }),
          );
        },
        true,
      );
    });
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
        newestTimestamp &&
        (!input.marketplaceLastIndexTimestamp ||
          newestTimestamp > input.marketplaceLastIndexTimestamp)
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

    await this.mxElasticService.getScrollableList(
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

  async test(): Promise<void> {
    // after this timestamp, the events were live indexed on staging
    // 1673866608 - staing
    // 1673875681 - mainnet
    const lt = 1673866608;

    const saveEvents = false;
    const processEvents = false;
    const processOrders = true;

    const fileName = 'allEvents-staging.json';
    var fs = require('fs');

    let allEventObjects = [];

    if (saveEvents) {
      const query = ElasticQuery.create()
        .withCondition(
          QueryConditionOptions.should,
          QueryType.Must([
            QueryType.Nested('events', {
              'events.address':
                'erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8',
            }),
            QueryType.Nested('events', {
              'events.identifier': 'changeListing',
            }),
          ]),
        )
        .withRangeFilter('timestamp', new RangeLowerThan(lt))
        .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

      await this.mxElasticService.getScrollableList(
        'logs',
        'identifier',
        query,
        async (eventObjects) => {
          for (const eventObject of eventObjects) {
            console.log(eventObject.timestamp);
            allEventObjects.push(eventObject);
          }
        },
      );

      console.log(
        allEventObjects.length,
        allEventObjects[0].timestamp,
        allEventObjects[allEventObjects.length - 1].timestamp,
      );

      fs.writeFile(fileName, JSON.stringify(allEventObjects), function (err) {
        if (err) {
          console.log(err);
        }
      });
    }

    let updatedAuctions: AuctionEntity[] = [];
    const uppdatedAuctionsFileName = 'output.json';
    if (processEvents) {
      try {
        if (allEventObjects.length === 0) {
          allEventObjects = JSON.parse(
            fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' }),
          );
        }

        for (const eventObject of allEventObjects) {
          for (const event of eventObject.events) {
            //console.log(JSON.stringify(event));
            try {
              if (event.identifier === ExternalAuctionEventEnum.UpdateListing) {
                const auction = await this.updateListingEventHandler.handle(
                  event,
                  '',
                  MarketplaceTypeEnum.External,
                );

                if (!auction) {
                  continue;
                }

                let a: AuctionEntity = updatedAuctions.find(
                  (a) => a.id === auction.id,
                );
                if (a) {
                  a = auction;
                } else {
                  updatedAuctions.push(auction);
                }
              }
            } catch (error) {
              console.log(error);
              throw error;
            }
          }
        }

        fs.writeFile(
          uppdatedAuctionsFileName,
          JSON.stringify(updatedAuctions),
          function (err) {
            if (err) {
              console.log(err);
            }
          },
        );
      } catch (error) {
        console.log(error);
      }
    }

    try {
      let updatedOrdersCnt = 0;
      if (processOrders) {
        if (updatedAuctions.length === 0) {
          updatedAuctions = JSON.parse(
            fs.readFileSync(uppdatedAuctionsFileName, {
              encoding: 'utf8',
              flag: 'r',
            }),
          );
        }
        // get all orders where bought
        const dbBatchSize = 10;
        for (let i = 0; i < updatedAuctions.length; i += dbBatchSize) {
          const ids = updatedAuctions
            .slice(i, i + dbBatchSize)
            .map((a) => a.id);

          //console.log(ids);

          let ordersRes: any =
            await this.persistenceService.getOrdersByAuctionIds(ids);

          let orders = [];

          for (const id of ids) {
            if (ordersRes[id]) {
              orders.push(ordersRes[id][0]);
              //console.log(JSON.stringify(ordersRes[id][0]));
            }
          }

          if (
            !orders ||
            // !orders[0] ||
            orders.length === 0
            // orders.entries?.length === 0 ||
            // orders.keys?.length === 0 ||
            // orders.toString() === '{}'
          ) {
            continue;
          }

          //console.log(JSON.stringify(orders));

          // for (const [a, b] of orders.entries) {
          //   console.log('a', a);
          //   console.log('b', b);
          // }

          for (let order of orders) {
            if (order.status === OrderStatusEnum.Bought) {
              const auction = updatedAuctions.find(
                (a) => a.id === order.auctionId,
              );

              if (auction.maxBid && order.priceAmount !== auction.maxBid) {
                console.log(
                  `o.id ${order.id} ${order.priceAmount} -> ${auction.maxBid}`,
                );

                order.priceAmount = auction.maxBid;
                order.priceAmountDenominated = auction.maxBidDenominated;
              }

              if (
                auction.paymentToken &&
                order.priceToken !== auction.paymentToken
              ) {
                console.log(
                  `o.id ${order.id} ${order.priceToken} -> ${auction.paymentToken}`,
                );

                order.priceToken = auction.paymentToken;
              }

              if (auction.paymentNonce && order.priceNonce !== auction.paymentNonce) {
                console.log(
                  `o.id ${order.id} ${order.priceNonce} -> ${auction.paymentNonce}`,
                );

                order.priceNonce = auction.paymentNonce;
              }

              updatedOrdersCnt++;

              //await this.persistenceService.saveOrder(order);
            }
          }

          // fs.writeFile(
          //   'updatedOrders.json',
          //   JSON.stringify(updatedOrdersCnt),
          //   function (err) {
          //     if (err) {
          //       console.log(err);
          //     }
          //   },
          // );
        }

        console.log(updatedOrdersCnt);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
