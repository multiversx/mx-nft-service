import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import {
  CollectionEventEnum,
  NftEventEnum,
} from '../assets/models/AuctionEvent.enum';
import { MinterEventsService } from './minter-events.service';
import { NftEventsService } from './nft-events.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';

@Injectable()
export class NftTransactionsConsumer {
  constructor(
    private readonly nftTransactionsService: NftEventsService,
    private readonly minterEventsService: MinterEventsService,
  ) {}

  @CompetingRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    const minters = process.env.MINTERS_ADDRESSES.split(',').map((entry) => {
      return entry.toLowerCase().trim();
    });
    await this.nftTransactionsService.handleNftMintEvents(
      nftAuctionEvents?.events?.filter(
        (e: { identifier: NftEventEnum | CollectionEventEnum }) =>
          e.identifier === NftEventEnum.ESDTNFTCreate ||
          e.identifier === NftEventEnum.ESDTNFTTransfer,
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

    await this.minterEventsService.handleNftMintEvents(
      nftAuctionEvents?.events?.filter((e: { address: any }) =>
        minters.includes(e.address),
      ),
      nftAuctionEvents.hash,
    );
  }
}
