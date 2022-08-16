import { Injectable } from '@nestjs/common';
import { NftEventEnum } from 'src/modules/assets/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { CompetingRabbitConsumer } from '../rabbitmq.consumers';
import { MinterEventsService } from './minter-events.service';
import { NftEventsService } from './nft-events.service';

@Injectable()
export class NftEventsConsumer {
  constructor(
    private readonly nftTransactionsService: NftEventsService,
    private readonly minterEventsService: MinterEventsService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  @CompetingRabbitConsumer({
    connection: 'default',
    queueName: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE,
  })
  async consumeAuctionEvents(nftAuctionEvents: any) {
    if (nftAuctionEvents.events) {
      const marketplaces =
        await this.marketplaceService.getInternalMarketplacesAddreses();
      const minters = process.env.MINTERS_ADDRESSES.split(',').map((entry) => {
        return entry.toLowerCase().trim();
      });
      await this.nftTransactionsService.handleNftMintEvents(
        nftAuctionEvents?.events?.filter(
          (e: { identifier: NftEventEnum }) =>
            e.identifier === NftEventEnum.ESDTNFTCreate ||
            e.identifier === NftEventEnum.ESDTNFTTransfer ||
            e.identifier === NftEventEnum.MultiESDTNFTTransfer,
        ),
        nftAuctionEvents.hash,
      );
      await this.nftTransactionsService.handleNftAuctionEvents(
        nftAuctionEvents?.events?.filter(
          (e: { address: any }) => marketplaces.includes(e.address) === true,
        ),
        nftAuctionEvents.hash,
      );

      await this.minterEventsService.handleNftMinterEvents(
        nftAuctionEvents?.events?.filter(
          (e: { address: any }) => minters.includes(e.address) === true,
        ),
        nftAuctionEvents.hash,
      );
    }
  }
}
