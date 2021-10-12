import { Injectable } from '@nestjs/common';
import { PublicRabbitConsumer } from './rabbitmq.consumers';
import { RevertEventsService } from './revert.events.service';

@Injectable()
export class RevertEventsConsumer {
  constructor(private readonly nftTransactionsService: RevertEventsService) {}

  @PublicRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE_REVERT,
    exchange: process.env.RABBITMQ_EXCHANGE_REVERT,
  })
  async consumeRevertEvents(nftAuctionEvents: any) {
    await this.nftTransactionsService.handleNftAuctionEnded(nftAuctionEvents);
  }
}
