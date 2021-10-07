import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { NftEventsService } from './nft-events.service';
import { PublicRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class NftTransactionsConsumer {
  constructor(private readonly nftTransactionsService: NftEventsService) {}

  @PublicRabbitConsumer()
  async consumeAuctionEvents(nftAuctionEvents: any) {
    console.log({ nftAuctionEndedEvent: nftAuctionEvents });
    await this.nftTransactionsService.handleNftAuctionEnded(
      nftAuctionEvents.filter(
        (e: { address: any }) =>
          e.address === elrondConfig.nftMarketplaceAddress,
      ),
      nftAuctionEvents.hash,
    );
  }
}
