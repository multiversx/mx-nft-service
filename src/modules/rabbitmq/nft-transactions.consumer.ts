import { Injectable } from '@nestjs/common';
import { NftTransactionsService } from './nft-transactions.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class NftTransactionsConsumer {
  constructor(
    private readonly nftTransactionsService: NftTransactionsService,
  ) {}

  @CompetingRabbitConsumer()
  async consumeNewNftDropEvent(nftAuctionEndedEvent: any) {
    await this.nftTransactionsService.handleNftAuctionEnded(
      nftAuctionEndedEvent,
    );
  }
}
