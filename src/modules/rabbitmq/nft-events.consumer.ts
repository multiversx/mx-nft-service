import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
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
    await this.nftTransactionsService.handleNftMintEvents(
      nftAuctionEvents?.events?.filter(
        (e) => e.identifier === NftEventEnum.ESDTNFTCreate,
      ),
      nftAuctionEvents.hash,
    );
    await this.nftTransactionsService.handleNftAuctionEvents(
      nftAuctionEvents?.events?.filter(
        (e: { address: any }) =>
          e.address === elrondConfig.nftMarketplaceAddress,
      ),
      nftAuctionEvents.hash,
    );
  }
}
