import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { NftEventsService } from './nft-events.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class NftTransactionsConsumer {
  constructor(private readonly nftTransactionsService: NftEventsService) {}

  @CompetingRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    await this.nftTransactionsService.handleNftAuctionEvents(
      nftAuctionEvents?.events?.filter(
        (e: { address: any }) =>
          e.address === elrondConfig.nftMarketplaceAddress,
      ),
      nftAuctionEvents.hash,
    );
  }
}
