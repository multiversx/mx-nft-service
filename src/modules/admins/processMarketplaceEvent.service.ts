import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { MarketplaceTypeEnum } from '../marketplaces/models/MarketplaceType.enum';
import { MarketplaceEventsService } from '../rabbitmq/blockchain-events/marketplace-events.service';
import {ElasticQuery,QueryType,RangeGreaterThanOrEqual,ElasticSortOrder, MatchQuery} from '@multiversx/sdk-nestjs-elastic';

@Injectable()
export class ProcessMarketplaceEventService {
  constructor(
    private elasticUpdater: MxElasticService,
    private marketplaceEventsService: MarketplaceEventsService,

    private readonly logger: Logger,
  ) {}

  public async updateCollectionNftsNSFWByAdmin(
    marketplaceAddress: string,
    eventName: string,
  ) {
    try {
      this.logger.log(
        `Get events for '${marketplaceAddress}' with event name ${eventName}`,
      );

      const query = ElasticQuery.create()
        .withMustCondition(QueryType.Nested('events', [new MatchQuery('events.address', marketplaceAddress)]))
        .withMustCondition(QueryType.Nested('events', [new MatchQuery('events.identifier', eventName)]))
        .withRangeFilter('timestamp', new RangeGreaterThanOrEqual(1678468260))
        .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
        .withPagination({ from: 0, size: 10000 });

      await this.elasticUpdater.getScrollableList(
        'logs',
        'identifier',
        query,
        async (items) => {
          await this.updateCollectionNfts(items);
        },
      );
      return true;
    } catch (error) {
      this.logger.error(
        'An error occurred while updating NSFW for collection',
        {
          identifier: marketplaceAddress,
          path: 'FlagNftService.updateCollectionNftsNSFWByAdmin',
          exception: error?.message,
        },
      );
      return false;
    }
  }
  async updateCollectionNfts(items: any[]) {
    for (const log of items) {
      await this.marketplaceEventsService.handleNftAuctionEvents(
        log.events,
        log.identifier,
        MarketplaceTypeEnum.External,
      );
    }
  }
}
