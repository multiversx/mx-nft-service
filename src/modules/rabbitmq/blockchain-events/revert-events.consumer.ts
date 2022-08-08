import { Injectable } from '@nestjs/common';
import { CompetingRabbitConsumer } from '../rabbitmq.consumers';
import { RevertEventsService } from './revert.events.service';

@Injectable()
export class RevertEventsConsumer {
  constructor(private readonly nftTransactionsService: RevertEventsService) {}

  @CompetingRabbitConsumer({
    connection: 'default',
    queueName: process.env.RABBITMQ_QUEUE_REVERT,
    exchange: process.env.RABBITMQ_EXCHANGE_REVERT,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE_REVERT,
  })
  async consumeRevertEvents(nftAuctionEvents: any) {
    if (nftAuctionEvents.events) {
      await this.nftTransactionsService.handleNftAuctionEnded(nftAuctionEvents);
    }
  }
}
