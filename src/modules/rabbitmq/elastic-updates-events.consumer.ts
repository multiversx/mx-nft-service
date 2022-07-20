import { Injectable } from '@nestjs/common';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { ElasticUpdatesEventsService } from './elastic-updates-events.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class ElasiticUpdatesConsumer {
  constructor(
    private readonly elasticUpdateService: ElasticUpdatesEventsService,
  ) {}

  @CompetingRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE_ELASTIC,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeMintEvents(mintEvents: any) {
    if (!mintEvents.events) {
      return;
    }
    if (process.env.ENABLE_ELASTIC_UPDATES === 'true') {
      await Promise.all([
        this.elasticUpdateService.handleNftMintEvents(
          mintEvents?.events?.filter(
            (e: { identifier: NftEventEnum }) =>
              e.identifier === NftEventEnum.ESDTNFTCreate,
          ),
          mintEvents.hash,
        ),
        this.elasticUpdateService.handleRaritiesForNftMintAndBurnEvents(
          mintEvents?.events?.filter(
            (e: { identifier: NftEventEnum }) =>
              e.identifier === NftEventEnum.ESDTNFTCreate ||
              e.identifier === NftEventEnum.ESDTNFTBurn,
          ),
        ),
      ]);
    }
  }
}
