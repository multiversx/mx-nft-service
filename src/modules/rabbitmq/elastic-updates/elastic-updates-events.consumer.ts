import { Injectable } from '@nestjs/common';
import {
  MarketplaceEventEnum,
  NftEventEnum,
} from '../../assets/models/AuctionEvent.enum';
import { CompetingRabbitConsumer } from '../rabbitmq.consumers';
import { ElasticUpdatesEventsService } from './elastic-updates-events.service';

@Injectable()
export class ElasiticUpdatesConsumer {
  constructor(
    private readonly elasticUpdateService: ElasticUpdatesEventsService,
  ) {}

  @CompetingRabbitConsumer({
    connection: 'default',
    queueName: process.env.RABBITMQ_QUEUE_ELASTIC,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeMintBurnAndUpdateEvents(events: any) {
    if (events.events && process.env.ENABLE_ELASTIC_UPDATES === 'true') {
      const mintNftEvents = events?.events?.filter(
        (e: { identifier: NftEventEnum }) =>
          e.identifier === NftEventEnum.ESDTNFTCreate,
      );
      const burnNftEvents = events?.events?.filter(
        (e: { identifier: NftEventEnum }) =>
          e.identifier === NftEventEnum.ESDTNFTBurn,
      );
      const updateNftAttributesEvents = events?.events?.filter(
        (e: { identifier: NftEventEnum }) =>
          e.identifier === NftEventEnum.ESDTNFTUpdateAttributes,
      );
      const mintBurnAndUpdateNftAttributesEvents = [
        ...mintNftEvents,
        ...burnNftEvents,
        ...updateNftAttributesEvents,
      ];
      const scUpgradeEvents = events?.events?.filter(
        (e: { identifier: MarketplaceEventEnum }) =>
          e.identifier === MarketplaceEventEnum.SCUpgrade,
      );

      await Promise.all([
        this.elasticUpdateService.handleNftMintEvents(
          mintNftEvents,
          events.hash,
        ),
        this.elasticUpdateService.handleTraitsForNftMintBurnAndUpdateEvents(
          mintBurnAndUpdateNftAttributesEvents,
        ),
        this.elasticUpdateService.handleRaritiesForNftMintBurnAndUpdateEvents(
          mintBurnAndUpdateNftAttributesEvents,
        ),
        this.elasticUpdateService.handleScamInfoForNftMintBurnAndUpdateEvents(
          mintBurnAndUpdateNftAttributesEvents,
        ),
        this.elasticUpdateService.handleMarketplaceScUpgradeEvents(
          scUpgradeEvents,
        ),
      ]);
    }
  }
}
