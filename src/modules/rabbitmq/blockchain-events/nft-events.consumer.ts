import { Injectable } from '@nestjs/common';
import { NftEventEnum } from 'src/modules/assets/models';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import { MarketplaceEventsIndexingService } from 'src/modules/marketplaces/marketplaces-events-indexing.service';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { CompetingRabbitConsumer } from '../rabbitmq.consumers';
import { MarketplaceEventsService } from './marketplace-events.service';
import { MinterEventsService } from './minter-events.service';
import { NftEventsService } from './nft-events.service';
import { AnalyticsEventsService } from './analytics-events.service';

@Injectable()
export class NftEventsConsumer {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftEventsService: NftEventsService,
    private readonly marketplaceEventsService: MarketplaceEventsService,
    private readonly marketplaceEventsIndexingService: MarketplaceEventsIndexingService,
    private readonly minterEventsService: MinterEventsService,
    private readonly marketplaceService: MarketplacesService,
    private readonly analyticsEventsService: AnalyticsEventsService,
  ) {}

  @CompetingRabbitConsumer({
    connection: 'default',
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    if (nftAuctionEvents?.events) {
      const internalMarketplaces =
        await this.marketplaceService.getInternalMarketplacesAddreses();
      const externalMarketplaces =
        await this.marketplaceService.getExternalMarketplacesAddreses();

      const internalMarketplaceEvents = nftAuctionEvents?.events?.filter(
        (e: { address: any }) =>
          internalMarketplaces.includes(e.address) === true,
      );
      const externalMarketplaceEvents = nftAuctionEvents?.events?.filter(
        (e: { address: any }) =>
          externalMarketplaces.includes(e.address) === true,
      );

      const minters = process.env.MINTERS_ADDRESSES.split(',').map((entry) => {
        return entry.toLowerCase().trim();
      });
      await this.nftEventsService.handleNftMintEvents(
        nftAuctionEvents?.events?.filter(
          (e: { identifier: NftEventEnum }) =>
            e.identifier === NftEventEnum.ESDTNFTCreate ||
            e.identifier === NftEventEnum.ESDTNFTTransfer ||
            e.identifier === NftEventEnum.ESDTNFTBurn ||
            e.identifier === NftEventEnum.MultiESDTNFTTransfer,
        ),
        nftAuctionEvents.hash,
      );
      await this.marketplaceEventsService.handleNftAuctionEvents(
        internalMarketplaceEvents,
        nftAuctionEvents.hash,
        MarketplaceTypeEnum.Internal,
      );
      await this.marketplaceEventsService.handleNftAuctionEvents(
        externalMarketplaceEvents,
        nftAuctionEvents.hash,
        MarketplaceTypeEnum.External,
      );
      await this.minterEventsService.handleNftMinterEvents(
        nftAuctionEvents?.events?.filter(
          (e: { address: any }) => minters.includes(e.address) === true,
        ),
        nftAuctionEvents.hash,
      );

        await this.analyticsEventsService.handleBuyEvents(
          [...internalMarketplaceEvents,...externalMarketplaceEvents],
        );

      
      if (this.apiConfigService.isReindexMarketplaceEventsFlagActive()) {
        await this.marketplaceEventsIndexingService.reindexLatestMarketplacesEvents(
          internalMarketplaceEvents.concat(externalMarketplaceEvents),
        );
      }
    }
  }
}
