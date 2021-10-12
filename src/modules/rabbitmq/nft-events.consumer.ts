import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { NftEventsService } from './nft-events.service';
import { PublicRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class NftTransactionsConsumer {
  constructor(private readonly nftTransactionsService: NftEventsService) {}

  @PublicRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    await this.nftTransactionsService.handleNftAuctionEnded(
      nftAuctionEvents?.events?.filter(
        (e: { address: any }) =>
          e.address === elrondConfig.nftMarketplaceAddress,
      ),
      nftAuctionEvents.hash,
    );
  }
}
