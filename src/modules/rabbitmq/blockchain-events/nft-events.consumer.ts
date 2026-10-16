import { Injectable, Logger } from '@nestjs/common';
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
import { MintersService } from 'src/modules/minters/minters.service';
import { DisabledMarketplaceEventsService } from './disable-marketplace/disable-marketplace-events.service';

const SLOW_BATCH_THRESHOLD_MS = 1000;

@Injectable()
export class NftEventsConsumer {
  private readonly logger = new Logger(NftEventsConsumer.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftEventsService: NftEventsService,
    private readonly marketplaceEventsService: MarketplaceEventsService,
    private readonly marketplaceEventsIndexingService: MarketplaceEventsIndexingService,
    private readonly minterEventsService: MinterEventsService,
    private readonly marketplaceService: MarketplacesService,
    private readonly mintersService: MintersService,
    private readonly analyticsEventsService: AnalyticsEventsService,
    private readonly disabledMarketplaceService: DisabledMarketplaceEventsService,
  ) {}

  @CompetingRabbitConsumer({
    connection: 'default',
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    if (nftAuctionEvents?.events?.length > 0) {
      const durations: { [step: string]: number } = {};
      const startTime = Date.now();
      let stepTime = startTime;
      const endStep = (step: string) => {
        const now = Date.now();
        durations[step] = now - stepTime;
        stepTime = now;
      };

      const [internalMarketplaces, externalMarketplaces, disabledMarketplaces, minters] = await Promise.all([
        this.marketplaceService.getInternalMarketplacesAddreses(),
        this.marketplaceService.getExternalMarketplacesAddreses(),
        this.marketplaceService.getDisabledMarketplacesAddreses(),
        this.mintersService.getMintersAddresses(),
      ]);
      endStep('lookups');

      const disabledMarketplacesEvents = nftAuctionEvents?.events?.filter(
        (e: { address: any }) => disabledMarketplaces.includes(e.address) === true,
      );

      const internalMarketplaceEvents = nftAuctionEvents?.events?.filter(
        (e: { address: any }) => internalMarketplaces.includes(e.address) === true,
      );
      const externalMarketplaceEvents = nftAuctionEvents?.events?.filter(
        (e: { address: any }) => externalMarketplaces.includes(e.address) === true,
      );

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
      endStep('nftEvents');
      await this.marketplaceEventsService.handleNftAuctionEvents(
        internalMarketplaceEvents,
        nftAuctionEvents.hash,
        MarketplaceTypeEnum.Internal,
      );
      endStep('internalMarketplaceEvents');
      await this.marketplaceEventsService.handleNftAuctionEvents(
        externalMarketplaceEvents,
        nftAuctionEvents.hash,
        MarketplaceTypeEnum.External,
      );
      endStep('externalMarketplaceEvents');
      await this.disabledMarketplaceService.handleAuctionEventsForDisableMarketplace(disabledMarketplacesEvents, nftAuctionEvents.hash);
      endStep('disabledMarketplaceEvents');
      await this.minterEventsService.handleNftMinterEvents(
        nftAuctionEvents?.events?.filter((e: { address: any }) => minters?.includes(e.address) === true),
        nftAuctionEvents.hash,
      );
      endStep('minterEvents');

      await this.analyticsEventsService.handleBuyEvents([...internalMarketplaceEvents, ...externalMarketplaceEvents]);
      endStep('analytics');

      if (this.apiConfigService.isReindexMarketplaceEventsFlagActive()) {
        await this.marketplaceEventsIndexingService.reindexLatestMarketplacesEvents(
          internalMarketplaceEvents.concat(externalMarketplaceEvents),
        );
      }
      endStep('reindex');

      const totalDuration = Date.now() - startTime;
      if (totalDuration >= SLOW_BATCH_THRESHOLD_MS) {
        this.logger.warn(
          `Slow events batch ${totalDuration}ms for hash '${nftAuctionEvents.hash}' (${nftAuctionEvents.events.length} events, ` +
            `${internalMarketplaceEvents.length} internal, ${externalMarketplaceEvents.length} external): ${JSON.stringify(durations)}`,
        );
      }
    }
  }
}
