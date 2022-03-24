import { Inject, Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { NftEventsService } from './nft-events.service';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';

@Injectable()
export class NftTransactionsConsumer {
  constructor(
    private readonly nftTransactionsService: NftEventsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @CompetingRabbitConsumer({
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    await this.nftTransactionsService.handleNftMintEvents(
      nftAuctionEvents?.events?.filter(
        (e: { identifier: NftEventEnum }) =>
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
  }
}
