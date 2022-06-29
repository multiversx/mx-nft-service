import { Injectable } from '@nestjs/common';
import {
  CollectionEventEnum,
  NftEventEnum,
} from '../assets/models/AuctionEvent.enum';
import { ElasticUpdatesEventsService } from './elasitic-updates-events.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class ElasiticUpdatesConsumer {
  constructor(
    private readonly nftTransactionsService: ElasticUpdatesEventsService,
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
    await this.nftTransactionsService.handleNftMintEvents(
      mintEvents?.events?.filter(
        (e: { identifier: NftEventEnum | CollectionEventEnum }) =>
          e.identifier === NftEventEnum.ESDTNFTCreate,
      ),
      mintEvents.hash,
    );
  }
}
